from llama_index.llms.groq import Groq
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.core import Settings
from llama_index.llms.gemini import Gemini
import logging

logger = logging.getLogger(__name__)

class ModelManager:
    """Manages LLM and embedding models."""
    
    def __init__(self, settings, model_provider="gemini"):
        self.settings = settings
        self.llm = None
        self.embed_model = None
        self.model_provider = model_provider.lower()  # Convert to lowercase for case-insensitive comparison

    def initialize(self) -> bool:
        try:
            if self.model_provider == "groq":
                logger.info(f"Initializing Groq model: {self.settings.groq_model}")
                self.llm = Groq(
                    model=self.settings.groq_model,
                    api_key=self.settings.groq_api_key
                )
            else:  # default to gemini
                logger.info(f"Initializing Gemini model: {self.settings.google_model}")
                self.llm = Gemini(
                    model=self.settings.google_model,
                    api_key=self.settings.Google_API_KEY
                )
            
            Settings.llm = self.llm
            Settings.chunk_overlap = self.settings.chunk_overlap
            Settings.max_tokens = self.settings.max_tokens

            logger.info(f"Initializing embedding model: {self.settings.embedding_model}")
            self.embed_model = HuggingFaceEmbedding(
                model_name=self.settings.embedding_model
            )
            Settings.embed_model = self.embed_model
            Settings.similarity_top_k = self.settings.similarity_top_k
            Settings.chunk_size = self.settings.chunk_size

            return True
        except Exception as e:
            logger.error(f"Error initializing models: {str(e)}", exc_info=True)
            return False