# backend/Dockerfile
# Purpose: Build and run the FastAPI backend with uv and ensure a writable /logs directory exists for error logging.
# Imports From: ./pyproject.toml, ./uv.lock, ./app/*
# Exported To: docker-compose service "backend".
# syntax=docker/dockerfile:1.4

# ---- Base Image ----
FROM python:3.11-slim

# Ensure unbuffered output from Python
ENV PYTHONUNBUFFERED=1

# Provide a conventional logs location inside the container
ENV LOG_DIR=/logs

# ---- Install uv ----
RUN pip install uv

WORKDIR /app

# ---- Create a virtual environment ----
RUN uv venv

# ---- Install Dependencies ----
COPY pyproject.toml uv.lock* ./
RUN uv sync --frozen

# ---- Copy Application Code ----
COPY ./app ./app

# ---- Prepare logs directory ----
RUN mkdir -p "${LOG_DIR}"

# ---- Final Command ----
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
