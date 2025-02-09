import chromadb
from llama_index.vector_stores.chroma import ChromaVectorStore
import logging

logger = logging.getLogger(__name__)

class ChromaStoreManager:
    """Manages ChromaDB vector store operations."""

    def __init__(self, settings):
        self.settings = settings
        self.chroma_client = None
        self.collection = None

    def initialize(self) -> bool:
        try:
            self.chroma_client = chromadb.PersistentClient(path=self.settings.chroma_db_path)
            self.collection = self.chroma_client.get_or_create_collection("property_graph_store")
            return True
        except Exception as e:
            logger.error(f"Error initializing vector store: {str(e)}", exc_info=True)
            return False

    def get_vector_store(self):
        return ChromaVectorStore(chroma_collection=self.collection) 