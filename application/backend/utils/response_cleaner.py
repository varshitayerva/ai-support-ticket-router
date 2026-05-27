"""
Response Cleaning and Sanitization Utilities

Cleans LLM responses to remove markdown, code blocks, and invalid formatting.
"""

import json
import re
from typing import Any, Optional, Dict


def remove_markdown_formatting(text: str) -> str:
    """Remove markdown formatting from text (but keep content)."""
    # Only remove markdown if it's wrapping content (bold/italic)
    text = re.sub(r'\*\*([^*]+)\*\*', r'\1', text)  # **bold** -> bold
    text = re.sub(r'__([^_]+)__', r'\1', text)      # __bold__ -> bold
    text = re.sub(r'\*([^*]+)\*', r'\1', text)      # *italic* -> italic (but only paired)
    text = re.sub(r'_([^_]+)_', r'\1', text)        # _italic_ -> italic (but only paired)
    return text


def remove_code_blocks(text: str) -> str:
    """Remove code block formatting."""
    text = re.sub(r'```[\w]*\n', '', text)
    text = re.sub(r'```', '', text)
    text = re.sub(r'`([^`]+)`', r'\1', text)
    return text


def remove_json_wrappers(text: str) -> str:
    """Remove common JSON wrapper patterns."""
    if text.startswith('```json'):
        text = text[7:]
    if text.startswith('```'):
        text = text[3:]
    if text.endswith('```'):
        text = text[:-3]
    return text.strip()


def sanitize_response(text: str) -> str:
    """Comprehensive response sanitization."""
    if not text or not isinstance(text, str):
        return ""

    text = remove_json_wrappers(text)
    text = remove_code_blocks(text)
    text = remove_markdown_formatting(text)
    return text.strip()


def extract_json(text: str, strict: bool = True) -> Optional[Dict[str, Any]]:
    """
    Extract JSON from response text.

    Args:
        text: Raw response text
        strict: If True, raise on JSON error. If False, return None.

    Returns:
        Parsed JSON object or None if parsing fails
    """
    if not text or not isinstance(text, str):
        return None

    text = sanitize_response(text)

    # Try to find JSON object
    json_match = re.search(r'\{.*\}', text, re.DOTALL)
    if not json_match:
        return None

    json_str = json_match.group(0)

    try:
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        if strict:
            raise ValueError(f"Failed to parse JSON: {e}")
        return None


def extract_json_safe(text: str, default: Optional[Dict] = None) -> Dict[str, Any]:
    """
    Safely extract JSON with default fallback.

    Args:
        text: Raw response text
        default: Default object if extraction fails

    Returns:
        Parsed JSON or default object
    """
    result = extract_json(text, strict=False)
    return result if result is not None else (default or {})


def clean_text_response(text: str) -> str:
    """Clean text response for display."""
    if not text:
        return ""

    # Remove code block markers if present
    text = remove_code_blocks(text)
    # Remove JSON wrappers if present
    text = remove_json_wrappers(text)
    # Remove markdown formatting wrappers (but keep content)
    text = remove_markdown_formatting(text)
    # Clean up extra blank lines
    text = re.sub(r'\n\s*\n+', '\n\n', text)
    text = text.strip()
    return text


def validate_json_schema(data: Dict[str, Any], required_keys: list) -> bool:
    """
    Validate JSON object has required keys.

    Args:
        data: JSON object to validate
        required_keys: List of required keys

    Returns:
        True if all required keys present, False otherwise
    """
    if not isinstance(data, dict):
        return False
    return all(key in data for key in required_keys)


class ResponseProcessor:
    """Unified response processor for JSON and text responses."""

    @staticmethod
    def process_json_response(
        text: str,
        required_keys: list,
        strict: bool = False
    ) -> Dict[str, Any]:
        """
        Process and validate JSON response.

        Args:
            text: Raw response text
            required_keys: Required keys in JSON
            strict: If True, raise on missing keys

        Returns:
            Validated JSON object

        Raises:
            ValueError: If strict=True and validation fails
        """
        data = extract_json(text, strict=strict)
        if data is None:
            if strict:
                raise ValueError("Failed to extract JSON from response")
            return {}

        if not validate_json_schema(data, required_keys):
            if strict:
                missing = [k for k in required_keys if k not in data]
                raise ValueError(f"Missing required keys: {missing}")

        return data

    @staticmethod
    def process_text_response(text: str) -> str:
        """Process and clean text response."""
        return clean_text_response(text)
