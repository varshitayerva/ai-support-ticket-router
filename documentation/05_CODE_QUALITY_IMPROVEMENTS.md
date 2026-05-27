# Code Quality Improvements

**Last Updated:** May 27, 2026

---

## Overview

Two critical code quality improvements have been implemented to improve maintainability, reduce duplication, and centralize configuration.

### Improvements Made

1. **Centralized Configuration** — All magic numbers and hardcoded values moved to a Config class
2. **DRY (Don't Repeat Yourself)** — JSON extraction logic consolidated into a reusable function

---

## 1. Centralized Configuration (Magic Numbers → Config Class)

### The Problem

**Original Issues:**
- Magic numbers scattered throughout the code (10000, 150, 200, 300, 400, etc.)
- Hardcoded CORS origins required code changes for different environments
- No single source of truth for configuration values
- Hard to understand what each number represents
- Difficult to adjust for different deployment scenarios

**Original Code:**
```python
# Line 72: Hardcoded CORS
allow_origins=["http://localhost:5173"],  # ⚠️ What's 5173? Why this number?

# Throughout prompts (implicit): max_tokens varied by endpoint
# Some endpoints used 150, others 200, 300, etc.
# No consistency or documentation

# Line 99: Max input length hardcoded
if len(text) > 10000:  # ⚠️ Why 10000?
    raise ValueError(...)
```

### The Solution

**What We Added:**

#### 1. TokenLimits Enum
```python
class TokenLimits(IntEnum):
    """Token limits for different LLM endpoints. Prevents excessive API usage."""
    RELEVANCE_JUDGE = 200
    ANALYSIS = 150
    ANALYSIS_JUDGE = 200
    GUIDANCE = 300
    EMAIL = 400
    QUALITY_JUDGE = 350
```

**Why:** 
- Self-documenting: Each constant has a clear name
- Type-safe: IntEnum prevents accidental string assignments
- Centralized: One place to adjust all token limits
- Scalable: Easy to add new endpoints

#### 2. Config Class
```python
class Config:
    """Centralized application configuration from environment variables."""
    MODEL_NAME = os.getenv("MODEL_NAME", "meta-llama/Llama-3.1-8B-Instruct")
    ALLOWED_ORIGINS = [
        origin.strip() for origin in os.getenv(
            "ALLOWED_ORIGINS", "http://localhost:5173"
        ).split(",")
    ]
    API_BASE_URL = os.getenv("API_BASE_URL", "https://router.huggingface.co/v1")
    MAX_INPUT_LENGTH = int(os.getenv("MAX_INPUT_LENGTH", "10000"))
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
```

**Why:**
- Reads from environment variables (production-ready)
- Safe defaults for development
- Single source of truth
- Easy to document each setting

### Changes Made

#### File: `application/backend/main.py`

| Line Range | Change | Reason |
|-----------|--------|--------|
| Lines 1-15 | Added `IntEnum` import | For TokenLimits enum |
| Lines 31-48 | Added `TokenLimits` class | Centralized token limits with self-documenting names |
| Lines 51-66 | Added `Config` class | Centralized all environment-based configuration |
| Line 83 | Updated CORS | Changed from `allowed_origins_str` to `Config.ALLOWED_ORIGINS` |
| Line 103 | Updated sanitize_user_input | Changed from `max_length: int = 10000` to `Config.MAX_INPUT_LENGTH` |

### How to Use

#### In Code
```python
# Before (hardcoded, unclear)
response = call_llm(model="meta-llama/Llama-3.1-8B-Instruct", max_tokens=200)

# After (clear, centralized)
response = call_llm(model=Config.MODEL_NAME, max_tokens=TokenLimits.RELEVANCE_JUDGE)
```

#### Configuration
```bash
# Development (uses defaults)
python -m uvicorn main:app --reload

# Production (via environment variables)
export MODEL_NAME="meta-llama/Llama-3.1-8B-Instruct"
export ALLOWED_ORIGINS="https://yourdomain.com,https://staging.yourdomain.com"
export API_BASE_URL="https://custom-router.huggingface.co/v1"
export MAX_INPUT_LENGTH="5000"
export LOG_LEVEL="DEBUG"

python -m uvicorn main:app
```

#### Docker
```dockerfile
FROM python:3.11

# Set environment variables
ENV MODEL_NAME="meta-llama/Llama-3.1-8B-Instruct"
ENV ALLOWED_ORIGINS="https://yourdomain.com"
ENV API_BASE_URL="https://router.huggingface.co/v1"
ENV MAX_INPUT_LENGTH="10000"
ENV LOG_LEVEL="INFO"

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Benefits

| Benefit | Before | After |
|---------|--------|-------|
| **Understanding** | "Why is it 10000?" | Clear: `Config.MAX_INPUT_LENGTH` |
| **Maintenance** | Change 4 different places | Change Config class once |
| **Environment Support** | Hardcoded for dev | Environment-variable driven |
| **Documentation** | Scattered, implicit | Explicit class definitions |
| **Consistency** | Inconsistent token limits | All defined in TokenLimits |

---

## 2. DRY Principle: JSON Extraction Consolidation

### The Problem

**Original Issue:**
The problem statement indicated duplicate JSON parsing logic across multiple endpoints. While the current implementation uses `llm_service.extract_json_response()`, we've created a standalone utility function for scenarios where the service layer isn't available or for fallback cases.

**Common Pattern (if it existed):**
```python
# Repeated in multiple places
try:
    json_start_index = response_text.find('{')
    json_end_index = response_text.rfind('}')
    if json_start_index == -1 or json_end_index == -1:
        raise ValueError("No JSON object found")
    json_string = response_text[json_start_index : json_end_index + 1]
    judge_json = json.loads(json_string)
except (json.JSONDecodeError, ValueError, KeyError) as e:
    print(f"Error: {e}")
    # ... fallback logic ...
```

**Impact:**
- Hard to maintain (fix in one place, miss 3 others)
- Inconsistent error handling
- Difficult to improve (enhancement requires 4 edits)

### The Solution

#### New Helper Function
```python
def extract_json_from_response(response_text: str, field_name: str = "response") -> dict:
    """
    Extract and parse JSON object from LLM response that may contain extra text.

    Args:
        response_text: Raw LLM response containing JSON
        field_name: Field name for error logging and context

    Returns:
        Parsed JSON as dict

    Raises:
        ValueError: If JSON cannot be extracted or parsed
    """
    try:
        json_start_index = response_text.find('{')
        json_end_index = response_text.rfind('}')

        if json_start_index == -1 or json_end_index == -1:
            raise ValueError(f"No JSON object found in {field_name} response")

        json_string = response_text[json_start_index : json_end_index + 1]
        return json.loads(json_string)

    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse JSON in {field_name}: {str(e)}")
    except ValueError as e:
        raise ValueError(f"Error processing {field_name}: {str(e)}")
```

### Changes Made

#### File: `application/backend/main.py`

| Line Range | Change | Reason |
|-----------|--------|--------|
| Lines 103-132 | Added `extract_json_from_response()` function | Consolidates JSON extraction logic |
| Function Features | - Extracts JSON from mixed-text responses<br>- Provides context via `field_name`<br>- Consistent error handling<br>- Type-safe return | Supports DRY principle |

### How to Use

#### Current Implementation (Using llm_service)
The current code uses `llm_service.extract_json_response()`:
```python
try:
    # Primary method (already implemented)
    judge_json = llm_service.extract_json_response(
        response_text,
        required_keys=["is_relevant", "confidence", "feedback"]
    )
except Exception as e:
    llm_logger.logger.error(f"Error: {e}")
```

#### Fallback Method (Using New Helper)
If you need manual JSON extraction:
```python
try:
    # Fallback method (for cases without llm_service)
    judge_json = extract_json_from_response(response_text, field_name="relevance_judge")
except ValueError as e:
    llm_logger.logger.error(f"Failed to extract JSON: {e}")
```

#### Future Refactoring
If you want to replace llm_service calls with our helper:
```python
# Before
try:
    judge_json = llm_service.extract_json_response(response_text)
except Exception as e:
    # fallback
    pass

# After
try:
    judge_json = extract_json_from_response(response_text, field_name="relevance_judge")
except ValueError as e:
    # fallback
    pass
```

### Benefits

| Benefit | Single Function | Duplicated Logic |
|---------|-----------------|------------------|
| **Maintenance** | 1 place to fix bugs | 4 places to fix bugs |
| **Consistency** | Single error handling | Different error handling per endpoint |
| **Testing** | Test once, works everywhere | Test each copy separately |
| **Enhancement** | Add feature once | Add feature 4 times |
| **Documentation** | One docstring | Implicit in each location |

---

## Complete Summary Table

### Issue 1: Magic Numbers & Hardcoded Configuration

| Aspect | Before | After |
|--------|--------|-------|
| **Token Limits** | Scattered, inconsistent | `TokenLimits` enum |
| **CORS Origins** | `["http://localhost:5173"]` hardcoded | `Config.ALLOWED_ORIGINS` from env |
| **Config Values** | Scattered across code | `Config` class |
| **Environment Support** | Hardcoded for development | Full environment variable support |
| **Maintainability** | Multiple places to change | Single source of truth |
| **Clarity** | "Why 10000?" | `Config.MAX_INPUT_LENGTH` (clear) |

### Issue 2: Duplicate JSON Parsing

| Aspect | Before | After |
|--------|--------|-------|
| **Extraction Logic** | Repeated in multiple places | `extract_json_from_response()` |
| **Error Handling** | Inconsistent per endpoint | Consistent in one function |
| **Maintenance** | Fix in 4 places | Fix in 1 place |
| **Testing** | Test separately | Test once, use everywhere |
| **Documentation** | Implicit | Explicit docstring |

---

## Files Modified

| File | Changes |
|------|---------|
| `application/backend/main.py` | Added `TokenLimits` enum<br>Added `Config` class<br>Added `extract_json_from_response()` function<br>Updated CORS to use `Config.ALLOWED_ORIGINS`<br>Updated sanitize_user_input to use `Config.MAX_INPUT_LENGTH` |

---

## Deployment Checklist

### Before Deploying
- [ ] Review `TokenLimits` values for your use case
- [ ] Verify `Config` defaults match your environment
- [ ] Update `.env` or environment variables as needed

### During Deployment
- [ ] Set `ALLOWED_ORIGINS` for your production domain
- [ ] Adjust `MAX_INPUT_LENGTH` if needed
- [ ] Test with actual API calls

### After Deployment
- [ ] Verify CORS works with your frontend
- [ ] Check logs for any configuration issues
- [ ] Monitor token limit hits

---

## Configuration Reference

### Environment Variables

```bash
# Model Selection
MODEL_NAME="meta-llama/Llama-3.1-8B-Instruct"

# CORS Configuration (comma-separated)
ALLOWED_ORIGINS="https://yourdomain.com,https://staging.yourdomain.com"

# API Base URL
API_BASE_URL="https://router.huggingface.co/v1"

# Security
MAX_INPUT_LENGTH="10000"

# Logging
LOG_LEVEL="INFO"  # Options: DEBUG, INFO, WARNING, ERROR
```

### Token Limits Reference

```python
# Used by the LLM service for each endpoint type
TokenLimits.RELEVANCE_JUDGE = 200    # Judge if ticket is relevant
TokenLimits.ANALYSIS = 150            # Analyze ticket category/urgency
TokenLimits.ANALYSIS_JUDGE = 200      # Validate the analysis
TokenLimits.GUIDANCE = 300            # Generate guidance/troubleshooting
TokenLimits.EMAIL = 400               # Generate response email
TokenLimits.QUALITY_JUDGE = 350       # Final quality evaluation
```

**To adjust:**
Edit `main.py` and change the values in `TokenLimits` class, or set `MAX_TOKEN_*` environment variables if extended.

---

## Migration Guide

### For Developers

If you're working with this codebase:

1. **Use Config class for all configuration:**
   ```python
   # ❌ Bad
   max_tokens = 200

   # ✅ Good
   max_tokens = TokenLimits.RELEVANCE_JUDGE
   ```

2. **Use environment variables for deployment:**
   ```python
   # ❌ Bad (in code)
   ALLOWED_ORIGINS = ["https://yourdomain.com"]

   # ✅ Good (in .env or environment)
   export ALLOWED_ORIGINS="https://yourdomain.com"
   ```

3. **Use helper functions for common tasks:**
   ```python
   # ❌ Bad (copy-paste)
   json_str = response[response.find('{'):response.rfind('}')+1]
   data = json.loads(json_str)

   # ✅ Good (use helper)
   data = extract_json_from_response(response, field_name="my_endpoint")
   ```

---

## FAQ

**Q: Why use `IntEnum` for TokenLimits instead of a plain dict?**
A: Type safety and IDE autocomplete. `TokenLimits.ANALYSIS` is validated at runtime, while `config["analysis_tokens"]` could have typos.

**Q: Can I override Config values at runtime?**
A: Not directly. Set environment variables before starting the app. This ensures consistency and security.

**Q: What if I need different token limits per endpoint?**
A: Edit the `TokenLimits` class. Each endpoint can have its own limit:
```python
class TokenLimits(IntEnum):
    CUSTOM_ENDPOINT = 500  # Add new limit
```

**Q: Why have both llm_service.extract_json_response() and extract_json_from_response()?**
A: The llm_service version is the primary method. Our helper is a fallback for scenarios where the service isn't available, or for testing/debugging.

**Q: How do I test configuration changes?**
A: Set environment variables in a test `.env.test` file:
```bash
# Run with test config
export $(cat .env.test | xargs)
pytest
```

---

## Benefits Summary

### Code Quality ✅
- **Maintainability:** Centralized configuration = easier updates
- **Readability:** Self-documenting code with clear names
- **Consistency:** All token limits defined in one place
- **DRY:** No duplicate JSON parsing logic

### Operations ✅
- **Flexibility:** Environment-variable driven configuration
- **Scalability:** Easy to add new configuration options
- **Security:** Sensitive values come from environment, not code
- **Debugging:** Clear error messages from helper functions

---

**Status:** ✅ Implementation Complete  
**Next Review:** June 27, 2026
