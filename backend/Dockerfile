# syntax=docker/dockerfile:1.7

# --- builder ----------------------------------------------------------------
# Resolves deps into a venv. Kept separate from the runtime stage so the final
# image doesn't ship build tooling.
FROM python:3.12-slim AS builder

COPY --from=ghcr.io/astral-sh/uv:0.9.26 /uv /uvx /bin/

WORKDIR /app

# Cache deps independently of source code: copy only the manifest + lockfile
# first, sync, then add the rest.
COPY pyproject.toml uv.lock .python-version ./

ENV UV_LINK_MODE=copy \
    UV_CACHE_DIR=/root/.cache/uv \
    UV_COMPILE_BYTECODE=1 \
    UV_PROJECT_ENVIRONMENT=/app/.venv

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-install-project

# --- runtime ----------------------------------------------------------------
FROM python:3.12-slim AS runtime

# libgomp1: OpenMP runtime needed by torch/sentence-transformers wheels.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/.venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    HF_HOME=/app/.cache/huggingface \
    TOKENIZERS_PARALLELISM=false

COPY . .

EXPOSE 8000

# Container-level liveness — TCP probe instead of HTTP, because the only
# route on the app is a WebSocket and we don't want a healthcheck that talks
# the WS handshake. start-period is generous so the slow HuggingFace model
# download on first boot doesn't kill the container before it's ready.
HEALTHCHECK --interval=30s --timeout=5s --start-period=180s --retries=3 \
    CMD python -c "import socket; socket.create_connection(('localhost', 8000), timeout=3)" || exit 1

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
