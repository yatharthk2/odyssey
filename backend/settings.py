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
    chunk_size: int = 256
    chunk_overlap: int = 50
    # groq_model: str = "llama-3.3-70b-versatile"
    groq_model: str = "llama-3.1-8b-instant"

    embedding_model: str = "BAAI/bge-base-en-v1.5"
    max_tokens: int = 4096
    similarity_top_k: int = 4
    thread_pool_size: int = os.cpu_count()
