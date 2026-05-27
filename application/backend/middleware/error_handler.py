"""
Error Handling Middleware

Handles LLM-specific errors and provides consistent error responses.
"""

from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from utils.logging_config import llm_logger
import json
from datetime import datetime


class LLMErrorHandler(BaseHTTPMiddleware):
    """Middleware for handling LLM-related errors."""

    async def dispatch(self, request: Request, call_next):
        """Process request and handle errors."""
        try:
            response = await call_next(request)
            return response
        except HTTPException as e:
            return await self._handle_http_exception(e, request)
        except Exception as e:
            return await self._handle_general_exception(e, request)

    async def _handle_http_exception(self, exc: HTTPException, request: Request):
        """Handle HTTPException from LLM calls."""
        error_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "error": exc.detail,
            "status_code": exc.status_code,
            "path": str(request.url.path),
        }

        llm_logger.logger.warning(json.dumps(error_data))

        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": exc.detail,
                "status_code": exc.status_code,
                "timestamp": error_data["timestamp"],
            },
        )

    async def _handle_general_exception(self, exc: Exception, request: Request):
        """Handle general exceptions."""
        error_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(exc),
            "error_type": type(exc).__name__,
            "path": str(request.url.path),
        }

        llm_logger.logger.error(json.dumps(error_data))

        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal server error. Please try again.",
                "status_code": 500,
                "timestamp": error_data["timestamp"],
            },
        )


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for logging incoming requests."""

    async def dispatch(self, request: Request, call_next):
        """Log incoming request."""
        path = request.url.path
        method = request.method

        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "event": "request",
            "method": method,
            "path": path,
        }

        llm_logger.logger.info(json.dumps(log_data))

        response = await call_next(request)
        return response
