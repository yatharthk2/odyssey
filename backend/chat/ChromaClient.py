import logging

import chromadb
from llama_index.vector_stores.chroma import ChromaVectorStore

logger = logging.getLogger(__name__)


class ChromaStoreManager:
    """Owns the persistent ChromaDB client + the single shared collection used by both indices."""

    COLLECTION_NAME = "property_graph_store"

    def __init__(self, settings):
        self.settings = settings
        self.chroma_client = None
        self.collection = None

    def initialize(self) -> bool:
        try:
            self.chroma_client = chromadb.PersistentClient(path=self.settings.chroma_db_path)
            self.collection = self.chroma_client.get_or_create_collection(self.COLLECTION_NAME)
            return True
        except Exception as e:
            logger.error(f"Error initializing Chroma vector store: {e}", exc_info=True)
            return False

    def get_vector_store(self) -> ChromaVectorStore:
        return ChromaVectorStore(chroma_collection=self.collection)
