"""Single source of truth for backend configuration.

Construct via ``PropertyGraphSettings.from_env()`` so secrets and deploy-specific
values are pulled from environment variables, with the literals here serving as
defaults for everything else.

Required env vars (no defaults):
  - GROQ_API_KEY
  - Google_Gemini_API_KEY

Optional env vars (override the defaults below):
  - OPENAI_API_KEY        — only required if DEFAULT_MODEL_PROVIDER=openai or a
                            client requests model_provider=openai at runtime
  - OPENAI_MODEL          — defaults to "gpt-4o-mini" when openai is selected
  - REDIS_URL, DEFAULT_MODEL_PROVIDER, ALLOWED_ORIGINS (comma-separated),
  - HOST, PORT, WEBSOCKET_PATH, PDF_DIRECTORY,
  - SSL_CERT_PATH, SSL_KEY_PATH, SSL_CA_PATH.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field


@dataclass
class PropertyGraphSettings:
    # --- secrets (required, must come from env) -----------------------------
    groq_api_key: str
    google_api_key: str

    # --- optional secrets ---------------------------------------------------
    # OpenAI key is optional — the server only fails if a request actually
    # targets the openai provider without it set.
    openai_api_key: str | None = None

    # --- documents + storage -----------------------------------------------
    pdf_directory: str = "./documents"
    storage_dir: str = "./storage"
    chroma_db_path: str = "./chroma_db"
    graph_file: str = "./kg.html"

    # --- chunking + embedding ----------------------------------------------
    # chunk_size=800 keeps a whole job/project (and its sub-bullets) together
    # in one retrieval unit; smaller sizes (256) shred resume content into
    # half-bullets and tank retrieval precision.
    chunk_size: int = 800
    chunk_overlap: int = 100
    embedding_model: str = "BAAI/bge-base-en-v1.5"
    # top_k=6 — small KB, more context fits without overwhelming the LLM.
    similarity_top_k: int = 6

    # --- LLM providers ------------------------------------------------------
    default_model_provider: str = "groq"  # "groq" | "gemini" | "openai"
    groq_model: str = "llama-3.1-8b-instant"
    # gemini-2.0-pro-exp-02-05 was the retired experimental snapshot.
    google_model: str = "models/gemini-2.5-pro"
    # gpt-4o-mini is the cost-effective default for chat (~$0.15 / $0.60 per
    # million tokens). Bump to "gpt-4o" or "gpt-4.1" for higher reasoning at
    # ~20x the cost.
    openai_model: str = "gpt-4o-mini"
    max_tokens: int = 4096

    # --- chat state ---------------------------------------------------------
    chat_size: int = 10
    thread_pool_size: int = field(default_factory=lambda: os.cpu_count() or 4)

    # --- cache --------------------------------------------------------------
    redis_url: str = "redis://localhost:6379"
    cache_size: int = 6

    # --- HTTP / WebSocket server -------------------------------------------
    host: str = "0.0.0.0"
    port: int = 8000
    websocket_path: str = "/chat"
    allowed_origins: list[str] = field(default_factory=lambda: ["*"])

    # --- SSL (used by the __main__ entrypoint in server.py) ----------------
    ssl_cert_path: str = "/etc/ssl/yatharthk.com.crt"
    ssl_key_path: str = "/etc/ssl/yatharthk.com.key"
    ssl_ca_path: str = "/etc/ssl/ca_bundle.crt"

    @classmethod
    def from_env(cls) -> PropertyGraphSettings:
        """Build a settings object from environment variables.

        Required keys raise ``ValueError`` if missing; everything else falls
        back to the dataclass defaults declared above.
        """
        groq_api_key = os.getenv("GROQ_API_KEY")
        if not groq_api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables")
        google_api_key = os.getenv("Google_Gemini_API_KEY")
        if not google_api_key:
            raise ValueError("Google_Gemini_API_KEY not found in environment variables")

        overrides: dict = {}

        def _str(env: str, attr: str) -> None:
            value = os.getenv(env)
            if value:
                overrides[attr] = value

        def _int(env: str, attr: str) -> None:
            value = os.getenv(env)
            if value:
                overrides[attr] = int(value)

        _str("PDF_DIRECTORY", "pdf_directory")
        _str("REDIS_URL", "redis_url")
        _str("DEFAULT_MODEL_PROVIDER", "default_model_provider")
        _str("HOST", "host")
        _int("PORT", "port")
        _str("WEBSOCKET_PATH", "websocket_path")
        _str("SSL_CERT_PATH", "ssl_cert_path")
        _str("SSL_KEY_PATH", "ssl_key_path")
        _str("SSL_CA_PATH", "ssl_ca_path")
        _str("OPENAI_API_KEY", "openai_api_key")
        _str("OPENAI_MODEL", "openai_model")

        origins_raw = os.getenv("ALLOWED_ORIGINS")
        if origins_raw:
            origins = [o.strip() for o in origins_raw.split(",") if o.strip()]
            if origins:
                overrides["allowed_origins"] = origins

        return cls(
            groq_api_key=groq_api_key,
            google_api_key=google_api_key,
            **overrides,
        )
