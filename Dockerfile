FROM python:3.10-slim

WORKDIR /app

# Install Node.js
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install poetry
RUN pip install poetry

# Copy backend
WORKDIR /app/backend
COPY backend/pyproject.toml backend/poetry.lock ./
RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi
COPY backend .

# Copy frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend .

# Expose port 7860 for HF Spaces
EXPOSE 7860

# Start script
RUN echo '#!/bin/bash\n\
cd /app/backend && poetry run python server.py &\n\
cd /app/frontend && PORT=7860 npm run dev\n\
wait' > /app/start.sh && chmod +x /app/start.sh

CMD ["/app/start.sh"]
