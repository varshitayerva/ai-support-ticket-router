"""
Centralized LLM Service Layer

Handles all interactions with LLM models through Hugging Face Router.
Manages retries, fallbacks, response parsing, and structured logging.
"""

import os
import asyncio
import time
import re
from typing import Optional, Dict, Any, List
from openai import OpenAI, OpenAIError
from config.models import (
    get_model_config,
    get_model_id,
    get_fallback_model,
    RETRY_CONFIG,
)
from utils.response_cleaner import ResponseProcessor, extract_json
from utils.logging_config import llm_logger, TimingContext


class LLMService:
    """Centralized service for LLM operations."""

    def __init__(self, api_key: Optional[str] = None):
        """Initialize LLM service with Hugging Face router."""
        self.api_key = api_key or os.getenv("HUGGING_FACE_API_KEY")
        if not self.api_key:
            raise ValueError("HUGGING_FACE_API_KEY environment variable not set")

        self.client = OpenAI(
            base_url="https://router.huggingface.co/v1",
            api_key=self.api_key,
        )
        self.retry_config = RETRY_CONFIG

    async def call_llm(
        self,
        task_type: str,
        messages: List[Dict[str, str]],
        use_fallback: bool = True,
    ) -> str:
        """
        Call LLM with automatic retry and fallback handling.

        Args:
            task_type: Type of task (relevance_judge, analyze, etc.)
            messages: Chat messages to send to LLM
            use_fallback: Whether to use fallback model if primary fails

        Returns:
            LLM response text

        Raises:
            RuntimeError: If all retry attempts fail
        """
        config = get_model_config(task_type)
        model_id = config["model_id"]
        max_retries = self.retry_config["max_retries"]

        for attempt in range(max_retries + 1):
            try:
                with TimingContext(f"{task_type}") as timer:
                    response = await self._make_llm_call(
                        model_id=model_id,
                        messages=messages,
                        max_tokens=config["max_tokens"],
                        temperature=config["temperature"],
                        timeout=config["timeout_seconds"],
                    )

                # Log successful call
                latency_ms = timer.get_elapsed_ms()
                llm_logger.log_llm_call(
                    task_type=task_type,
                    model_id=model_id,
                    endpoint=f"/api/{task_type}",
                    status="success",
                    latency_ms=latency_ms,
                )

                return response

            except OpenAIError as e:
                is_last_attempt = attempt == max_retries

                if not is_last_attempt:
                    wait_time = self._calculate_backoff(attempt)
                    llm_logger.log_retry(
                        task_type=task_type,
                        attempt=attempt + 1,
                        model_id=model_id,
                        reason=str(e),
                    )
                    await asyncio.sleep(wait_time)
                elif use_fallback:
                    # Try fallback model
                    fallback_model = get_fallback_model(model_id)
                    if fallback_model != model_id:
                        llm_logger.log_fallback(
                            task_type=task_type,
                            primary_model=model_id,
                            fallback_model=fallback_model,
                            reason=str(e),
                        )
                        return await self._call_with_specific_model(
                            task_type=task_type,
                            model_id=fallback_model,
                            messages=messages,
                        )
                    else:
                        raise RuntimeError(
                            f"Failed to call LLM for {task_type} after {max_retries} retries"
                        )
                else:
                    raise RuntimeError(
                        f"Failed to call LLM for {task_type} after {max_retries} retries"
                    )

    async def _make_llm_call(
        self,
        model_id: str,
        messages: List[Dict[str, str]],
        max_tokens: int,
        temperature: float,
        timeout: int,
    ) -> str:
        """Make single LLM API call (can be retried)."""
        try:
            completion = self.client.chat.completions.create(
                model=model_id,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
                timeout=timeout,
            )
            return completion.choices[0].message.content
        except Exception as e:
            raise OpenAIError(f"LLM call failed: {str(e)}")

    async def _call_with_specific_model(
        self,
        task_type: str,
        model_id: str,
        messages: List[Dict[str, str]],
    ) -> str:
        """Call LLM with specific model."""
        config = get_model_config(task_type)
        return await self._make_llm_call(
            model_id=model_id,
            messages=messages,
            max_tokens=config["max_tokens"],
            temperature=config["temperature"],
            timeout=config["timeout_seconds"],
        )

    def _calculate_backoff(self, attempt: int) -> float:
        """Calculate exponential backoff wait time."""
        initial = self.retry_config["initial_backoff_seconds"]
        multiplier = self.retry_config["backoff_multiplier"]
        max_backoff = self.retry_config["max_backoff_seconds"]

        wait_time = initial * (multiplier ** attempt)
        return min(wait_time, max_backoff)

    def extract_json_response(
        self,
        text: str,
        required_keys: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Extract and validate JSON from LLM response.

        Args:
            text: Raw response text
            required_keys: List of required keys to validate

        Returns:
            Parsed JSON object
        """
        if required_keys:
            return ResponseProcessor.process_json_response(
                text,
                required_keys=required_keys,
                strict=False,
            )
        else:
            return extract_json(text, strict=False) or {}

    def extract_text_response(self, text: str) -> str:
        """Extract and clean text from LLM response."""
        if not text or not isinstance(text, str):
            return ""

        # Remove code block markers
        text = text.replace('```json\n', '').replace('```json', '')
        text = text.replace('```\n', '').replace('```', '')

        # Remove markdown formatting (only paired markers)
        text = re.sub(r'\*\*(.+?)\*\*', r'\1', text, flags=re.DOTALL)  # **text** -> text
        text = re.sub(r'__(.+?)__', r'\1', text, flags=re.DOTALL)      # __text__ -> text
        text = re.sub(r'\*(.+?)\*', r'\1', text, flags=re.DOTALL)      # *text* -> text
        text = re.sub(r'_(.+?)_', r'\1', text, flags=re.DOTALL)        # _text_ -> text

        return text.strip()


# Global LLM service instance
_llm_service: Optional[LLMService] = None


def get_llm_service() -> LLMService:
    """Get or create global LLM service instance."""
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service


def create_llm_service(api_key: Optional[str] = None) -> LLMService:
    """Create new LLM service instance."""
    return LLMService(api_key=api_key)
