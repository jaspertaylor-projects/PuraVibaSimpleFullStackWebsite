# backend/Dockerfile
# Purpose: Containerize the backend with deterministic Python so uv uses wheels; writes errors to /logs/backend-error.log. Exposes port 8000.
# Imports From: backend/app/*, pyproject.toml, uv.lock
# Exported To: docker compose 'backend' service

FROM python:3.12-slim AS base

ENV PYTHONUNBUFFERED=1 \
    LOG_DIR=/logs \
    UV_PYTHON_PREFER_SYSTEM=1 \
    UV_PYTHON=python3.12 \
    PIP_PREFER_BINARY=1

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir uv

ARG UID=1000
ARG GID=1000
RUN groupadd -g "${GID}" app && useradd -m -u "${UID}" -g "${GID}" app

WORKDIR /app

COPY pyproject.toml uv.lock* ./
RUN mkdir -p "${LOG_DIR}" && chown -R app:app "${LOG_DIR}" /app

USER app
RUN uv venv --python python3.12 && uv sync --frozen

COPY --chown=app:app ./app ./app

EXPOSE 8000
CMD ["/app/.venv/bin/uvicorn", "app.bootstrap:asgi", "--host", "0.0.0.0", "--port", "8000", "--loop", "asyncio"]
