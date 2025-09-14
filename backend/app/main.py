# backend/app/main.py
# Purpose: Define the FastAPI app and configure robust, deterministic logging so all backend errors are written to /logs/backend-error.log, and browser-reported errors go to /logs/frontend-error.log.
# Imports From: None
# Exported To: None
from __future__ import annotations

import datetime
import logging
import logging.config
import os
import sys
import traceback
from logging.handlers import RotatingFileHandler
from typing import Any, Callable

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


# ---- Paths -------------------------------------------------------------------
LOG_DIR = os.getenv("LOG_DIR", "/logs")
BACKEND_ERROR_FILE = os.path.join(LOG_DIR, "backend-error.log")
FRONTEND_ERROR_FILE = os.path.join(LOG_DIR, "frontend-error.log")


# ---- Logging Setup ------------------------------------------------------------
def _ensure_log_dir() -> None:
    try:
        os.makedirs(LOG_DIR, exist_ok=True)
    except Exception:
        pass


def _rotating_file_handler_dict(filename: str, level: str) -> dict[str, Any]:
    return {
        "class": "logging.handlers.RotatingFileHandler",
        "level": level,
        "filename": filename,
        "maxBytes": 5_242_880,
        "backupCount": 5,
        "encoding": "utf-8",
        "formatter": "default",
    }


def configure_logging() -> None:
    _ensure_log_dir()

    # Build a dictConfig that FORCEs replacement of any existing handlers
    # (uvicorn config is applied before importing the app; force=True guarantees ours wins).
    config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "format": "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
                "datefmt": "%Y-%m-%dT%H:%M:%S%z",
            }
        },
        "handlers": {
            "backend_file": _rotating_file_handler_dict(BACKEND_ERROR_FILE, "ERROR"),
            "frontend_file": _rotating_file_handler_dict(FRONTEND_ERROR_FILE, "ERROR"),
        },
        "loggers": {
            # Uvicorn and FastAPI errors (tracebacks, 500s) land here
            "uvicorn": {"level": "ERROR", "handlers": ["backend_file"], "propagate": False},
            "uvicorn.error": {"level": "ERROR", "handlers": ["backend_file"], "propagate": False},
            "uvicorn.access": {"level": "ERROR", "handlers": ["backend_file"], "propagate": False},
            "fastapi": {"level": "ERROR", "handlers": ["backend_file"], "propagate": False},
            # Dedicated logger for client-reported frontend errors
            "frontend.client": {"level": "ERROR", "handlers": ["frontend_file"], "propagate": False},
        },
        # Root catches anything not covered above
        "root": {"level": "ERROR", "handlers": ["backend_file"]},
    }

    # Python 3.11: dictConfig does not take "force", so emulate by wiping roots first.
    # Ensure we do not duplicate handlers in reload scenarios.
    for name in ("", "uvicorn", "uvicorn.error", "uvicorn.access", "fastapi", "frontend.client"):
        logger = logging.getLogger(name)
        logger.handlers.clear()

    logging.config.dictConfig(config)

    # Make sure files exist early so you can "tail -f" immediately
    try:
        for f in (BACKEND_ERROR_FILE, FRONTEND_ERROR_FILE):
            if not os.path.exists(f):
                with open(f, "a", encoding="utf-8"):
                    pass
    except Exception:
        # If touching fails, we still proceed so in-memory handlers work.
        pass

    # Route uncaught exceptions at process level into the backend log
    def _excepthook(exc_type, exc, tb):
        logger = logging.getLogger("uvicorn.error")
        logger.error("Uncaught exception\n%s", "".join(traceback.format_exception(exc_type, exc, tb)))

    sys.excepthook = _excepthook  # type: ignore[assignment]


configure_logging()


# ---- FastAPI App --------------------------------------------------------------
app = FastAPI()

# Allow requests from our frontend development server
origins = [
    "http://localhost",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---- Exception Logging Middleware --------------------------------------------
class ExceptionLoggingMiddleware:
    # Purpose: Capture any unhandled exceptions in request handling and log them to backend-error.log with context.
    # Imports From: None
    # Exported To: FastAPI app via add_middleware
    def __init__(self, app: FastAPI):
        self.app = app
        self.logger = logging.getLogger("uvicorn.error")

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        request: Request | None = None
        try:
            request = Request(scope, receive=receive)
            return await self.app(scope, receive, send)
        except Exception:
            path = scope.get("path")
            client = scope.get("client")
            client_ip = client[0] if isinstance(client, (tuple, list)) and client else None
            self.logger.exception("Unhandled exception | path=%s | ip=%s", path, client_ip)
            # Re-raise so FastAPI generates a proper 500
            raise


app.middleware("http")(ExceptionLoggingMiddleware(app))  # register


# ---- Endpoints ----------------------------------------------------------------
@app.get("/api/hello")
def read_root() -> dict[str, Any]:
    return {
        "message": "Hello from the FastAPI & Docker Coming in Hot and fresh and tasty today for you please!",
        "timestamp": datetime.datetime.now().isoformat(),
    }


# ---- Frontend Error Intake ----------------------------------------------------
class FrontendErrorPayload(BaseModel):
    message: str
    stack: str | None = None
    source: str | None = None
    line: int | None = None
    col: int | None = None
    href: str | None = None
    userAgent: str | None = None


@app.post("/api/logs/frontend")
def log_frontend_error(payload: FrontendErrorPayload, request: Request) -> dict[str, str]:
    client_ip = request.client.host if request.client else None
    logger = logging.getLogger("frontend.client")
    logger.error(
        "FrontendError | ip=%s | message=%s | source=%s | line=%s | col=%s | href=%s | userAgent=%s | stack=%s",
        client_ip,
        payload.message,
        payload.source,
        payload.line,
        payload.col,
        payload.href,
        payload.userAgent,
        payload.stack,
    )
    return {"status": "ok"}
