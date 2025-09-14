# backend/app/main.py
# Purpose: Define the FastAPI app, configure robust logging to /logs, and add a safe HTTP middleware that logs unhandled exceptions without breaking Starlette's middleware contract.
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
from typing import Any

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from starlette.middleware.base import BaseHTTPMiddleware


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
            "uvicorn": {"level": "ERROR", "handlers": ["backend_file"], "propagate": False},
            "uvicorn.error": {"level": "ERROR", "handlers": ["backend_file"], "propagate": False},
            "uvicorn.access": {"level": "ERROR", "handlers": ["backend_file"], "propagate": False},
            "fastapi": {"level": "ERROR", "handlers": ["backend_file"], "propagate": False},
            "frontend.client": {"level": "ERROR", "handlers": ["frontend_file"], "propagate": False},
        },
        "root": {"level": "ERROR", "handlers": ["backend_file"]},
    }

    for name in ("", "uvicorn", "uvicorn.error", "uvicorn.access", "fastapi", "frontend.client"):
        logger = logging.getLogger(name)
        logger.handlers.clear()

    logging.config.dictConfig(config)

    try:
        for f in (BACKEND_ERROR_FILE, FRONTEND_ERROR_FILE):
            if not os.path.exists(f):
                with open(f, "a", encoding="utf-8"):
                    pass
    except Exception:
        pass

    def _excepthook(exc_type, exc, tb):
        logger = logging.getLogger("uvicorn.error")
        logger.error("Uncaught exception\n%s", "".join(traceback.format_exception(exc_type, exc, tb)))

    sys.excepthook = _excepthook  # type: ignore[assignment]


configure_logging()


# ---- FastAPI App --------------------------------------------------------------
app = FastAPI()

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
class ExceptionLoggingMiddleware(BaseHTTPMiddleware):
    # Purpose: Capture unhandled exceptions in request handling and log them with path and client metadata.
    # Imports From: None
    # Exported To: FastAPI app via add_middleware
    def __init__(self, app: FastAPI):
        super().__init__(app)
        self.logger = logging.getLogger("uvicorn.error")

    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except Exception:
            path = request.url.path
            client_ip = request.client.host if request.client else None
            self.logger.exception("Unhandled exception | path=%s | ip=%s", path, client_ip)
            raise


app.add_middleware(ExceptionLoggingMiddleware)


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
