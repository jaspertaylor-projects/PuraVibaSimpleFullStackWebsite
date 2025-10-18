# backend/Dockerfile
# Purpose: Containerize the FastAPI backend with a production-stable default CMD (no --reload); dev overrides this in docker-compose.yml.
# Imports From: pyproject.toml, uv.lock, ./app/*, ./uvicorn-log.json
# Exported To: docker-compose services "backend" (dev and prod).

FROM python:3.11-slim AS base

ENV PYTHONUNBUFFERED=1 \
    LOG_DIR=/logs

# uv manages virtualenv + sync; install once at image build time
RUN pip install --no-cache-dir uv

# Non-root user for runtime
ARG UID=1000
ARG GID=1000
RUN groupadd -g "${GID}" app && useradd -m -u "${UID}" -g "${GID}" app

WORKDIR /app

# Lockfile + project metadata first to maximize layering
COPY pyproject.toml uv.lock* ./

# Prepare logs dir and ownership before switching users
RUN mkdir -p "${LOG_DIR}" && chown -R app:app "${LOG_DIR}" /app

USER app

# Create venv and install deps (frozen when possible)
RUN uv venv && uv sync --frozen

# Bring in application code and logging config
COPY --chown=app:app ./app ./app
COPY --chown=app:app uvicorn-log.json ./uvicorn-log.json

EXPOSE 8000

# Production CMD — no '--reload'. Dev compose overrides with its own command including '--reload'.
CMD ["uv", "run", "uvicorn", "app.bootstrap:asgi", "--host", "0.0.0.0", "--port", "8000", "--log-config", "/app/uvicorn-log.json"]
