import logging
import threading
from collections.abc import Iterator
from queue import Queue

from llama_index.core.indices.query.query_transform import HyDEQueryTransform
from llama_index.core.query_engine import TransformQueryEngine

from .CacheManager import CacheManager
from .prompt import contextualized_query

logger = logging.getLogger(__name__)


class QueryEngine:
    """Manages query processing and streaming responses."""

    def __init__(self, graph_manager, chat, cache_manager: CacheManager | None = None):
        self.graph_manager = graph_manager
        self.chat = chat
        self.cache_manager = cache_manager
        self.query_engine_KG = None
        self.query_engine_vector = None
        self.hyde_engine_KG = None
        self.hyde_engine_vector = None

    def initialize(self) -> bool:
        """Initialize query engines after indexes are ready."""
        try:
            self.query_engine_KG = self.graph_manager.index_KG.as_query_engine(
                include_text=True,
                streaming=True,
            )
            self.query_engine_vector = self.graph_manager.index_vector.as_query_engine(
                include_text=True,
                streaming=True,
            )

            hyde = HyDEQueryTransform()
            self.hyde_engine_KG = TransformQueryEngine(self.query_engine_KG, query_transform=hyde)
            self.hyde_engine_vector = TransformQueryEngine(
                self.query_engine_vector, query_transform=hyde
            )
            return True
        except Exception as e:
            logger.error(f"Error setting up query engine: {e}", exc_info=True)
            return False

    def process_query(
        self,
        question: str,
        query_transformation: str | None = None,
        vector_store: str | None = None,
    ) -> Iterator[str]:
        """Process a query and yield streaming response chunks."""
        try:
            if self.cache_manager and self.cache_manager.is_available():
                cached_response = self.cache_manager.get_cached_response(question)
                if cached_response:
                    self.chat.append({"role": "user", "content": question})
                    self.chat.append({"role": "assistant", "content": cached_response})
                    logger.info("Returning cached response")
                    yield cached_response
                    return

            self.chat.append({"role": "user", "content": question})
            # Only the last 4 turns (8 messages) are dumped into the prompt.
            # Older history dilutes both retrieval and synthesis without adding
            # signal — the Chat deque still preserves them for future reference.
            recent_history = self.chat.to_list()[-8:]

            query_context = (
                contextualized_query
                + "\n".join(
                    f"{msg['role'].capitalize()}: {msg['content']}" for msg in recent_history
                )
                + f"\nCurrent question: {question}\n"
            )

            # Bridge the sync streaming iterator from LlamaIndex into our generator
            # via a thread + queue so the WebSocket handler can await chunks.
            response_queue: Queue = Queue()
            response_text: list[str] = []

            def produce() -> None:
                try:
                    for chunk in self._stream_chunks(
                        query_context, query_transformation, vector_store
                    ):
                        response_queue.put(("chunk", chunk))
                        response_text.append(chunk)
                except Exception as e:
                    response_queue.put(("error", str(e)))
                finally:
                    response_queue.put(("done", None))

            threading.Thread(target=produce, daemon=True).start()

            while True:
                msg_type, content = response_queue.get()
                if msg_type == "chunk":
                    yield content
                elif msg_type == "error":
                    error_msg = f"Error processing query: {content}"
                    logger.error(error_msg)
                    yield error_msg
                    break
                else:  # "done"
                    break

            complete_response = (
                "".join(response_text)
                or "I apologize, but I couldn't generate a response to your question."
            )
            self.chat.append({"role": "assistant", "content": complete_response})

            if self.cache_manager and self.cache_manager.is_available():
                self.cache_manager.cache_response(question, complete_response)

        except Exception as e:
            error_msg = f"I encountered an error while processing your question: {e}"
            logger.error(f"Error processing query: {e}", exc_info=True)
            self.chat.append({"role": "assistant", "content": error_msg})
            yield error_msg

    def _stream_chunks(
        self,
        query_context: str,
        transformation: str | None,
        vector_store: str | None,
    ) -> Iterator[str]:
        """Pick the right engine and yield non-empty response chunks."""
        if not self.query_engine_KG or not self.query_engine_vector:
            raise RuntimeError("Query engines not initialized. Call initialize() first.")

        use_hyde = transformation == "HyDE"
        use_kg = vector_store == "KG"

        if use_kg:
            engine = self.hyde_engine_KG if use_hyde else self.query_engine_KG
            logger.info("Using KG query engine%s", " with HyDE" if use_hyde else "")
        else:
            engine = self.hyde_engine_vector if use_hyde else self.query_engine_vector
            logger.info("Using vector query engine%s", " with HyDE" if use_hyde else "")

        response = engine.query(query_context)
        if not response or not response.response_gen:
            logger.warning("Received empty response from query engine")
            yield "I apologize, but I couldn't find any relevant information in the documents."
            return

        for chunk in response.response_gen:
            if chunk and chunk.strip():
                yield chunk
