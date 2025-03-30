import os
import logging
from pathlib import Path
import colorama
from .chatdata import Chat
from concurrent.futures import ThreadPoolExecutor
from typing import Iterator
from contextlib import contextmanager

# from .settings import PropertyGraphSettings
from .ModelsManager import ModelManager
from .ChromaClient import ChromaStoreManager
from .VectorStore_manager import VectorStoreManager
from .query_engine import QueryEngine

logger = logging.getLogger(__name__)


class ChatManager:
    """Coordinates the document analysis and query system components."""

    def __init__(self, settings, model_provider="gemini"):
        self.settings = settings
        self.model_manager = ModelManager(settings, model_provider)
        self.Chroma_Store_Manager = ChromaStoreManager(settings)
        self.chat = Chat(settings.chat_size)
        self.Vector_Store_Manager = VectorStoreManager(settings, self.model_manager, self.Chroma_Store_Manager)
        self.query_engine = QueryEngine(self.Vector_Store_Manager, self.chat)
        self.thread_pool = ThreadPoolExecutor(max_workers=settings.thread_pool_size)
        # self.Choice_of_vector_store = 'sv'  # Make sure this matches the case in _process_query

    def initialize_system(self) -> bool:
        """Initialize all components of the system."""
        try:
            Path(self.settings.storage_dir).mkdir(parents=True, exist_ok=True)

            if not self.model_manager.initialize():
                return False
            if not self.Chroma_Store_Manager.initialize():
                return False
            
            if not self.Vector_Store_Manager.run():
                return False

            if not self.query_engine.initialize():
                return False

            return True
        except Exception as e:
            logger.error(f"Error initializing system: {str(e)}", exc_info=True)
            return False



    def query(self, question: str, query_transformation: str = None , choice_of_vector_store: str = None) -> Iterator[str]:
        return self.query_engine.process_query(question, query_transformation, choice_of_vector_store)

    @contextmanager
    def managed_resources(self):
        try:
            yield self
        finally:
            self.cleanup()

    def cleanup(self) -> None:
        """Systematic cleanup of resources."""
        resources = [
            ('thread_pool', lambda x: x.shutdown(wait=True)),
            ('chat', lambda x: None),
            ('model_manager', lambda x: None),
            ('Chroma_Store_Manager', lambda x: None),
            ('Vector_Store_Manager', lambda x: None),
            ('query_engine', lambda x: None)
        ]
        
        for resource_name, cleanup_func in resources:
            try:
                if hasattr(self, resource_name):
                    resource = getattr(self, resource_name)
                    if resource is not None:
                        cleanup_func(resource)
                    setattr(self, resource_name, None)
            except Exception as e:
                logger.error(f"Error cleaning up {resource_name}: {str(e)}")

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
    
    google_api_key = os.getenv('Google_Gemini_API_KEY')
    if not google_api_key:
        print(f"{colorama.Fore.RED}Error: Google_Gemini_API_KEY not found in environment variables{colorama.Fore.RESET}")
        sys.exit(1)

    
    # Test configuration
    pdf_directory = "./test_docs"
    
    try:
        # Create test directory if it doesn't exist
        os.makedirs(pdf_directory, exist_ok=True)
        
        # Initialize settings
        settings = PropertyGraphSettings(
            pdf_directory=pdf_directory,
            groq_api_key=groq_api_key,
            google_api_key=google_api_key
        )
        
        # Initialize the summarizer
        print(f"{colorama.Fore.CYAN}Initializing ChatManager...{colorama.Fore.RESET}")
        chat_manager = ChatManager(settings=settings)
        


        # Initialize the system
        print(f"{colorama.Fore.CYAN}Setting up the system...{colorama.Fore.RESET}")
        if not chat_manager.initialize_system():
            print(f"{colorama.Fore.RED}Failed to initialize system{colorama.Fore.RESET}")
            sys.exit(1)

        
        # Test queries
        test_questions = [
            "Tell me about the main topic of the documents",
        ]
        
        print(f"\n{colorama.Fore.GREEN}Starting test queries...{colorama.Fore.RESET}")
        for i, question in enumerate(test_questions, 1):
            print(f"\n{colorama.Fore.YELLOW}Test Query {i}: {question}{colorama.Fore.RESET}")
            try:
                # Get streaming response
                print(f"{colorama.Fore.CYAN}Response:{colorama.Fore.RESET}")
                for response_chunk in chat_manager.query(question, query_transformation=None, choice_of_vector_store='KG'):
                    print(response_chunk, end='', flush=True)
                print("\n")

                
            except Exception as e:
                print(f"{colorama.Fore.RED}Error processing query: {str(e)}{colorama.Fore.RESET}")
        
        # # Test HyDE query
        # print(f"\n{colorama.Fore.GREEN}Testing HyDE query...{colorama.Fore.RESET}")
        # hyde_question = "tell me something about Yatharth"
        # try:
        #     print(f"{colorama.Fore.CYAN}Response:{colorama.Fore.RESET}")
        #     for response_chunk in chat_manager.query(hyde_question, query_transformation="HyDe"):
        #         print(response_chunk, end='', flush=True)
        #     print("\n")

            
        # except Exception as e:
        #     print(f"{colorama.Fore.RED}Error processing HyDE query: {str(e)}{colorama.Fore.RESET}")
        
        # Test chat history
        print(f"\n{colorama.Fore.GREEN}Testing chat history...{colorama.Fore.RESET}")
        chat_history = chat_manager.chat.to_list()
        print(f"Chat history length: {len(chat_history)}")
        for message in chat_history:
    
            role_color = colorama.Fore.BLUE if message['role'] == 'user' else colorama.Fore.GREEN
            print(f"{role_color}{message['role'].capitalize()}: {message['content'][:100]}...{colorama.Fore.RESET}")
        
    except Exception as e:
        print(f"{colorama.Fore.RED}Test failed with error: {str(e)}{colorama.Fore.RESET}")
        sys.exit(1)
    finally:
        # Cleanup
        if 'chat_manager' in locals():
            chat_manager.cleanup()
        colorama.deinit()
        

    print(f"\n{colorama.Fore.GREEN}All tests completed successfully!{colorama.Fore.RESET}")
