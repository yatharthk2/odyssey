import os
import logging
from pathlib import Path
import chromadb
from llama_index.core import SimpleDirectoryReader, PropertyGraphIndex, Settings
from llama_index.core.graph_stores import SimplePropertyGraphStore
from llama_index.llms.groq import Groq
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.vector_stores.chroma import ChromaVectorStore
import colorama
from llama_index.core.indices.query.query_transform import HyDEQueryTransform
from llama_index.core.query_engine import TransformQueryEngine
from chatdata import Chat
from prompt import contextualized_query
from concurrent.futures import ThreadPoolExecutor
from typing import Iterator
from queue import Queue
import threading
from settings import PropertyGraphSettings

logger = logging.getLogger(__name__)



class PropertyGraphSummarizer:
    """Manages the property graph-based document analysis and query system."""


    def __init__(self, settings: PropertyGraphSettings):
        self.settings = settings
        self.documents = None
        self.index = None
        self.query_engine = None
        self.chroma_client = None
        self.collection = None
        self.llm = None
        self.embed_model = None
        self.chat = Chat(settings.chat_size)  # Initialize the chat history
        self.thread_pool = ThreadPoolExecutor(max_workers=settings.thread_pool_size)  # Adjust based on CPU cores


    def initialize_system(self) -> bool:
        """Initialize all components of the system."""
        try:
            Path(self.settings.storage_dir).mkdir(parents=True, exist_ok=True)

            if not self.initialize_models():
                return False
            if not self.initialize_vector_store():
                return False

            if self.can_load_existing_graph():
                logger.info("Found existing property graph. Loading from storage...")
                if not self.load_existing_graph():
                    return False
            else:
                logger.info("No existing property graph found. Creating new one...")
                if not self.load_documents():
                    return False
                if not self.create_knowledge_graph():
                    return False

            if not self.setup_query_engine():
                return False

            return True
        except Exception as e:
            logger.error(f"Error initializing system: {str(e)}", exc_info=True)
            return False

    def initialize_models(self) -> bool:
        """Initialize LLM and embedding models."""
        try:
            self.llm = Groq(
                model=self.settings.groq_model,
                api_key=self.settings.groq_api_key
            )
            Settings.llm = self.llm

            self.embed_model = HuggingFaceEmbedding(
                model_name=self.settings.embedding_model
            )
            Settings.embed_model = self.embed_model
            Settings.chunk_size = self.settings.chunk_size

            logger.info("Successfully initialized LLM and embedding models")
            return True
        except Exception as e:
            logger.error(f"Error initializing models: {str(e)}", exc_info=True)
            return False

    def initialize_vector_store(self) -> bool:
        """Initialize ChromaDB vector store efficiently."""
        try:
            if self.chroma_client is None:  # Prevent redundant initialization
                self.chroma_client = chromadb.PersistentClient(path=self.settings.chroma_db_path)

            if self.collection is None:
                self.collection = self.chroma_client.get_or_create_collection("property_graph_store")

            logger.info("Successfully initialized ChromaDB vector store")
            return True
        except Exception as e:
            logger.error(f"Error initializing vector store: {str(e)}", exc_info=True)
            return False

    def can_load_existing_graph(self) -> bool:
        """Check if a valid property graph exists in storage."""
        try:
            required_files = ['docstore.json', 'graph_store.json']
            storage_path = Path(self.settings.storage_dir)
            
            if not storage_path.exists():
                return False
                
            existing_files = os.listdir(storage_path)
            has_required_files = all(file in existing_files for file in required_files)
            
            return has_required_files  
        except Exception as e:
            logger.error(f"Error checking for existing graph: {str(e)}", exc_info=True)
            return False

    def load_existing_graph(self) -> bool:
        """Load the property graph from existing storage."""
        try:
            self.index = PropertyGraphIndex.from_existing(
                SimplePropertyGraphStore.from_persist_dir(self.settings.storage_dir),
                vector_store=ChromaVectorStore(chroma_collection=self.collection),
                llm=self.llm
            )
            return True
        
        except Exception as e:
            logger.error(f"Error loading existing graph: {str(e)}", exc_info=True)
            return False

    def load_documents(self) -> bool:
        """Load documents from the PDF directory."""
        try:
            if not os.path.exists(self.settings.pdf_directory):
                raise FileNotFoundError(f"PDF directory not found: {self.settings.pdf_directory}")
            
            self.documents = SimpleDirectoryReader(self.settings.pdf_directory).load_data()
            logger.info(f"Loaded {len(self.documents)} documents")
            return True
        except Exception as e:
            logger.error(f"Error loading documents: {str(e)}", exc_info=True)
            return False

    def create_knowledge_graph(self) -> bool:
        """Create and save the property graph index."""
        try:
            self.index = PropertyGraphIndex.from_documents(
                self.documents,
                llm=self.llm,
                embed_model=self.embed_model,
                property_graph_store=SimplePropertyGraphStore(),
                vector_store=ChromaVectorStore(chroma_collection=self.collection),
                # show_progress=True
            )

            self.index.property_graph_store.save_networkx_graph(name=self.settings.graph_file)
            self.index.storage_context.persist(persist_dir=self.settings.storage_dir)
            
            return True
        except Exception as e:
            logger.error(f"Error creating knowledge graph: {str(e)}", exc_info=True)
            return False

    def setup_query_engine(self) -> bool:
        """Set up the query engine using the loaded/created index."""
        try:
            self.query_engine = self.index.as_query_engine(include_text=True , streaming=True)
            return True
        except Exception as e:
            logger.error(f"Error setting up query engine: {str(e)}", exc_info=True)
            return False
        

    def query(self, question: str, query_transformation: str = None) -> Iterator[str]:
        """Process a query and return streaming response in real-time."""
        try:
            self.chat.append({"role": "user", "content": question})
            chat_history = self.chat.to_list()
            
            query_context = contextualized_query + '\n'.join(
                f"{msg['role'].capitalize()}: {msg['content']}"
                for msg in chat_history
            ) + f"\nCurrent question: {question}\n"

            # Create a queue for real-time streaming
            response_queue = Queue()
            response_text = []

            # Create a thread to process the query and put chunks into the queue
            def process_and_queue():
                try:
                    for chunk in self._process_query(query_context, query_transformation):
                        response_queue.put(("chunk", chunk))
                        response_text.append(chunk)
                except Exception as e:
                    response_queue.put(("error", str(e)))
                finally:
                    response_queue.put(("done", None))

            thread = threading.Thread(target=process_and_queue)
            thread.start()

            # Yield chunks as they become available
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

            # Update chat history with complete response
            self.chat.append({
                "role": "assistant",
                "content": "".join(response_text) or "I apologize, but I couldn't generate a response to your question."
            })

        except Exception as e:
            error_msg = f"I encountered an error while processing your question: {str(e)}"
            logger.error(f"Error processing query: {str(e)}", exc_info=True)
            self.chat.append({"role": "assistant", "content": error_msg})
            yield error_msg

    def _process_query(self, query_context: str, transformation: str):
        """Process query in a separate thread."""
        query_engine = (
            TransformQueryEngine(self.query_engine, HyDEQueryTransform(include_original=True))
            if transformation == "HyDe"
            else self.query_engine
        )
        
        return query_engine.query(query_context).response_gen

    def cleanup(self) -> None:
        """Cleanup resources including thread pool."""
        try:
            if hasattr(self, 'thread_pool'):
                self.thread_pool.shutdown(wait=True)
            # Only clear chat and model references, don't reset ChromaDB
            if hasattr(self, 'chat'):
                self.chat = None
            if hasattr(self, 'llm') and self.llm:
                self.llm = None
            if hasattr(self, 'embed_model') and self.embed_model:
                self.embed_model = None
            logger.info("Successfully cleaned up resources")
        except Exception as e:
            logger.error(f"Error during cleanup: {str(e)}", exc_info=True)

    def __del__(self) -> None:
        """Destructor to ensure resource cleanup."""
        self.cleanup()

if __name__ == '__main__':
    import sys
    import os
    from dotenv import load_dotenv
    import colorama
    
    # Initialize colorama for colored output
    colorama.init()
    
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    
    # Load environment variables
    load_dotenv()
    groq_api_key = os.getenv('GROQ_API_KEY')
    if not groq_api_key:
        print(f"{colorama.Fore.RED}Error: GROQ_API_KEY not found in environment variables{colorama.Fore.RESET}")
        sys.exit(1)
    
    # Test configuration
    pdf_directory = "./test_docs"  # Change this to your PDF directory
    
    try:
        # Create test directory if it doesn't exist
        os.makedirs(pdf_directory, exist_ok=True)
        
        # Initialize settings
        settings = PropertyGraphSettings(
            pdf_directory=pdf_directory,
            groq_api_key=groq_api_key
        )
        
        # Initialize the summarizer
        print(f"{colorama.Fore.CYAN}Initializing PropertyGraphSummarizer...{colorama.Fore.RESET}")
        summarizer = PropertyGraphSummarizer(settings=settings)
        
        # Initialize the system
        print(f"{colorama.Fore.CYAN}Setting up the system...{colorama.Fore.RESET}")
        if not summarizer.initialize_system():
            print(f"{colorama.Fore.RED}Failed to initialize system{colorama.Fore.RESET}")
            sys.exit(1)
        
        # Test queries
        test_questions = [
            "What is the main topic of the documents?",
        ]
        
        print(f"\n{colorama.Fore.GREEN}Starting test queries...{colorama.Fore.RESET}")
        for i, question in enumerate(test_questions, 1):
            print(f"\n{colorama.Fore.YELLOW}Test Query {i}: {question}{colorama.Fore.RESET}")
            try:
                # Get streaming response
                print(f"{colorama.Fore.CYAN}Response:{colorama.Fore.RESET}")
                for response_chunk in summarizer.query(question, query_transformation=None):
                    print(response_chunk, end='', flush=True)
                print("\n")
                
            except Exception as e:
                print(f"{colorama.Fore.RED}Error processing query: {str(e)}{colorama.Fore.RESET}")
        
        # Test HyDE query
        print(f"\n{colorama.Fore.GREEN}Testing HyDE query...{colorama.Fore.RESET}")
        hyde_question = "What are the relationships between different concepts in the documents?"
        try:
            print(f"{colorama.Fore.CYAN}Response:{colorama.Fore.RESET}")
            for response_chunk in summarizer.query(hyde_question, query_transformation="HyDe"):
                print(response_chunk, end='', flush=True)
            print("\n")
            
        except Exception as e:
            print(f"{colorama.Fore.RED}Error processing HyDE query: {str(e)}{colorama.Fore.RESET}")
        
        # Test chat history
        print(f"\n{colorama.Fore.GREEN}Testing chat history...{colorama.Fore.RESET}")
        chat_history = summarizer.chat.to_list()
        print(f"Chat history length: {len(chat_history)}")
        for message in chat_history:
            role_color = colorama.Fore.BLUE if message['role'] == 'user' else colorama.Fore.GREEN
            print(f"{role_color}{message['role'].capitalize()}: {message['content'][:100]}...{colorama.Fore.RESET}")
        
    except Exception as e:
        print(f"{colorama.Fore.RED}Test failed with error: {str(e)}{colorama.Fore.RESET}")
        sys.exit(1)
    finally:
        # Cleanup
        if 'summarizer' in locals():
            summarizer.cleanup()
        colorama.deinit()
        
    print(f"\n{colorama.Fore.GREEN}All tests completed successfully!{colorama.Fore.RESET}")
