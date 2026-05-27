# Multi-LLM Architecture: Support Ticket Router v2.0

## Executive Summary

This document outlines the production-ready multi-LLM architecture for the AI Support Ticket Router. The system uses **specialized models for specialized tasks**, optimizing performance, cost, and quality across the entire support pipeline.

---

## Architecture Overview

### System Design Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    FastAPI Application                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   Request Middleware                            │
│  • Error Handling  • Logging  • CORS                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              LLM Service Layer (Centralized)                    │
│  • Automatic Model Selection                                    │
│  • Retry Logic (exponential backoff)                           │
│  • Fallback Model Support                                       │
│  • Structured Response Parsing                                  │
│  • Performance Logging                                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────┬─────────────────────┐
        ↓                     ↓                     ↓
    ┌────────────┐    ┌────────────┐      ┌────────────┐
    │ Mistral 7B │    │ GPT-OSS    │      │ Qwen 3.6B  │
    │            │    │ 120B       │      │            │
    │ Fast       │    │ (via Groq) │      │ Detailed   │
    │ Classes    │    │            │      │ NLG        │
    │            │    │ Strong     │      │            │
    │ • Relevance│    │ Reasoning  │      │ • Guidance │
    │ • Analysis │    │            │      │ • Emails   │
    │            │    │ • Analysis │      │            │
    │            │    │   Judge    │      │            │
    │            │    │ • Quality  │      │            │
    │            │    │   Judge    │      │            │
    └────────────┘    └────────────┘      └────────────┘
         ↓                  ↓                  ↓
    Hugging Face Router v1 API
    (https://router.huggingface.co/v1)
```

---

## Model Assignment & Rationale

### 1. **Relevance Judge** - `/api/judge-relevance`

**Model:** `mistralai/Mistral-7B-Instruct-v0.2:featherless-ai`

**Task:** Binary classification - determine if ticket is valid support issue

**Configuration:**
```python
{
    "max_tokens": 200,
    "temperature": 0.2,  # Low temperature for consistent binary decision
    "timeout": 30 seconds
}
```

**Why Mistral 7B:**
- ⚡ Fast inference (sub-second latency)
- 🎯 Excellent for classification tasks
- 💰 Cost-efficient
- 📊 Low hallucination rate for binary decisions
- 🔄 Reliable for filtering non-support issues

**Performance Tradeoff:**
- ✅ Speed & cost priority
- ⚠️ Not needed: complex reasoning

---

### 2. **Ticket Analysis** - `/api/analyze`

**Model:** `mistralai/Mistral-7B-Instruct-v0.2:featherless-ai`

**Task:** Extract category, urgency, sentiment as structured JSON

**Configuration:**
```python
{
    "max_tokens": 150,
    "temperature": 0.1,  # Very low for deterministic JSON
    "timeout": 30 seconds
}
```

**Why Mistral 7B:**
- ✅ Strong structured output generation
- ✅ Fast JSON extraction
- ✅ Efficient for metadata extraction
- ✅ Consistent categorization

**Performance Tradeoff:**
- ✅ Speed & cost priority
- ⚠️ Not needed: complex reasoning

---

### 3. **Analysis Validation** - `/api/judge-analysis`

**Model:** `openai/gpt-oss-120b:groq`

**Task:** Validate extracted analysis (category, urgency, sentiment accuracy)

**Configuration:**
```python
{
    "max_tokens": 250,
    "temperature": 0.3,
    "timeout": 45 seconds
}
```

**Why GPT-OSS 120B:**
- 🧠 Superior reasoning capabilities
- 📋 Better validation logic
- 🎯 Strong contextual understanding
- 📊 High-quality confidence scoring
- ✅ Expert-level classification validation

**Performance Tradeoff:**
- ✅ Quality/reasoning priority
- ⚠️ Slightly higher latency than Mistral

---

### 4. **Guidance Generation** - `/api/guidance`

**Model:** `Qwen/Qwen3.6-27B:featherless-ai`

**Task:** Generate troubleshooting steps or self-service guidance

**Configuration:**
```python
{
    "max_tokens": 500,
    "temperature": 0.5,  # Balanced for detailed, helpful responses
    "timeout": 45 seconds
}
```

**Why Qwen 3.6B:**
- 📝 Strong instruction following
- 💡 Excellent detailed response generation
- 🔧 Best troubleshooting guidance
- 📚 Comprehensive self-service instructions
- 🎯 Context-aware detailed outputs

**Performance Tradeoff:**
- ✅ Content quality & detail priority
- ⚠️ Longer generation time

---

### 5. **Email Generation** - `/api/email`

**Model:** `Qwen/Qwen3.6-27B:featherless-ai`

**Task:** Generate professional, empathetic customer support email

**Configuration:**
```python
{
    "max_tokens": 600,
    "temperature": 0.6,  # Balanced for tone & creativity
    "timeout": 45 seconds
}
```

**Why Qwen 3.6B:**
- ✍️ Excellent natural language generation
- 💬 Professional tone mastery
- ❤️ Strong empathy expression
- 📧 Email-specific formatting capability
- 🎨 Contextually appropriate responses

**Performance Tradeoff:**
- ✅ Tone & professionalism priority
- ⚠️ Longer generation time

---

### 6. **Quality Judge** - `/api/judge`

**Model:** `openai/gpt-oss-120b:groq`

**Task:** Final quality scoring of entire response pipeline

**Configuration:**
```python
{
    "max_tokens": 400,
    "temperature": 0.2,
    "timeout": 45 seconds
}
```

**Why GPT-OSS 120B:**
- 🏆 Superior reasoning & evaluation
- 📊 Expert-level quality assessment
- 🔍 Multi-dimensional scoring capability
- ✅ Reliable approval/rejection decision
- 🎯 Comprehensive feedback generation

**Performance Tradeoff:**
- ✅ Evaluation quality priority
- ⚠️ Higher latency acceptable

---

## Architecture Components

### 1. **Configuration Layer** - `config/models.py`

Centralized model configuration with:
- Model IDs for each task type
- Temperature & token settings
- Timeout configurations
- Fallback model mappings
- Retry policies

**Benefits:**
- Single source of truth for model assignments
- Easy to swap models
- Configuration isolation
- Future scalability

### 2. **LLM Service Layer** - `services/llm_service.py`

Unified service for all LLM interactions:

```python
class LLMService:
    async def call_llm(task_type, messages) -> str
    async def extract_json_response(text, required_keys) -> Dict
    def extract_text_response(text) -> str
```

**Features:**
- Automatic model selection by task type
- Retry logic with exponential backoff
- Fallback model support
- Response parsing & validation
- Performance metrics logging

**Example Usage:**
```python
llm_service = get_llm_service()
response = await llm_service.call_llm(
    task_type="analyze",
    messages=[{"role": "user", "content": prompt}]
)
```

### 3. **Response Cleaning** - `utils/response_cleaner.py`

Sanitization utilities:

```python
sanitize_response(text)           # Remove markdown, code blocks
extract_json(text)                # Extract & parse JSON
extract_text_response(text)       # Clean text output
validate_json_schema(data, keys)  # Schema validation
```

**Handles:**
- Markdown formatting removal
- Code block cleanup
- JSON wrapper extraction
- Response validation

### 4. **Structured Logging** - `utils/logging_config.py`

Production-grade logging:

```python
llm_logger.log_llm_call(
    task_type, model_id, endpoint,
    status, latency_ms, tokens_used
)
llm_logger.log_retry(task_type, attempt, model_id, reason)
llm_logger.log_fallback(task_type, primary, fallback, reason)
```

**Metrics Tracked:**
- Model used for each endpoint
- Request latency (milliseconds)
- Token usage (input/output)
- Retry attempts & reasons
- Fallback model activations
- Response parsing results
- Error events

### 5. **Error Handling Middleware** - `middleware/error_handler.py`

Two middleware layers:

**LLMErrorHandler:**
- Catches HTTPException from LLM calls
- Catches general exceptions
- Returns consistent error responses
- Logs all errors

**RequestLoggingMiddleware:**
- Logs incoming requests
- Tracks endpoint usage
- Performance monitoring

---

## Request/Response Flow

### Example: Ticket Analysis Flow

```
1. POST /api/analyze
   └─ TicketRequest: { ticket: "..." }

2. LLM Service
   ├─ Get config for "analyze" task
   ├─ Model: Mistral 7B
   ├─ Temperature: 0.1 (deterministic)
   ├─ Max tokens: 150
   └─ Timeout: 30 seconds

3. Call LLM
   ├─ If error: Retry up to 3 times with backoff
   ├─ If all retries fail: Use fallback model
   └─ Log performance metrics

4. Response Processing
   ├─ Extract JSON from response
   ├─ Validate required keys: category, urgency, sentiment
   ├─ Parse into TicketAnalysis model
   └─ Return to client

5. Response
   └─ TicketAnalysis {
       category: "Technical Issue",
       urgency: "High",
       sentiment: "Negative"
     }
```

---

## Retry & Fallback Strategy

### Retry Policy
```python
RETRY_CONFIG = {
    "max_retries": 3,
    "initial_backoff_seconds": 1,
    "max_backoff_seconds": 10,
    "backoff_multiplier": 2,
}
```

**Backoff Schedule:**
- Attempt 1: Fail immediately
- Attempt 2: Wait 1s, retry
- Attempt 3: Wait 2s, retry
- Attempt 4: Wait 4s, retry
- Attempt 5: Use fallback model

### Fallback Models
```python
"mistralai/Mistral-7B" → "meta-llama/Llama-3.1-8B"
"openai/gpt-oss-120b" → "Qwen/Qwen3.6-27B"
"Qwen/Qwen3.6-27B" → "mistralai/Mistral-7B"
```

**Strategy:**
- Try primary model with retries
- On persistent failure: automatically switch to fallback
- Log fallback activation for monitoring
- Maintain response quality with fallback

---

## Performance Characteristics

### Model Latency (Estimated)
| Model | Latency | Max Tokens | Use Case |
|-------|---------|-----------|----------|
| Mistral 7B | 200-400ms | 150-200 | Classification, extraction |
| GPT-OSS 120B | 800-1200ms | 250-400 | Reasoning, validation, scoring |
| Qwen 3.6B | 600-1000ms | 500-600 | Detailed guidance, emails |

### End-to-End Pipeline
```
Judge Relevance: 200-400ms  (Mistral)
Analyze Ticket: 200-400ms   (Mistral)
Judge Analysis: 800-1200ms  (GPT-OSS)
Generate Guidance: 600-1000ms (Qwen)
Generate Email: 600-1000ms  (Qwen)
Final Judge: 800-1200ms     (GPT-OSS)

Total Pipeline: ~4-5 seconds (sequential)
```

### Token Usage

**Per Endpoint:**
- `/api/judge-relevance`: ~50-100 tokens
- `/api/analyze`: ~80-120 tokens
- `/api/judge-analysis`: ~100-150 tokens
- `/api/guidance`: ~200-400 tokens
- `/api/email`: ~300-500 tokens
- `/api/judge`: ~250-350 tokens

---

## Logging & Monitoring

### Structured Logs (JSON Format)

**LLM Call Log:**
```json
{
  "timestamp": "2026-05-27T10:30:00.000Z",
  "task_type": "analyze",
  "model_id": "mistralai/Mistral-7B-Instruct-v0.2:featherless-ai",
  "endpoint": "/api/analyze",
  "status": "success",
  "latency_ms": 275.5,
  "tokens": {
    "input": 85,
    "output": 42,
    "total": 127
  }
}
```

**Retry Log:**
```json
{
  "timestamp": "2026-05-27T10:30:00.000Z",
  "event": "retry",
  "task_type": "guidance",
  "attempt": 2,
  "model_id": "Qwen/Qwen3.6-27B:featherless-ai",
  "reason": "Connection timeout"
}
```

**Fallback Log:**
```json
{
  "timestamp": "2026-05-27T10:30:00.000Z",
  "event": "fallback",
  "task_type": "judge_analysis",
  "primary_model": "openai/gpt-oss-120b:groq",
  "fallback_model": "Qwen/Qwen3.6-27B:featherless-ai",
  "reason": "Max retries exceeded"
}
```

### Monitoring Recommendations

1. **Track Model Usage:**
   - Which models are called most frequently
   - Success rate per model
   - Average latency per model

2. **Monitor Errors:**
   - Retry frequency per model
   - Fallback activation rate
   - Error patterns

3. **Performance Analysis:**
   - End-to-end pipeline latency
   - Token usage trends
   - Model cost per endpoint

4. **Quality Metrics:**
   - Judge approval rate
   - Confidence scores
   - Relevance judge accuracy

---

## Environment Configuration

### Required Environment Variables

```bash
HUGGING_FACE_API_KEY=hf_...         # Hugging Face API key
MODEL_NAME=mistralai/...            # (Optional) override default
```

### .env File Example

```
HUGGING_FACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## API Endpoints Summary

| Endpoint | Method | Model | Purpose | Latency |
|----------|--------|-------|---------|---------|
| `/` | GET | - | Health check | <10ms |
| `/api/models` | GET | - | List all models | <10ms |
| `/api/judge-relevance` | POST | Mistral 7B | Binary classification | 200-400ms |
| `/api/analyze` | POST | Mistral 7B | Extract metadata | 200-400ms |
| `/api/judge-analysis` | POST | GPT-OSS 120B | Validate analysis | 800-1200ms |
| `/api/guidance` | POST | Qwen 3.6B | Generate guidance | 600-1000ms |
| `/api/email` | POST | Qwen 3.6B | Generate email | 600-1000ms |
| `/api/judge` | POST | GPT-OSS 120B | Quality scoring | 800-1200ms |

---

## Implementation Examples

### Example 1: Using LLM Service

```python
from services.llm_service import get_llm_service

llm_service = get_llm_service()

# Call LLM with automatic model selection
response = await llm_service.call_llm(
    task_type="analyze",
    messages=[{"role": "user", "content": prompt}]
)

# Extract and validate JSON
data = llm_service.extract_json_response(
    response,
    required_keys=["category", "urgency"]
)
```

### Example 2: Handling Errors

```python
try:
    response = await llm_service.call_llm(
        task_type="judge",
        messages=[...]
    )
except OpenAIError as e:
    # Log and handle gracefully
    llm_logger.logger.error(f"LLM error: {e}")
    # Return default response
    return JudgeResponse(
        quality_score=5,
        is_approved=False
    )
```

### Example 3: Monitoring Performance

```python
from utils.logging_config import TimingContext

with TimingContext("judge_analysis") as timer:
    response = await llm_service.call_llm(...)

latency_ms = timer.get_elapsed_ms()
llm_logger.log_performance(
    task_type="judge_analysis",
    model_id="gpt-oss-120b",
    latency_ms=latency_ms,
    total_tokens=250
)
```

---

## Project Structure

```
backend/
├── config/
│   ├── __init__.py
│   └── models.py                    # Model configuration
├── services/
│   ├── __init__.py
│   └── llm_service.py              # Centralized LLM service
├── utils/
│   ├── __init__.py
│   ├── response_cleaner.py         # Response sanitization
│   └── logging_config.py           # Structured logging
├── middleware/
│   ├── __init__.py
│   └── error_handler.py            # Error handling middleware
├── main.py                          # FastAPI application
├── requirements.txt                 # Python dependencies
└── MULTI_LLM_ARCHITECTURE.md       # This file
```

---

## Migration Guide (v1.0 → v2.0)

### For Developers

1. **Install new dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Update imports in your code:**
   ```python
   # Old
   from openai import OpenAI
   client = OpenAI(...)

   # New
   from services.llm_service import get_llm_service
   llm_service = get_llm_service()
   ```

3. **Use LLM service:**
   ```python
   # Old
   response = query_hf_router(model=model_name, prompt=prompt)

   # New
   response = await llm_service.call_llm(
       task_type="analyze",
       messages=[{"role": "user", "content": prompt}]
   )
   ```

### For DevOps

1. **Environment variables:** No change needed
2. **API endpoints:** All endpoints remain compatible
3. **Response format:** No breaking changes
4. **Logging:** New structured JSON logs available

---

## Future Enhancements

### Planned Features

1. **Async Pipeline Processing**
   - Run independent tasks in parallel
   - Reduce end-to-end latency

2. **Response Caching**
   - Cache similar queries
   - Reduce API calls

3. **Batch Processing**
   - Process multiple tickets at once
   - Cost optimization

4. **Custom Model Support**
   - Allow endpoint-specific model override
   - A/B testing capability

5. **Advanced Monitoring**
   - Real-time performance dashboard
   - Cost tracking per endpoint
   - Model comparison metrics

6. **Fine-tuned Models**
   - Custom models for specific use cases
   - Improved accuracy

---

## Troubleshooting

### Issue: Model Not Found

**Error:** `"Invalid model name"`

**Solution:**
1. Check Hugging Face Router availability
2. Verify model ID in `config/models.py`
3. Check API key permissions

### Issue: Timeout Errors

**Error:** `"Operation timed out"`

**Solution:**
1. Check Hugging Face Router status
2. Increase timeout in config
3. Check network connectivity

### Issue: JSON Parsing Errors

**Error:** `"Failed to extract JSON from response"`

**Solution:**
1. Check prompt for JSON instructions
2. Verify response format
3. Check model output in logs

---

## Support & Questions

For issues or questions about the multi-LLM architecture:
1. Check structured logs for detailed error information
2. Review this documentation
3. Check Hugging Face Router status page
4. Contact support with logs attached

---

## Version History

**v2.0** (2026-05-27)
- ✨ Multi-LLM architecture implementation
- ✨ Specialized models for each task
- ✨ Structured logging & monitoring
- ✨ Retry logic with fallback support
- ✨ Response sanitization utilities
- ✨ Error handling middleware

**v1.0** (2026-05-20)
- Initial single-model implementation

---

## Model Configuration Reference

All models use Hugging Face Router v1 API:
```
https://router.huggingface.co/v1
```

Compatible models can be swapped by updating `config/models.py`.

**For more information:**
- [Hugging Face Router Documentation](https://huggingface.co/router)
- [Model Availability](https://huggingface.co/router/models)
- [API Documentation](https://huggingface.co/router/api)

---

*Document version: 2.0*
*Last updated: 2026-05-27*
*Maintained by: AI Support Team*
