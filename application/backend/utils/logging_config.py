"""
Structured Logging Configuration

Provides logging utilities for tracking LLM calls, performance, and errors.
"""

import logging
import json
import time
from typing import Optional, Dict, Any
from datetime import datetime


class StructuredLogger:
    """Structured logging for LLM operations."""

    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.INFO)

        if not self.logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)

    def log_llm_call(
        self,
        task_type: str,
        model_id: str,
        endpoint: str,
        status: str = "started",
        latency_ms: Optional[float] = None,
        tokens_used: Optional[Dict[str, int]] = None,
        error: Optional[str] = None,
    ):
        """Log an LLM API call with structured data."""
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "task_type": task_type,
            "model_id": model_id,
            "endpoint": endpoint,
            "status": status,
        }

        if latency_ms is not None:
            log_data["latency_ms"] = round(latency_ms, 2)

        if tokens_used is not None:
            log_data["tokens"] = tokens_used

        if error is not None:
            log_data["error"] = error

        self.logger.info(json.dumps(log_data))

    def log_retry(
        self,
        task_type: str,
        attempt: int,
        model_id: str,
        reason: str,
    ):
        """Log retry attempt."""
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "event": "retry",
            "task_type": task_type,
            "attempt": attempt,
            "model_id": model_id,
            "reason": reason,
        }
        self.logger.warning(json.dumps(log_data))

    def log_fallback(
        self,
        task_type: str,
        primary_model: str,
        fallback_model: str,
        reason: str,
    ):
        """Log fallback model activation."""
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "event": "fallback",
            "task_type": task_type,
            "primary_model": primary_model,
            "fallback_model": fallback_model,
            "reason": reason,
        }
        self.logger.warning(json.dumps(log_data))

    def log_response_parsing(
        self,
        task_type: str,
        success: bool,
        error: Optional[str] = None,
    ):
        """Log response parsing event."""
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "event": "response_parsing",
            "task_type": task_type,
            "success": success,
        }
        if error:
            log_data["error"] = error

        level = "info" if success else "warning"
        getattr(self.logger, level)(json.dumps(log_data))

    def log_performance(
        self,
        task_type: str,
        model_id: str,
        latency_ms: float,
        total_tokens: int,
    ):
        """Log performance metrics."""
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "event": "performance",
            "task_type": task_type,
            "model_id": model_id,
            "latency_ms": round(latency_ms, 2),
            "tokens": total_tokens,
            "tokens_per_second": round(total_tokens / (latency_ms / 1000), 2),
        }
        self.logger.info(json.dumps(log_data))


# Global logger instance
llm_logger = StructuredLogger("llm_service")


class TimingContext:
    """Context manager for measuring operation timing."""

    def __init__(self, operation_name: str):
        self.operation_name = operation_name
        self.start_time = None
        self.elapsed_ms = None

    def __enter__(self):
        self.start_time = time.time()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.elapsed_ms = (time.time() - self.start_time) * 1000

    def get_elapsed_ms(self) -> float:
        """Get elapsed time in milliseconds."""
        if self.elapsed_ms is None:
            return (time.time() - self.start_time) * 1000
        return self.elapsed_ms


def setup_logging(level: str = "INFO"):
    """Configure root logging."""
    logging.basicConfig(
        level=getattr(logging, level),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
