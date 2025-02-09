from llama_index.llms.groq import Groq
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.core import Settings
import logging

logger = logging.getLogger(__name__)

class ModelManager:
    """Manages LLM and embedding models."""
    

    def __init__(self, settings):
        self.settings = settings
        self.llm = None
        self.embed_model = None

    def initialize(self) -> bool:
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

            return True
        except Exception as e:
            logger.error(f"Error initializing models: {str(e)}", exc_info=True)
            return False 