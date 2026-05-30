import logging
import threading
from collections.abc import Iterator
from concurrent.futures import ThreadPoolExecutor
from contextlib import contextmanager
from pathlib import Path

from .CacheManager import CacheManager
from .chatdata import Chat
from .ChromaClient import ChromaStoreManager
from .ModelsManager import ModelManager
from .query_engine import QueryEngine
from .vector_store_manager import VectorStoreManager

logger = logging.getLogger(__name__)


class ChatManager:
    """Coordinates the document analysis and query system components."""

    def __init__(self, settings, model_provider: str | None = None):
        self.settings = settings
        provider = model_provider or settings.default_model_provider
        self.model_manager = ModelManager(settings, provider)
        self.chroma_store_manager = ChromaStoreManager(settings)
        self.chat = Chat(settings.chat_size)
        self.vector_store_manager = VectorStoreManager(
            settings,
            self.model_manager,
            self.chroma_store_manager,
        )
        self.cache_manager: CacheManager | None = None
        if settings.redis_url:
            self.cache_manager = CacheManager(
                redis_url=settings.redis_url,
                max_cached_items=settings.cache_size,
            )
            logger.info(f"Initialized cache manager with Redis at {settings.redis_url}")
        else:
            logger.info("Redis URL not configured, caching disabled")
        self.query_engine = QueryEngine(self.vector_store_manager, self.chat, self.cache_manager)
        self.thread_pool = ThreadPoolExecutor(max_workers=settings.thread_pool_size)
        # Guards reinitialization when a client requests a different model provider.
        self._swap_lock = threading.Lock()

    def initialize_system(self) -> bool:
        """Initialize all components of the system."""
        try:
            Path(self.settings.storage_dir).mkdir(parents=True, exist_ok=True)

            if not self.model_manager.initialize():
                return False
            if not self.chroma_store_manager.initialize():
                return False
            if not self.vector_store_manager.run():
                return False
            return self.query_engine.initialize()
        except Exception as e:
            logger.error(f"Error initializing system: {e}", exc_info=True)
            return False

    def query(
        self,
        question: str,
        query_transformation: str | None = None,
        choice_of_vector_store: str | None = None,
    ) -> Iterator[str]:
        return self.query_engine.process_query(
            question, query_transformation, choice_of_vector_store
        )

    @contextmanager
    def managed_resources(self):
        try:
            yield self
        finally:
            self.cleanup()

    def cleanup(self) -> None:
        """Release all owned resources. Idempotent."""
        if getattr(self, "thread_pool", None) is not None:
            try:
                self.thread_pool.shutdown(wait=True)
            except Exception as e:
                logger.error(f"Error shutting down thread pool: {e}")

        for attr in (
            "thread_pool",
            "chat",
            "model_manager",
            "chroma_store_manager",
            "vector_store_manager",
            "cache_manager",
            "query_engine",
        ):
            setattr(self, attr, None)
