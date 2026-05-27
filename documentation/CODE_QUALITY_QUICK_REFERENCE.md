# Code Quality Improvements - Quick Reference

## What Was Fixed

### 1️⃣ Magic Numbers → Config Class

**Before:**
```python
allow_origins=["http://localhost:5173"]  # ⚠️ Hardcoded
if len(text) > 10000:  # ⚠️ Magic number
    ...
```

**After:**
```python
allow_origins=Config.ALLOWED_ORIGINS  # ✅ From Config class
if len(text) > Config.MAX_INPUT_LENGTH:  # ✅ Named constant
    ...
```

### 2️⃣ Duplicate Code → Single Helper Function

**Before:**
```python
# Repeated 4+ times in different endpoints
json_start = response.find('{')
json_end = response.rfind('}')
json_str = response[json_start:json_end+1]
parsed = json.loads(json_str)
```

**After:**
```python
# Single source of truth
parsed = extract_json_from_response(response, field_name="my_endpoint")
```

---

## What Changed (Location Summary)

### File: `application/backend/main.py`

| What | Where | Why |
|------|-------|-----|
| Added `IntEnum` import | Line 7 | For TokenLimits |
| Added `TokenLimits` class | Lines 31-48 | Centralized token limits |
| Added `Config` class | Lines 51-66 | Centralized configuration |
| Added `extract_json_from_response()` | Lines 103-132 | DRY principle |
| Updated CORS | Line 83 | Uses `Config.ALLOWED_ORIGINS` |
| Updated sanitize_user_input | Line 103 | Uses `Config.MAX_INPUT_LENGTH` |

---

## How to Use

### TokenLimits Enum
```python
# Each endpoint has a named token limit
TokenLimits.RELEVANCE_JUDGE = 200
TokenLimits.ANALYSIS = 150
TokenLimits.ANALYSIS_JUDGE = 200
TokenLimits.GUIDANCE = 300
TokenLimits.EMAIL = 400
TokenLimits.QUALITY_JUDGE = 350
```

### Config Class
```python
Config.MODEL_NAME           # LLM model to use
Config.ALLOWED_ORIGINS      # CORS allowed domains
Config.API_BASE_URL         # API endpoint
Config.MAX_INPUT_LENGTH     # Max input size (10,000 chars)
Config.LOG_LEVEL           # Logging level
```

### JSON Extraction Helper
```python
# Extract JSON from LLM response
try:
    data = extract_json_from_response(response, field_name="relevance_judge")
except ValueError as e:
    logger.error(f"Failed to parse: {e}")
```

---

## Configuration

### Development (Local)
Defaults are used automatically:
```bash
python -m uvicorn main:app --reload
# Uses ALLOWED_ORIGINS=http://localhost:5173 by default
```

### Production
Set environment variables:
```bash
export MODEL_NAME="meta-llama/Llama-3.1-8B-Instruct"
export ALLOWED_ORIGINS="https://yourdomain.com"
export MAX_INPUT_LENGTH="10000"
export LOG_LEVEL="INFO"
```

### Docker
```dockerfile
ENV MODEL_NAME="meta-llama/Llama-3.1-8B-Instruct"
ENV ALLOWED_ORIGINS="https://yourdomain.com"
ENV MAX_INPUT_LENGTH="10000"
```

---

## Token Limits Reference

| Endpoint | Limit | Purpose |
|----------|-------|---------|
| `RELEVANCE_JUDGE` | 200 | Validate ticket relevance |
| `ANALYSIS` | 150 | Analyze ticket (category, urgency) |
| `ANALYSIS_JUDGE` | 200 | Validate analysis |
| `GUIDANCE` | 300 | Generate guidance |
| `EMAIL` | 400 | Generate response email |
| `QUALITY_JUDGE` | 350 | Final quality check |

**To adjust:** Edit lines 31-48 in `main.py` or use environment variables.

---

## Benefits

### Code Quality ✅
- **Clear:** `Config.MAX_INPUT_LENGTH` vs magic number `10000`
- **Maintainable:** Change config once, affects entire app
- **DRY:** No duplicate code
- **Type-safe:** Enum prevents typos

### Operations ✅
- **Flexible:** Environment-variable driven
- **Production-ready:** Works in any environment
- **Auditable:** Configuration is explicit
- **Scalable:** Easy to add new settings

---

## Checklist

### For Developers
- [ ] Use `Config.SETTING_NAME` instead of hardcoded values
- [ ] Use `TokenLimits.ENDPOINT_NAME` for token limits
- [ ] Use `extract_json_from_response()` for JSON parsing
- [ ] Never hardcode environment-specific values

### For Operations
- [ ] Set `ALLOWED_ORIGINS` for your domain
- [ ] Verify `MAX_INPUT_LENGTH` fits your use case
- [ ] Test configuration changes before production
- [ ] Monitor logs for configuration issues

---

## Testing

```bash
# Check configuration
python -c "from main import Config; print(Config.ALLOWED_ORIGINS)"

# Test with custom config
export ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5173"
python -m uvicorn main:app

# Test JSON extraction
python -c "from main import extract_json_from_response; print(extract_json_from_response('{\"test\": true}'))"
```

---

## Common Changes

### Add New Token Limit
```python
class TokenLimits(IntEnum):
    RELEVANCE_JUDGE = 200
    MY_NEW_ENDPOINT = 250  # ← Add here
```

### Add New Config Variable
```python
class Config:
    MODEL_NAME = os.getenv("MODEL_NAME", "default")
    MY_NEW_SETTING = os.getenv("MY_NEW_SETTING", "default_value")  # ← Add here
```

### Use New Config in Code
```python
# In your endpoint
my_value = Config.MY_NEW_SETTING
```

---

**Status:** ✅ Ready for Use  
**Last Updated:** May 27, 2026  
**Full Docs:** See `CODE_QUALITY_IMPROVEMENTS.md`
