import json
import logging
import ssl
import threading
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from chat.ChatManager import ChatManager
from settings import PropertyGraphSettings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()
SETTINGS = PropertyGraphSettings.from_env()


# --- chat manager (singleton, swappable on provider change) ----------------

chat_manager: ChatManager
_chat_manager_lock = threading.Lock()


def _build_chat_manager(provider: str) -> ChatManager:
    cm = ChatManager(settings=SETTINGS, model_provider=provider)
    if not cm.initialize_system():
        raise RuntimeError(f"Failed to initialize ChatManager with provider={provider}")
    return cm


@asynccontextmanager
async def lifespan(app: FastAPI):
    global chat_manager
    chat_manager = _build_chat_manager(SETTINGS.default_model_provider)
    try:
        yield
    finally:
        chat_manager.cleanup()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=SETTINGS.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- websocket --------------------------------------------------------------

@app.websocket(SETTINGS.websocket_path)
async def websocket_endpoint(websocket: WebSocket):
    global chat_manager
    await websocket.accept()

    try:
        while True:
            data = await websocket.receive_text()
            request = json.loads(data)

            question = request.get("question")
            vector_store = request.get("vector_store", "KG")
            query_transformation = request.get("query_transformation")
            requested_provider = request.get("model_provider")

            if not question:
                await websocket.send_text(json.dumps({"error": "Question is required"}))
                continue

            # If the client asked for a different provider, swap the singleton
            # under a lock so concurrent clients can't tear it down mid-query.
            if requested_provider and requested_provider.lower() != chat_manager.model_manager.model_provider:
                new_provider = requested_provider.lower()
                swap_error: str | None = None
                with _chat_manager_lock:
                    if new_provider != chat_manager.model_manager.model_provider:
                        logger.info(
                            f"Switching model provider from "
                            f"{chat_manager.model_manager.model_provider} to {new_provider}"
                        )
                        old = chat_manager
                        try:
                            chat_manager = _build_chat_manager(new_provider)
                        except RuntimeError as e:
                            # Keep `old` live so other clients aren't broken.
                            swap_error = str(e)
                        else:
                            old.cleanup()
                if swap_error:
                    await websocket.send_text(json.dumps({"error": swap_error}))
                    continue

            try:
                for chunk in chat_manager.query(
                    question=question,
                    query_transformation=query_transformation,
                    choice_of_vector_store=vector_store,
                ):
                    await websocket.send_text(json.dumps({"type": "chunk", "content": chunk}))

                await websocket.send_text(json.dumps({"type": "complete"}))

            except Exception as e:
                logger.error(f"Error processing query: {e}", exc_info=True)
                await websocket.send_text(json.dumps({"error": f"Error processing query: {e}"}))

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}", exc_info=True)
    finally:
        try:
            await websocket.close()
        except (RuntimeError, AttributeError):
            # Already closed, or hit the uvicorn/websockets legacy-protocol mismatch
            # on disconnect (uvicorn calls a method removed in websockets >= 14).
            pass


# --- entrypoint -------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    # Probe the certs early so we fail fast with a clear message.
    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    try:
        ctx.load_cert_chain(SETTINGS.ssl_cert_path, SETTINGS.ssl_key_path, SETTINGS.ssl_ca_path)
    except Exception as e:
        logger.error(f"Failed to load SSL certificates: {e}")
        raise

    uvicorn.run(
        app,
        host=SETTINGS.host,
        port=SETTINGS.port,
        ssl_keyfile=SETTINGS.ssl_key_path,
        ssl_certfile=SETTINGS.ssl_cert_path,
    )
