# backend/Dockerfile
# Purpose: Build and run the FastAPI backend as a non-root user (UID 1000) so host logs are user-owned; create the venv as that user to avoid permission issues.
# Imports From: ./pyproject.toml, ./uv.lock, ./app/*
# Exported To: docker-compose service "backend".
# syntax=docker/dockerfile:1.4

# ---- Base Image ----
FROM python:3.11-slim AS base

ENV PYTHONUNBUFFERED=1
ENV LOG_DIR=/logs

# Install uv globally
RUN pip install --no-cache-dir uv

# Create a non-root user with UID/GID 1000
ARG UID=1000
ARG GID=1000
RUN groupadd -g "${GID}" app && useradd -m -u "${UID}" -g "${GID}" app

WORKDIR /app

# Copy project metadata
COPY pyproject.toml uv.lock* ./

# Prepare directories and ownership for the non-root user
RUN mkdir -p "${LOG_DIR}" && chown -R app:app "${LOG_DIR}" /app

# Switch to non-root user before creating the venv so it’s owned by app
USER app

# Create venv and install deps into it using uv
RUN uv venv && uv sync --frozen

# Copy application code (owned by app)
COPY --chown=app:app ./app ./app

# Expose backend port
EXPOSE 8000

# Run under uv with reload
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
