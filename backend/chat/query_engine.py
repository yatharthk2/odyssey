import asyncio
import logging
import threading
import time
from collections.abc import AsyncIterator, Iterator

from llama_index.core.indices.query.query_transform import HyDEQueryTransform
from llama_index.core.query_engine import TransformQueryEngine

from . import metrics
from .CacheManager import CacheManager
from .chatdata import Chat
from .output_filter import StreamRedactor, redact_text
from .prompt import contextualized_query
from .retry import call_with_retry

logger = logging.getLogger(__name__)

# Generic, non-leaking messages shown to clients. Real errors are logged
# server-side with a traceback.
GENERIC_ERROR = "Sorry, something went wrong on my end. Please try again."
GENERIC_TIMEOUT = "Sorry, that took too long. Please try asking again."
_FALLBACK = "I apologize, but I couldn't generate a response to your question."


def _load_system_prompt(settings) -> str:
    """Resolve the persona system prompt.

    PROMPT_PATH unset (the default) keeps Yatharth's built-in prompt. When set,
    the prompt is read from that file so a second persona can run off the same
    image with its own identity. A configured-but-unreadable/empty path is a
    hard error on purpose: silently falling back to the built-in prompt would
    make one persona answer as someone else.
    """
    path = getattr(settings, "prompt_path", None)
    if not path:
        return contextualized_query
    try:
        with open(path, encoding="utf-8") as f:
            text = f.read().strip()
    except OSError as e:
        raise RuntimeError(f"PROMPT_PATH={path!r} could not be read: {e}") from e
    if not text:
        raise RuntimeError(f"PROMPT_PATH={path!r} is empty")
    logger.info("Loaded persona system prompt from %s", path)
    return text


class QueryEngine:
    """Manages query processing and streaming responses."""

    def __init__(self, graph_manager, cache_manager: CacheManager | None = None):
        self.graph_manager = graph_manager
        self.cache_manager = cache_manager
        self.system_prompt = _load_system_prompt(graph_manager.settings)
        self.query_engine_KG = None
        self.query_engine_vector = None
        self.hyde_engine_KG = None
        self.hyde_engine_vector = None

    def initialize(self) -> bool:
        """Initialize query engines after indexes are ready."""
        try:
            # similarity_top_k must be passed here — setting it on the global
            # LlamaIndex Settings does NOT propagate to as_query_engine(), which
            # otherwise silently defaults to top_k=2.
            top_k = self.graph_manager.settings.similarity_top_k
            self.query_engine_KG = self.graph_manager.index_KG.as_query_engine(
                include_text=True,
                streaming=True,
                similarity_top_k=top_k,
            )
            self.query_engine_vector = self.graph_manager.index_vector.as_query_engine(
                include_text=True,
                streaming=True,
                similarity_top_k=top_k,
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

    def _cache_lookup(self, question: str) -> str | None:
        if self.cache_manager and self.cache_manager.is_available():
            return self.cache_manager.get_cached_response(question)
        return None

    def _cache_store(self, question: str, response: str) -> None:
        if self.cache_manager and self.cache_manager.is_available():
            self.cache_manager.cache_response(question, response)

    async def process_query(
        self,
        question: str,
        chat: Chat,
        query_transformation: str | None = None,
        vector_store: str | None = None,
    ) -> AsyncIterator[str]:
        """Process a query and yield streaming response chunks.

        Async-native: the blocking LlamaIndex stream runs on a worker thread and
        feeds an asyncio.Queue via ``call_soon_threadsafe``, so the event loop is
        never blocked and concurrent connections stream independently. A watchdog
        (``query_timeout_seconds``) frees the connection if a chunk never arrives.

        ``chat`` is the per-connection conversation history, passed in by the
        caller, so one visitor's turns never leak into another's prompt.
        """
        engine_label = "kg" if vector_store == "KG" else "vector"
        transform_label = "hyde" if query_transformation == "HyDE" else "none"
        start = time.monotonic()

        try:
            # Cache lookup off the event loop (Redis is a network call).
            cached = await asyncio.to_thread(self._cache_lookup, question)
            if cached is not None:
                chat.append({"role": "user", "content": question})
                chat.append({"role": "assistant", "content": cached})
                logger.info("Returning cached response")
                metrics.QUERIES.labels(
                    engine=engine_label, transformation=transform_label, cache="hit"
                ).inc()
                metrics.LATENCY.observe(time.monotonic() - start)
                yield cached
                return

            chat.append({"role": "user", "content": question})
            # Only the last 4 turns (8 messages) are dumped into the prompt.
            # Older history dilutes both retrieval and synthesis without adding
            # signal — the Chat deque still preserves them for future reference.
            recent_history = chat.to_list()[-8:]

            query_context = (
                self.system_prompt
                + "\n".join(
                    f"{msg['role'].capitalize()}: {msg['content']}" for msg in recent_history
                )
                + f"\nCurrent question: {question}\n"
            )

            # Run the blocking LlamaIndex stream on a worker thread; bridge chunks
            # back to the loop through an asyncio.Queue.
            loop = asyncio.get_running_loop()
            queue: asyncio.Queue = asyncio.Queue()
            response_text: list[str] = []
            stop = threading.Event()

            def produce() -> None:
                try:
                    for chunk in self._stream_chunks(
                        query_context, query_transformation, vector_store
                    ):
                        if stop.is_set():
                            break
                        loop.call_soon_threadsafe(queue.put_nowait, ("chunk", chunk))
                except Exception as e:
                    loop.call_soon_threadsafe(queue.put_nowait, ("error", str(e)))
                finally:
                    loop.call_soon_threadsafe(queue.put_nowait, ("done", None))

            threading.Thread(target=produce, daemon=True).start()

            # Redact contact PII from the stream as a backstop, holding back a
            # trailing window so a phone/email split across chunks is still caught.
            redactor = StreamRedactor()
            errored = False
            timed_out = False
            first_chunk = True
            timeout = self.graph_manager.settings.query_timeout_seconds

            try:
                while True:
                    try:
                        msg_type, content = await asyncio.wait_for(queue.get(), timeout=timeout)
                    except TimeoutError:
                        timed_out = True
                        logger.warning("Query timed out after %ss", timeout)
                        metrics.ERRORS.labels(stage="timeout").inc()
                        tail = redactor.flush()
                        if tail:
                            yield tail
                        yield GENERIC_TIMEOUT
                        break

                    if msg_type == "chunk":
                        if first_chunk:
                            metrics.TTFB.observe(time.monotonic() - start)
                            first_chunk = False
                        response_text.append(content)
                        safe = redactor.feed(content)
                        if safe:
                            yield safe
                    elif msg_type == "error":
                        logger.error("Streaming error from query engine: %s", content)
                        metrics.ERRORS.labels(stage="stream").inc()
                        tail = redactor.flush()
                        if tail:
                            yield tail
                        errored = True
                        yield GENERIC_ERROR
                        break
                    else:  # "done"
                        tail = redactor.flush()
                        if tail:
                            yield tail
                        break
            finally:
                stop.set()  # let the producer thread exit promptly

            if timed_out:
                chat.append({"role": "assistant", "content": GENERIC_TIMEOUT})
            else:
                complete_response = redact_text("".join(response_text)) or _FALLBACK
                chat.append({"role": "assistant", "content": complete_response})
                # Never cache a failed/partial response.
                if not errored:
                    await asyncio.to_thread(self._cache_store, question, complete_response)

            metrics.QUERIES.labels(
                engine=engine_label, transformation=transform_label, cache="miss"
            ).inc()
            metrics.LATENCY.observe(time.monotonic() - start)

        except Exception as e:
            logger.error(f"Error processing query: {e}", exc_info=True)
            metrics.ERRORS.labels(stage="internal").inc()
            chat.append({"role": "assistant", "content": GENERIC_ERROR})
            yield GENERIC_ERROR

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

        # Retry transient provider failures (429 / 5xx) with backoff. This is
        # the synchronous, in-thread call where rate-limit errors surface.
        max_retries = self.graph_manager.settings.llm_max_retries
        response = call_with_retry(engine.query, query_context, max_attempts=max_retries)
        if not response or not response.response_gen:
            logger.warning("Received empty response from query engine")
            yield "I apologize, but I couldn't find any relevant information in the documents."
            return

        for chunk in response.response_gen:
            if chunk and chunk.strip():
                yield chunk
