# backend/Dockerfile

FROM python:3.11-slim AS base

ENV PYTHONUNBUFFERED=1
ENV LOG_DIR=/logs

RUN pip install --no-cache-dir uv

ARG UID=1000
ARG GID=1000
RUN groupadd -g "${GID}" app && useradd -m -u "${UID}" -g "${GID}" app

WORKDIR /app

COPY pyproject.toml uv.lock* ./

RUN mkdir -p "${LOG_DIR}" && chown -R app:app "${LOG_DIR}" /app

USER app

RUN uv venv && uv sync --frozen

COPY --chown=app:app ./app ./app

COPY --chown=app:app uvicorn-log.json ./uvicorn-log.json

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload", "--log-config", "/app/uvicorn-log.json"]
