# backend/app/bootstrap.py
# Purpose: Import wrapper that logs import-time failures (e.g., SyntaxError) to /logs/backend-error.log before the app starts, so errors are persisted even when uvicorn cannot import the app.
# Imports From: ./main.py
# Exported To: Referenced by uvicorn as "app.bootstrap:asgi".

from __future__ import annotations

import logging
import os
import traceback
from logging.handlers import RotatingFileHandler

LOG_DIR = os.getenv("LOG_DIR", "/logs")
LOG_FILE = os.path.join(LOG_DIR, "backend-error.log")


def _ensure_bootstrap_logger() -> logging.Logger:
    os.makedirs(LOG_DIR, exist_ok=True)
    logger = logging.getLogger("bootstrap")
    if not logger.handlers:
        handler = RotatingFileHandler(
            LOG_FILE,
            maxBytes=5_242_880,
            backupCount=5,
            encoding="utf-8",
        )
        formatter = logging.Formatter(
            "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
            "%Y-%m-%dT%H:%M:%S%z",
        )
        handler.setFormatter(formatter)
        handler.setLevel(logging.ERROR)
        logger.addHandler(handler)
        logger.setLevel(logging.ERROR)
        logger.propagate = False
    return logger


_logger = _ensure_bootstrap_logger()

try:
    # Import the real ASGI app. If this raises (SyntaxError, ImportError, etc),
    # we catch and persist the traceback before re-raising so uvicorn still fails fast.
    from app.main import app as asgi  # type: ignore[attr-defined]
except Exception:
    _logger.error(
        "Failed to import application module 'app.main:app'. Traceback follows:\n%s",
        traceback.format_exc(),
    )
    raise
