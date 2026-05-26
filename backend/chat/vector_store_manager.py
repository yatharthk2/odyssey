import logging
import os
import pickle
from pathlib import Path
from threading import Thread

from llama_index.core import PropertyGraphIndex, SimpleDirectoryReader, VectorStoreIndex
from llama_index.core.graph_stores import SimplePropertyGraphStore

logger = logging.getLogger(__name__)


class VectorStoreManager:
    """Builds and loads the knowledge graph (KG) and plain vector indices.

    Both indices share the underlying Chroma collection but are persisted separately:
      - PropertyGraphIndex: ./storage/{docstore,graph_store}.json + ./kg.html viz
      - VectorStoreIndex:   ./storage/vector_store.pkl
    """

    def __init__(self, settings, model_manager, chroma_store_manager):
        self.settings = settings
        self.model_manager = model_manager
        self.chroma_store_manager = chroma_store_manager
        self.documents = None
        self.index_KG = None
        self.index_vector = None
        self._document_cache = None

    # ------------------------------------------------------------------ documents

    def load_documents(self) -> bool:
        if self._document_cache is not None:
            self.documents = self._document_cache
            return True

        try:
            if not os.path.exists(self.settings.pdf_directory):
                raise FileNotFoundError(f"PDF directory not found: {self.settings.pdf_directory}")

            self.documents = SimpleDirectoryReader(self.settings.pdf_directory).load_data()
            self._document_cache = self.documents
            return True
        except Exception as e:
            logger.error(f"Error loading documents: {e}", exc_info=True)
            return False

    # ------------------------------------------------------------------ knowledge graph

    def create_knowledge_graph(self) -> bool:
        try:
            self.index_KG = PropertyGraphIndex.from_documents(
                self.documents,
                llm=self.model_manager.llm,
                embed_model=self.model_manager.embed_model,
                property_graph_store=SimplePropertyGraphStore(),
                vector_store=self.chroma_store_manager.get_vector_store(),
            )
            self.index_KG.property_graph_store.save_networkx_graph(name=self.settings.graph_file)
            self.index_KG.storage_context.persist(persist_dir=self.settings.storage_dir)
            return True
        except Exception as e:
            logger.error(f"Error creating knowledge graph: {e}", exc_info=True)
            return False

    def load_existing_graph(self) -> bool:
        try:
            self.index_KG = PropertyGraphIndex.from_existing(
                SimplePropertyGraphStore.from_persist_dir(self.settings.storage_dir),
                vector_store=self.chroma_store_manager.get_vector_store(),
                llm=self.model_manager.llm,
            )
            return True
        except UnicodeDecodeError as e:
            logger.error(f"Encoding error while loading graph: {e}")
            self._cleanup_corrupt_files()
            return False
        except Exception as e:
            logger.error(f"Error loading existing graph: {e}", exc_info=True)
            return False

    def can_load_existing_graph(self) -> bool:
        try:
            storage_path = Path(self.settings.storage_dir)
            if not storage_path.exists():
                return False
            required = {"docstore.json", "graph_store.json"}
            existing = set(os.listdir(storage_path))
            return required.issubset(existing)
        except Exception as e:
            logger.error(f"Error checking for existing graph: {e}", exc_info=True)
            return False

    def _cleanup_corrupt_files(self) -> None:
        """Remove corrupt storage files so the next initialize() rebuilds cleanly."""
        for filename in ("graph_store.json", "docstore.json"):
            try:
                path = Path(self.settings.storage_dir) / filename
                if path.exists():
                    path.unlink()
                    logger.warning(f"Removed corrupt file: {path}")
            except Exception as e:
                logger.error(f"Error cleaning up {filename}: {e}", exc_info=True)

    # ------------------------------------------------------------------ vector store

    def create_vector_store(self) -> bool:
        try:
            if not self.documents:
                logger.error("No documents loaded to create vector store from")
                return False

            self.index_vector = VectorStoreIndex.from_documents(
                self.documents,
                embed_model=self.model_manager.embed_model,
                vector_store=self.chroma_store_manager.get_vector_store(),
            )

            vector_file = os.path.join(self.settings.storage_dir, "vector_store.pkl")
            with open(vector_file, "wb") as f:
                pickle.dump(self.index_vector, f)
            logger.info(f"Saved vector index to {vector_file}")
            return True
        except Exception as e:
            logger.error(f"Error creating vector store: {e}", exc_info=True)
            return False

    def load_existing_vector_store(self) -> bool:
        try:
            vector_file = os.path.join(self.settings.storage_dir, "vector_store.pkl")
            if not os.path.exists(vector_file):
                return False
            with open(vector_file, "rb") as f:
                self.index_vector = pickle.load(f)
            logger.info(f"Loaded vector index from {vector_file}")
            return True
        except Exception as e:
            logger.error(f"Error loading vector store: {e}", exc_info=True)
            return False

    def can_load_existing_vector_store(self) -> bool:
        vector_file = os.path.join(self.settings.storage_dir, "vector_store.pkl")
        return os.path.exists(vector_file)

    # ------------------------------------------------------------------ orchestration

    def _load_or_create_vector_store(self) -> bool:
        if self.can_load_existing_vector_store():
            logger.info("Found existing vector store. Loading from storage...")
            return self.load_existing_vector_store()
        logger.info("No existing vector store found. Creating new one...")
        if not self.load_documents():
            return False
        return self.create_vector_store()

    def _load_or_create_graph(self) -> bool:
        if self.can_load_existing_graph():
            logger.info("Found existing property graph. Loading from storage...")
            if self.load_existing_graph():
                return True
            logger.info("Failed to load existing graph. Creating new one...")
        else:
            logger.info("No existing property graph found. Creating new one...")
        if not self.load_documents():
            return False
        return self.create_knowledge_graph()

    def run(self) -> bool:
        """Build both indices in parallel threads. Returns True only if both succeed."""
        results = {"vector": True, "graph": True}

        def build_vector() -> None:
            results["vector"] = self._load_or_create_vector_store()

        def build_graph() -> None:
            results["graph"] = self._load_or_create_graph()

        threads = [Thread(target=build_vector), Thread(target=build_graph)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        return all(results.values())
