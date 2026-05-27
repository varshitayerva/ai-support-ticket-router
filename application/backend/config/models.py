"""
Centralized Model Configuration for Multi-LLM Architecture

This module defines model assignments for different task types.
Each model is selected based on optimal performance for its task.
"""

from typing import Dict, Any

# Model Configurations: Optimized for Hugging Face Router v1 API
# All models are accessed via: https://router.huggingface.co/v1
MODEL_CONFIG: Dict[str, Dict[str, Any]] = {
    # RELEVANCE JUDGE: Binary classification - is this a support issue?
    # Model: Mistral 7B (fast, lightweight, excellent for classification)
    "relevance_judge": {
        "model_id": "mistralai/Mistral-7B-Instruct-v0.2:featherless-ai",
        "max_tokens": 200,
        "temperature": 0.2,
        "timeout_seconds": 30,
        "description": "Fast binary classification for ticket relevance detection",
    },

    # TICKET ANALYSIS: Extract category, urgency, sentiment
    # Model: Mistral 7B (fast structured output generation)
    "analyze": {
        "model_id": "mistralai/Mistral-7B-Instruct-v0.2:featherless-ai",
        "max_tokens": 150,
        "temperature": 0.1,
        "timeout_seconds": 30,
        "description": "Structured JSON extraction for ticket metadata",
    },

    # ANALYSIS VALIDATION: Validate extracted analysis
    # Model: GPT-OSS 120B via Groq (strong reasoning for validation)
    "judge_analysis": {
        "model_id": "openai/gpt-oss-120b:groq",
        "max_tokens": 250,
        "temperature": 0.3,
        "timeout_seconds": 45,
        "description": "High-quality reasoning for analysis validation",
    },

    # GUIDANCE GENERATION: Create troubleshooting/self-service steps
    # Model: DeepSeek V4 Flash (strong reasoning, detailed responses)
    "guidance": {
        "model_id": "deepseek-ai/DeepSeek-V4-Flash:novita",
        "max_tokens": 500,
        "temperature": 0.5,
        "timeout_seconds": 45,
        "description": "Detailed guidance generation with strong reasoning",
    },

    # EMAIL GENERATION: Professional customer response
    # Model: DeepSeek V4 Flash (excellent natural language, professional tone)
    "email": {
        "model_id": "deepseek-ai/DeepSeek-V4-Flash:novita",
        "max_tokens": 600,
        "temperature": 0.6,
        "timeout_seconds": 45,
        "description": "Professional email generation with empathetic tone",
    },

    # QUALITY JUDGE: Final quality scoring
    # Model: GPT-OSS 120B (superior reasoning for evaluation)
    "judge": {
        "model_id": "openai/gpt-oss-120b:groq",
        "max_tokens": 400,
        "temperature": 0.2,
        "timeout_seconds": 45,
        "description": "Expert evaluation and quality scoring",
    },
}

# FALLBACK MODELS: Used if primary model fails
FALLBACK_MODELS: Dict[str, str] = {
    "mistralai/Mistral-7B-Instruct-v0.2:featherless-ai": "meta-llama/Llama-3.1-8B-Instruct",
    "openai/gpt-oss-120b:groq": "deepseek-ai/DeepSeek-V4-Flash:novita",
    "deepseek-ai/DeepSeek-V4-Flash:novita": "mistralai/Mistral-7B-Instruct-v0.2:featherless-ai",
    "meta-llama/Llama-3.1-8B-Instruct": "mistralai/Mistral-7B-Instruct-v0.2:featherless-ai",
}

# RETRY POLICY
RETRY_CONFIG = {
    "max_retries": 3,
    "initial_backoff_seconds": 1,
    "max_backoff_seconds": 10,
    "backoff_multiplier": 2,
}

def get_model_config(task_type: str) -> Dict[str, Any]:
    """Get configuration for a specific task type."""
    if task_type not in MODEL_CONFIG:
        raise ValueError(f"Unknown task type: {task_type}. Valid types: {list(MODEL_CONFIG.keys())}")
    return MODEL_CONFIG[task_type]

def get_model_id(task_type: str) -> str:
    """Get model ID for a specific task type."""
    config = get_model_config(task_type)
    return config["model_id"]

def get_fallback_model(primary_model: str) -> str:
    """Get fallback model for a primary model."""
    return FALLBACK_MODELS.get(primary_model, "meta-llama/Llama-3.1-8B-Instruct")

def list_all_models() -> Dict[str, str]:
    """List all configured models and their task types."""
    return {task_type: config["model_id"] for task_type, config in MODEL_CONFIG.items()}
