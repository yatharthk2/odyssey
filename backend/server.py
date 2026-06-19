import json
import logging
import ssl
import threading
from contextlib import asynccontextmanager, suppress

from dotenv import load_dotenv
from fastapi import FastAPI, Response, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from chat import metrics
from chat.chatdata import Chat
from chat.ChatManager import ChatManager
from chat.rate_limiter import RateLimiter
from chat.schemas import ChatRequest
from settings import PropertyGraphSettings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()
SETTINGS = PropertyGraphSettings.from_env()

# Per-IP question throttle shared across all connections.
rate_limiter = RateLimiter(
    per_minute=SETTINGS.rate_limit_per_minute,
    burst=SETTINGS.rate_limit_burst,
)


def _client_key(websocket: WebSocket) -> str:
    """Best-effort client identity for rate limiting. Caddy sets X-Forwarded-For."""
    forwarded = websocket.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    client = websocket.client
    return client.host if client else "unknown"


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


# --- health / metrics -------------------------------------------------------


@app.get("/health")
def health() -> dict:
    """Liveness: the process is up. Always 200 unless the process is dead."""
    return {"status": "ok"}


@app.get("/ready")
def ready() -> Response:
    """Readiness: the RAG stack is built and serving. 503 until warm."""
    cm = globals().get("chat_manager")
    engine = getattr(cm, "query_engine", None) if cm is not None else None
    if engine is None or getattr(engine, "query_engine_KG", None) is None:
        return JSONResponse({"status": "initializing"}, status_code=503)
    return JSONResponse({"status": "ready"})


@app.get("/metrics")
def prometheus_metrics() -> Response:
    return Response(content=metrics.render(), media_type=metrics.CONTENT_TYPE)


# --- websocket --------------------------------------------------------------


@app.websocket(SETTINGS.websocket_path)
async def websocket_endpoint(websocket: WebSocket):
    global chat_manager
    await websocket.accept()
    metrics.ACTIVE_CONNECTIONS.inc()

    # Per-connection conversation history. NOT shared across connections, so one
    # visitor's turns can never leak into another visitor's prompt.
    chat = Chat(SETTINGS.chat_size)
    client_key = _client_key(websocket)

    try:
        while True:
            data = await websocket.receive_text()

            # A malformed frame must not kill the session — reply and continue.
            try:
                payload = json.loads(data)
                if not isinstance(payload, dict):
                    raise ValueError("request must be a JSON object")
            except (ValueError, TypeError):
                await websocket.send_text(json.dumps({"error": "Invalid request format"}))
                continue

            # Validate the request shape; a malformed shape fails cleanly instead
            # of silently routing to the wrong engine.
            try:
                request = ChatRequest.model_validate(payload)
            except ValidationError:
                await websocket.send_text(json.dumps({"error": "Invalid request"}))
                continue

            question = request.question
            vector_store = request.vector_store
            query_transformation = request.query_transformation
            requested_provider = request.model_provider

            if len(question) > SETTINGS.max_question_chars:
                await websocket.send_text(
                    json.dumps(
                        {"error": f"Question too long (max {SETTINGS.max_question_chars} chars)."}
                    )
                )
                continue

            if not rate_limiter.allow(client_key):
                await websocket.send_text(
                    json.dumps(
                        {"error": "You're sending messages too quickly. Please wait a moment."}
                    )
                )
                continue

            # If the client asked for a different provider, swap the singleton
            # under a lock so concurrent clients can't tear it down mid-query.
            if (
                requested_provider
                and requested_provider.lower() != chat_manager.model_manager.model_provider
            ):
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
                    logger.error(f"Provider swap failed: {swap_error}")
                    await websocket.send_text(
                        json.dumps({"error": "Couldn't switch model. Please try again."})
                    )
                    continue

            try:
                async for chunk in chat_manager.query(
                    question=question,
                    chat=chat,
                    query_transformation=query_transformation,
                    choice_of_vector_store=vector_store,
                ):
                    await websocket.send_text(json.dumps({"type": "chunk", "content": chunk}))

                await websocket.send_text(json.dumps({"type": "complete"}))

            except Exception as e:
                logger.error(f"Error processing query: {e}", exc_info=True)
                await websocket.send_text(
                    json.dumps({"error": "Sorry, something went wrong. Please try again."})
                )

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}", exc_info=True)
    finally:
        metrics.ACTIVE_CONNECTIONS.dec()
        # Already closed, or hit the uvicorn/websockets legacy-protocol mismatch
        # on disconnect (uvicorn calls a method removed in websockets >= 14).
        with suppress(RuntimeError, AttributeError):
            await websocket.close()


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
