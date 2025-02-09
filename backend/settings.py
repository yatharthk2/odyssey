from dataclasses import dataclass
import os

@dataclass
class PropertyGraphSettings:
    """Settings for PropertyGraphSummarizer"""
    pdf_directory: str
    groq_api_key: str
    chat_size: int = 10
    # storage_dir_Kg: str = "./storage_Kg"
    # storage_dir_SV: str = "./storage_SV"
    storage_dir: str = "./storage"


    chroma_db_path: str = "./chroma_db"
    graph_file: str = "./kg.html"
    chunk_size: int = 512
    groq_model: str = "llama3-8b-8192"

    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    thread_pool_size: int = os.cpu_count()