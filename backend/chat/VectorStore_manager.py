from pathlib import Path
from llama_index.core import SimpleDirectoryReader, PropertyGraphIndex , VectorStoreIndex
from llama_index.core.graph_stores import SimplePropertyGraphStore
import os
import logging
import pickle
from threading import Thread

logger = logging.getLogger(__name__)

class VectorStoreManager:
    """Manages property graph operations and storage."""

    
    def __init__(self, settings, model_manager, vector_store_manager):
        self.settings = settings
        self.model_manager = model_manager
        self.vector_store_manager = vector_store_manager
        self.documents = None
        self.index = None
        self._document_cache = None  # Add document cache

    def load_documents(self) -> bool:
        if self._document_cache is not None:
            self.documents = self._document_cache
            return True
            
        try:
            if not os.path.exists(self.settings.pdf_directory):
                raise FileNotFoundError(f"PDF directory not found: {self.settings.pdf_directory}")
            
            self.documents = SimpleDirectoryReader(self.settings.pdf_directory).load_data()
            self._document_cache = self.documents  # Cache documents
            return True
        except Exception as e:
            logger.error(f"Error loading documents: {str(e)}", exc_info=True)
            return False

    def create_knowledge_graph(self) -> bool:
        try:
            self.index_KG = PropertyGraphIndex.from_documents(
                self.documents,
                llm=self.model_manager.llm,
                embed_model=self.model_manager.embed_model,
                property_graph_store=SimplePropertyGraphStore(),
                vector_store=self.vector_store_manager.get_vector_store(),
            )


            self.index_KG.property_graph_store.save_networkx_graph(name=self.settings.graph_file)
            self.index_KG.storage_context.persist(persist_dir=self.settings.storage_dir)
            

            return True
        except Exception as e:
            logger.error(f"Error creating knowledge graph: {str(e)}", exc_info=True)
            return False

    def load_existing_graph(self) -> bool:
        try:
            self.index_KG = PropertyGraphIndex.from_existing(
                SimplePropertyGraphStore.from_persist_dir(self.settings.storage_dir),
                vector_store=self.vector_store_manager.get_vector_store(),
                llm=self.model_manager.llm
            )
            return True
        except Exception as e:
            logger.error(f"Error loading existing graph: {str(e)}", exc_info=True)
            return False
    
    def create_vector_store(self) -> bool:
        """Create a new vector store from documents."""
        try:
            if not self.documents:
                logger.error("No documents loaded to create vector store from")
                return False
                
            self.index_vector = VectorStoreIndex.from_documents(
                self.documents,
                embed_model=self.model_manager.embed_model,
                vector_store=self.vector_store_manager.get_vector_store()
            )
            
            vector_file = os.path.join(self.settings.storage_dir, "vector_store.pkl")
            with open(vector_file, "wb") as f:
                pickle.dump(self.index_vector, f)
                logger.info(f"Saved index to {vector_file}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error creating vector store: {str(e)}", exc_info=True)
            return False


    def load_existing_vector_store(self) -> bool:
        """Load an existing vector store from storage."""
        try:
            # Step 1: Check if vector file already exists
            vector_file = os.path.join(self.settings.storage_dir, "vector_store.pkl")
            if os.path.exists(vector_file):
                with open(vector_file, "rb") as f:
                    self.index_vector = pickle.load(f)
                    logger.info(f"Loaded index from {vector_file}")
                    return True
                
        except Exception as e:
            logger.error(f"Error loading vector store: {str(e)}", exc_info=True)
            return False

    def can_load_existing_graph(self) -> bool:
        """Check if a valid property graph exists in storage."""
        try:
            required_files = ['docstore.json', 'graph_store.json']
            storage_path = Path(self.settings.storage_dir)
            
            if not storage_path.exists():
                return False
                
            existing_files = os.listdir(storage_path)
            return all(file in existing_files for file in required_files)
        except Exception as e:
            logger.error(f"Error checking for existing graph: {str(e)}", exc_info=True)
            return False
    
    def can_load_existing_vector_store(self) -> bool:
        """Check if a valid vector store exists in storage."""
        try:
            vector_file = os.path.join(self.settings.storage_dir, "vector_store.pkl")
            
            # Step 1: Check if vector file already exists
            if os.path.exists(vector_file):
                with open(vector_file, "rb") as f:
                    return True
            return False
            
        except Exception as e:
            logger.error(f"Error checking for existing vector store: {str(e)}", exc_info=True)
            return False
    
    def _load_or_create_vector_store(self) -> bool:
        """Helper method to handle vector store loading/creation"""
        if self.can_load_existing_vector_store():
            logger.info("Found existing vector store. Loading from storage...")
            return self.load_existing_vector_store()
        else:
            logger.info("No existing vector store found. Creating new one...")
            if not self.load_documents():
                return False
            return self.create_vector_store()

    def _load_or_create_graph(self) -> bool:
        """Helper method to handle graph loading/creation"""
        if self.can_load_existing_graph():
            logger.info("Found existing property graph. Loading from storage...")
            return self.load_existing_graph()
        else:
            logger.info("No existing property graph found. Creating new one...")
            if not self.load_documents():
                return False
            return self.create_knowledge_graph()

    def run(self) -> bool:
        """Initialize both vector store and graph components using threads."""
        try:
            vector_store_success = [True]  # Using list to make it mutable in threads
            graph_success = [True]

            def vector_store_thread():
                vector_store_success[0] = self._load_or_create_vector_store()

            def graph_thread():
                graph_success[0] = self._load_or_create_graph()

            # Create and start threads
            t1 = Thread(target=vector_store_thread)
            t2 = Thread(target=graph_thread)
            
            t1.start()
            t2.start()

            # Wait for both threads to complete
            t1.join()
            t2.join()

            return vector_store_success[0] and graph_success[0]

        except Exception as e:
            logger.error(f"Error in VectorStoreManager run: {str(e)}", exc_info=True)
            return False
