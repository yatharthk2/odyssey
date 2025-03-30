from typing import Iterator
from queue import Queue
import threading
from llama_index.core.indices.query.query_transform import HyDEQueryTransform
from llama_index.core.query_engine import TransformQueryEngine
import logging
from .prompt import contextualized_query
import colorama
import asyncio
from .CacheManager import CacheManager

logger = logging.getLogger(__name__)

class QueryEngine:
    """Manages query processing and streaming responses."""

    
    def __init__(self, graph_manager, chat, cache_manager=None):
        self.graph_manager = graph_manager
        self.chat = chat
        self.query_engine_KG = None
        self.query_engine_vector = None
        # Add cached HyDE engines
        self.hyde_engine_KG = None
        self.hyde_engine_vector = None
        # Add cache manager
        self.cache_manager = cache_manager

    def initialize(self) -> bool:
        """Initialize query engines after indexes are ready."""
        try:
            self.query_engine_KG = self.graph_manager.index_KG.as_query_engine(include_text=True, streaming=True)
            self.query_engine_vector = self.graph_manager.index_vector.as_query_engine(include_text=True, streaming=True)
            
            # Initialize HyDE engines
            hyde = HyDEQueryTransform()
            self.hyde_engine_KG = TransformQueryEngine(
                self.query_engine_KG,
                query_transform=hyde
            )
            self.hyde_engine_vector = TransformQueryEngine(
                self.query_engine_vector,
                query_transform=hyde
            )
            return True
        except Exception as e:
            logger.error(f"Error setting up query engine: {str(e)}", exc_info=True)
            return False

    def process_query(self, question: str, query_transformation: str = None, vector_store: str = None) -> Iterator[str]:
        """Process a query and return streaming response in real-time."""
        try:
            # Check cache first if available
            if self.cache_manager and self.cache_manager.is_available():
                cached_response = self.cache_manager.get_cached_response(question)
                if cached_response:
                    self.chat.append({"role": "user", "content": question})
                    self.chat.append({"role": "assistant", "content": cached_response})
                    logger.info(f"{colorama.Fore.CYAN}Returning cached response{colorama.Fore.RESET}")
                    yield cached_response
                    return

            self.chat.append({"role": "user", "content": question})
            chat_history = self.chat.to_list()
            
            query_context = contextualized_query + '\n'.join(
                f"{msg['role'].capitalize()}: {msg['content']}"
                for msg in chat_history
            ) + f"\nCurrent question: {question}\n"

            # Create a queue for real-time streaming
            response_queue = Queue()
            response_text = []

            def process_and_queue():
                try:
                    for chunk in self._process_query(query_context, query_transformation, vector_store):
                        response_queue.put(("chunk", chunk))
                        response_text.append(chunk)
                except Exception as e:
                    response_queue.put(("error", str(e)))
                finally:
                    response_queue.put(("done", None))

            thread = threading.Thread(target=process_and_queue)
            thread.start()

            while True:
                msg_type, content = response_queue.get()
                if msg_type == "chunk":
                    yield content
                elif msg_type == "error":
                    error_msg = f"Error processing query: {content}"
                    logger.error(error_msg)
                    yield error_msg
                    break
                elif msg_type == "done":
                    break

            # Complete response to store in chat history and cache
            complete_response = "".join(response_text) or "I apologize, but I couldn't generate a response to your question."
            
            # Update chat history with complete response
            self.chat.append({
                "role": "assistant",
                "content": complete_response
            })
            
            # Cache the response if cache_manager is available
            if self.cache_manager and self.cache_manager.is_available():
                self.cache_manager.cache_response(question, complete_response)

        except Exception as e:
            error_msg = f"I encountered an error while processing your question: {str(e)}"
            logger.error(f"Error processing query: {str(e)}", exc_info=True)
            self.chat.append({"role": "assistant", "content": error_msg})
            yield error_msg

    def _process_query(self, query_context: str, transformation: str, vector_store: str):
        """Process query in a separate thread."""
        if not self.query_engine_KG or not self.query_engine_vector:
            raise RuntimeError("Query engines not initialized. Call initialize() first.")

        # Log transformation type if HyDE is used
        if transformation == "HyDE":
            logger.info(f"{colorama.Fore.YELLOW}Using HyDE transformation{colorama.Fore.RESET}")
        
        else :
            logger.info(f"{colorama.Fore.YELLOW}Using original query{colorama.Fore.RESET}")
        
        if vector_store == 'KG':
            query_engine = self.hyde_engine_KG if transformation == "HyDE" else self.query_engine_KG
            logger.info(f"{colorama.Fore.GREEN}Using KG query engine{colorama.Fore.RESET}")
        else:  # vector_store == 'SV'
            query_engine = self.hyde_engine_vector if transformation == "HyDE" else self.query_engine_vector
            logger.info(f"{colorama.Fore.GREEN}Using Vector Store query engine{colorama.Fore.RESET}")
        
        # Get the response and check if it's empty
        response = query_engine.query(query_context)
        if not response or not response.response_gen:
            logger.warning("Received empty response from query engine")
            yield "I apologize, but I couldn't find any relevant information in the documents."
            return
        
        # Stream the response
        for chunk in response.response_gen:
            if chunk and chunk.strip():  # Only yield non-empty chunks
                yield chunk 

    async def process_query_async(self, question: str, query_transformation: str = None, vector_store: str = None):
        try:
            self.chat.append({"role": "user", "content": question})
            query_context = self._build_query_context(question)
            
            async for chunk in self._stream_response(query_context, query_transformation, vector_store):
                yield chunk
                
        except Exception as e:
            yield f"Error: {str(e)}"

    async def _stream_response(self, query_context, transformation, vector_store):
        query_engine = self._get_query_engine(transformation, vector_store)
        response = await query_engine.aquery(query_context)
        
        async for chunk in response.response_gen:
            if chunk and chunk.strip():
                yield chunk