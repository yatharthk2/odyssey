import logging

from llama_index.core import Settings
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.llms.gemini import Gemini
from llama_index.llms.groq import Groq
from llama_index.llms.openai import OpenAI

logger = logging.getLogger(__name__)

SUPPORTED_PROVIDERS = ("groq", "gemini", "openai")


class ModelManager:
    """Initializes the LLM + embedding model and writes them into the LlamaIndex global Settings."""

    def __init__(self, settings, model_provider: str = "gemini"):
        self.settings = settings
        self.model_provider = model_provider.lower()
        if self.model_provider not in SUPPORTED_PROVIDERS:
            raise ValueError(
                f"Unsupported model_provider {self.model_provider!r}. "
                f"Expected one of: {', '.join(SUPPORTED_PROVIDERS)}"
            )
        self.llm = None
        self.embed_model = None

    def initialize(self) -> bool:
        try:
            if self.model_provider == "groq":
                logger.info(f"Initializing Groq model: {self.settings.groq_model}")
                self.llm = Groq(model=self.settings.groq_model, api_key=self.settings.groq_api_key)
            elif self.model_provider == "openai":
                if not self.settings.openai_api_key:
                    raise ValueError(
                        "OPENAI_API_KEY is required when model_provider=openai. "
                        "Set it in the environment or via settings.openai_api_key."
                    )
                logger.info(f"Initializing OpenAI model: {self.settings.openai_model}")
                self.llm = OpenAI(
                    model=self.settings.openai_model,
                    api_key=self.settings.openai_api_key,
                    max_tokens=self.settings.max_tokens,
                )
            else:  # gemini
                logger.info(f"Initializing Gemini model: {self.settings.google_model}")
                self.llm = Gemini(model=self.settings.google_model, api_key=self.settings.google_api_key)

            Settings.llm = self.llm
            Settings.chunk_overlap = self.settings.chunk_overlap
            Settings.max_tokens = self.settings.max_tokens

            logger.info(f"Initializing embedding model: {self.settings.embedding_model}")
            self.embed_model = HuggingFaceEmbedding(model_name=self.settings.embedding_model)
            Settings.embed_model = self.embed_model
            Settings.similarity_top_k = self.settings.similarity_top_k
            Settings.chunk_size = self.settings.chunk_size

            return True
        except Exception as e:
            logger.error(f"Error initializing models: {e}", exc_info=True)
            return False
