"""Request schema for the chat WebSocket.

Messages arrive as raw WebSocket text (not a FastAPI body), so they are
validated manually with ``ChatRequest.model_validate(payload)``. Using a typed
model means a malformed shape fails cleanly instead of silently falling through
to the wrong retrieval engine.
"""

from typing import Literal

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    model_config = {"extra": "ignore"}

    question: str = Field(min_length=1)
    vector_store: Literal["KG", "vector"] = "KG"
    query_transformation: Literal["HyDE"] | None = None
    model_provider: Literal["groq", "gemini", "openai"] | None = None
