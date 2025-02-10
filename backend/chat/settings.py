from dataclasses import dataclass, field
from typing import Optional
import os

@dataclass
class PropertyGraphSettings:
    """Settings for PropertyGraphSummarizer"""
    pdf_directory: str
    groq_api_key: str
    chat_size: int = field(default=10)
    # storage_dir_Kg: str = "./storage_Kg"
    # storage_dir_SV: str = "./storage_SV"
    storage_dir: str = field(default="./storage")


    chroma_db_path: str = field(default="./chroma_db")
    graph_file: str = "./kg.html"
    chunk_size: int = 512
    groq_model: str = "llama3-8b-8192"

    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    thread_pool_size: int = os.cpu_count()

    def __post_init__(self):
        self.validate_settings()
    
    def validate_settings(self):
        if not self.groq_api_key:
            raise ValueError("GROQ_API_KEY is required")
        if not os.path.exists(self.pdf_directory):
            raise FileNotFoundError(f"PDF directory not found: {self.pdf_directory}")