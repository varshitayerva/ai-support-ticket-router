# Quick Start Guide - Multi-LLM Support Ticket Router v2.0

## 5-Minute Setup

### Step 1: Install Dependencies
```bash
cd application/backend
pip install -r requirements.txt
```

### Step 2: Set Environment Variable
```bash
export HUGGING_FACE_API_KEY="hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### Step 3: Start the Server
```bash
uvicorn main:app --reload
```

### Step 4: Verify It's Running
```bash
curl http://localhost:8000/
```

Expected response:
```json
{
  "message": "AI Support Ticket Router API is running (Multi-LLM v2.0)",
  "version": "2.0.0",
  "active_models": {
    "relevance_judge": "mistralai/Mistral-7B-Instruct-v0.2:featherless-ai",
    "analyze": "mistralai/Mistral-7B-Instruct-v0.2:featherless-ai",
    "judge_analysis": "openai/gpt-oss-120b:groq",
    "guidance": "Qwen/Qwen3.6-27B:featherless-ai",
    "email": "Qwen/Qwen3.6-27B:featherless-ai",
    "judge": "openai/gpt-oss-120b:groq"
  }
}
```

---

## Testing the API

### Test 1: Judge Relevance
```bash
curl -X POST http://localhost:8000/api/judge-relevance \
  -H "Content-Type: application/json" \
  -d '{"ticket": "My app keeps crashing when I click the login button"}'
```

### Test 2: Analyze Ticket
```bash
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"ticket": "I cannot login to my account. I keep getting an error message."}'
```

### Test 3: View Swagger Docs
```
http://localhost:8000/docs
```

---

## Project Structure

```
backend/
├── config/models.py               # ✅ Model configuration (where to swap models)
├── services/llm_service.py        # ✅ LLM service layer (retry, fallback, logging)
├── utils/
│   ├── response_cleaner.py       # ✅ JSON extraction & validation
│   └── logging_config.py         # ✅ Structured logging
├── middleware/error_handler.py    # ✅ Error handling
├── main.py                        # ✅ FastAPI app (all endpoints)
├── requirements.txt               # ✅ Dependencies
├── MULTI_LLM_ARCHITECTURE.md      # 📖 Full documentation (read this!)
├── IMPLEMENTATION_SUMMARY.md      # 📖 What was built
└── QUICK_START.md                 # 📖 This file
```

---

## Model Assignments

| Task | Model | Speed | Quality | Use Case |
|------|-------|-------|---------|----------|
| Relevance Check | Mistral 7B | ⚡⚡⚡ | Good | Binary classification |
| Analysis | Mistral 7B | ⚡⚡⚡ | Good | JSON extraction |
| Validate Analysis | GPT-OSS 120B | ⚡ | Excellent | Expert reasoning |
| Guidance | Qwen 3.6B | ⚡⚡ | Excellent | Detailed responses |
| Email | Qwen 3.6B | ⚡⚡ | Excellent | Professional tone |
| Quality Judge | GPT-OSS 120B | ⚡ | Excellent | Expert evaluation |

---

## How It Works

```
┌─────────────────────────────────┐
│     User Submits Ticket         │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│  LLM Service (Auto-routes)      │
│  ✓ Selects best model for task  │
│  ✓ Retries on failure           │
│  ✓ Uses fallback model if needed│
│  ✓ Logs performance metrics     │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│   6 Specialized AI Models       │
│   (Mistral, GPT-OSS, Qwen)      │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│  Response Cleaning & Parsing    │
│  ✓ Extract JSON                 │
│  ✓ Remove markdown              │
│  ✓ Validate schema              │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│   Return to Client              │
│   + Structured Logging          │
│   + Error Handling              │
└─────────────────────────────────┘
```

---

## Configuration

### To Change a Model

Edit `config/models.py`:

```python
MODEL_CONFIG = {
    "relevance_judge": {
        "model_id": "NEW-MODEL-HERE",  # ← Change this
        "max_tokens": 200,
        "temperature": 0.2,
        "timeout_seconds": 30,
    },
    ...
}
```

Then restart the app.

### To Adjust Settings

Edit `config/models.py`:

```python
RETRY_CONFIG = {
    "max_retries": 3,              # ← Change number of retries
    "initial_backoff_seconds": 1,  # ← Change wait time
    "max_backoff_seconds": 10,
    "backoff_multiplier": 2,
}
```

---

## Logs & Monitoring

### View Logs in Terminal

Structured logs are printed to console in JSON format:

```json
{
  "timestamp": "2026-05-27T10:30:00.000Z",
  "task_type": "analyze",
  "model_id": "mistralai/Mistral-7B-Instruct-v0.2:featherless-ai",
  "status": "success",
  "latency_ms": 275.5,
  "tokens": {"input": 85, "output": 42}
}
```

### Log Events to Track

- `status: "success"` - Request succeeded
- `event: "retry"` - Retrying failed request
- `event: "fallback"` - Using fallback model
- `status: "error"` - Request failed

---

## Troubleshooting

### API Key Not Found
```bash
# Set it
export HUGGING_FACE_API_KEY="hf_..."

# Verify it's set
echo $HUGGING_FACE_API_KEY
```

### Port Already in Use
```bash
# Use different port
uvicorn main:app --port 8001
```

### Model Not Available
- Check Hugging Face Router status
- Verify API key has access to model
- Check model_id in config/models.py

### Timeout Errors
- Increase timeout in config/models.py
- Check network connectivity
- Check Hugging Face Router status

---

## What's New in v2.0

✅ **Multiple specialized models** instead of one generic model
✅ **Automatic model routing** - no need to specify model per request
✅ **Retry logic** - automatic retries with backoff
✅ **Fallback models** - seamless degradation
✅ **Structured logging** - JSON logs for monitoring
✅ **Error handling** - consistent error responses
✅ **Response cleaning** - automatic JSON extraction & validation
✅ **100% API compatible** - no changes needed for existing code

---

## Performance

**Expected Latencies:**
- Judge Relevance: 200-400ms (Mistral)
- Analyze: 200-400ms (Mistral)
- Generate Guidance: 600-1000ms (Qwen)
- Generate Email: 600-1000ms (Qwen)
- Judge Analysis: 800-1200ms (GPT-OSS)
- Quality Judge: 800-1200ms (GPT-OSS)

**Full pipeline: ~4-5 seconds** (when run sequentially)

---

## Next Steps

1. **Read Full Documentation:** `MULTI_LLM_ARCHITECTURE.md`
2. **Test All Endpoints:** Use Swagger UI at `http://localhost:8000/docs`
3. **Monitor Logs:** Watch structured JSON logs in terminal
4. **Adjust Models:** Edit `config/models.py` as needed
5. **Deploy to Production:** Use uvicorn with gunicorn

---

## Example: Full Ticket Flow

### 1. Check if relevant
```bash
curl -X POST http://localhost:8000/api/judge-relevance \
  -d '{"ticket": "My login is broken"}'
```

### 2. Analyze the ticket
```bash
curl -X POST http://localhost:8000/api/analyze \
  -d '{"ticket": "My login is broken"}'
```

### 3. Generate guidance
```bash
curl -X POST http://localhost:8000/api/guidance \
  -d '{
    "ticket": "My login is broken",
    "analysis": {
      "category": "Account Management",
      "urgency": "High",
      "sentiment": "Negative"
    }
  }'
```

### 4. Generate email
```bash
curl -X POST http://localhost:8000/api/email \
  -d '{
    "ticket": "My login is broken",
    "analysis": {
      "category": "Account Management",
      "urgency": "High",
      "sentiment": "Negative"
    },
    "guidance": "Try resetting your password..."
  }'
```

---

## Architecture at a Glance

```
┌─────────────────────────────────────────────┐
│         FastAPI Application                 │
│  ✓ Error Handling Middleware                │
│  ✓ Request Logging Middleware               │
└──────────────────┬──────────────────────────┘
                   ↓
┌──────────────────────────────────────────────┐
│       LLM Service Layer                      │
│  ✓ Auto model selection                     │
│  ✓ Retry with exponential backoff           │
│  ✓ Fallback model support                   │
│  ✓ Response parsing & validation            │
│  ✓ Performance logging                      │
└──────────────────┬───────────────────────────┘
                   ↓
    ┌──────────────┼──────────────┐
    ↓              ↓              ↓
┌─────────┐  ┌──────────┐  ┌─────────┐
│ Mistral │  │ GPT-OSS  │  │  Qwen   │
│  7B     │  │  120B    │  │  3.6B   │
│ (Fast)  │  │ (Smart)  │  │(Detailed)
└─────────┘  └──────────┘  └─────────┘
    ↓              ↓              ↓
     └──────────────┬──────────────┘
                    ↓
        Hugging Face Router API
        (https://router.huggingface.co/v1)
```

---

## Support

- **Full Docs:** See `MULTI_LLM_ARCHITECTURE.md`
- **Code:** See source files with inline comments
- **Logs:** All operations logged as JSON
- **API Docs:** `http://localhost:8000/docs`

---

**Status: ✅ Ready for Production**

Start the server and you're good to go! 🚀
