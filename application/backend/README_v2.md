# AI Support Ticket Router v2.0 - Multi-LLM Architecture

**Version:** 2.0.0 | **Status:** ✅ Production Ready | **Release Date:** 2026-05-27

## Quick Links

- 🚀 **Getting Started:** [QUICK_START.md](QUICK_START.md) (5 minutes)
- 📚 **Full Documentation:** [MULTI_LLM_ARCHITECTURE.md](MULTI_LLM_ARCHITECTURE.md) (Complete technical guide)
- 🏗️ **Architecture Diagrams:** [ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md) (Visual overview)
- 📋 **Deployment Guide:** [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) (Production setup)
- 📖 **Implementation Details:** [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) (What was built)

## What's New in v2.0

✅ **6 Specialized AI Models** - Different model for each task
✅ **Automatic Model Routing** - No manual model selection needed
✅ **Retry Logic** - Automatic retries with exponential backoff
✅ **Fallback Models** - Seamless degradation on failure
✅ **Structured Logging** - JSON logs for monitoring
✅ **100% API Compatible** - Drop-in replacement for v1.0

## 5-Minute Setup

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Set API key
export HUGGING_FACE_API_KEY="hf_..."

# 3. Start server
uvicorn main:app --reload

# 4. Test it
curl http://localhost:8000/
```

## Model Assignments

| Task | Model | Speed | Quality |
|------|-------|-------|---------|
| Relevance Check | Mistral 7B | ⚡⚡⚡ | Good |
| Analysis | Mistral 7B | ⚡⚡⚡ | Good |
| Validate Analysis | GPT-OSS 120B | ⚡ | Excellent |
| Guidance | Qwen 3.6B | ⚡⚡ | Excellent |
| Email | Qwen 3.6B | ⚡⚡ | Excellent |
| Quality Judge | GPT-OSS 120B | ⚡ | Excellent |

## Architecture

```
Client Request
    ↓
FastAPI App (with middleware)
    ↓
LLM Service (automatic model routing)
    ↓
6 Specialized AI Models (optimized for each task)
    ↓
Hugging Face Router API
```

## API Endpoints

All endpoints from v1.0 still work - 100% compatible!

- `GET /` - Health check
- `GET /api/models` - List all models (new!)
- `POST /api/judge-relevance` - Check if ticket is relevant
- `POST /api/analyze` - Extract category, urgency, sentiment
- `POST /api/judge-analysis` - Validate extracted analysis
- `POST /api/guidance` - Generate troubleshooting/self-service guidance
- `POST /api/email` - Generate professional customer email
- `POST /api/judge` - Final quality scoring

## Key Features

### Automatic Retry Logic
- 3 automatic retries with exponential backoff
- Logs each retry attempt
- Falls back to alternative model if primary fails

### Structured Logging
- JSON-formatted logs for all operations
- Tracks: latency, tokens, errors, retries, fallbacks
- Ready for log aggregation systems

### Response Cleaning
- Automatic JSON extraction
- Removes markdown formatting
- Validates required fields
- Handles malformed responses gracefully

### Error Handling
- Consistent error responses
- Detailed error logging
- Graceful degradation with fallback models

## Configuration

Edit `config/models.py` to:
- Change model IDs
- Adjust temperature (creativity)
- Change token limits
- Modify timeouts
- Update fallback models

Changes take effect after restart.

## Monitoring

All operations logged as structured JSON:

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

Watch logs for:
- `status: success` - Working properly
- `event: retry` - Temporary failure (auto-recovered)
- `event: fallback` - Primary model failed, using backup
- `status: error` - Permanent failure

## Project Structure

```
backend/
├── config/
│   └── models.py                      # Model configuration
├── services/
│   └── llm_service.py                # Unified LLM service
├── utils/
│   ├── response_cleaner.py           # JSON extraction
│   └── logging_config.py             # Structured logging
├── middleware/
│   └── error_handler.py              # Error handling
├── main.py                            # FastAPI application
├── requirements.txt                   # Dependencies
│
└── Documentation/
    ├── QUICK_START.md                # 5-minute setup
    ├── MULTI_LLM_ARCHITECTURE.md     # Full technical docs
    ├── IMPLEMENTATION_SUMMARY.md      # What was built
    ├── DEPLOYMENT_CHECKLIST.md        # Production deployment
    └── ARCHITECTURE_DIAGRAM.md        # Visual diagrams
```

## Performance

### Latencies (Estimated)
- Fast models (Mistral): 200-400ms
- Smart models (GPT-OSS): 800-1200ms
- Detailed models (Qwen): 600-1000ms

### Full Pipeline
- Sequential execution: ~4-5 seconds
- With parallel execution: ~2-3 seconds (future optimization)

## Troubleshooting

### API Key Not Set
```bash
export HUGGING_FACE_API_KEY="hf_..."
```

### Port Already in Use
```bash
uvicorn main:app --port 8001
```

### Model Not Available
- Check Hugging Face Router status
- Verify API key permissions
- Check model_id in `config/models.py`

### Timeout Errors
- Check network connectivity
- Increase timeout in `config/models.py`
- Check Hugging Face Router status

See [MULTI_LLM_ARCHITECTURE.md](MULTI_LLM_ARCHITECTURE.md) for more troubleshooting.

## Deployment

### Development
```bash
uvicorn main:app --reload
```

### Production
```bash
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --timeout 60
```

See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for complete production setup.

## Testing

### Health Check
```bash
curl http://localhost:8000/
```

### List Models
```bash
curl http://localhost:8000/api/models
```

### Test Endpoint
```bash
curl -X POST http://localhost:8000/api/judge-relevance \
  -H "Content-Type: application/json" \
  -d '{"ticket": "My app crashes"}'
```

### Interactive Docs
```
http://localhost:8000/docs       (Swagger UI)
http://localhost:8000/redoc      (ReDoc)
```

## Migration from v1.0

### For Users
- **No changes needed!** API is 100% compatible
- All endpoints work exactly the same
- Responses have same format
- Status codes unchanged

### For Developers
- **No code changes needed!**
- Models are auto-selected based on task
- Just use the new LLM service layer
- All utilities provided

### For DevOps
- **Deploy like normal**
- Set `HUGGING_FACE_API_KEY` environment variable
- No database migrations
- No breaking changes

## Documentation

| Document | Purpose | Length | Read Time |
|----------|---------|--------|-----------|
| QUICK_START.md | Getting started in 5 minutes | 300 lines | 15 min |
| MULTI_LLM_ARCHITECTURE.md | Complete technical reference | 700+ lines | 45 min |
| IMPLEMENTATION_SUMMARY.md | What was built and how | 400+ lines | 20 min |
| ARCHITECTURE_DIAGRAM.md | Visual system diagrams | 400+ lines | 15 min |
| DEPLOYMENT_CHECKLIST.md | Production deployment guide | 400+ lines | 30 min |

## Next Steps

1. **Get Started:** Read [QUICK_START.md](QUICK_START.md)
2. **Understand:** Read [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
3. **Deep Dive:** Read [MULTI_LLM_ARCHITECTURE.md](MULTI_LLM_ARCHITECTURE.md)
4. **Deploy:** Follow [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

## Support

- **Questions:** Check the documentation files above
- **Issues:** Review logs for error messages
- **Troubleshooting:** See MULTI_LLM_ARCHITECTURE.md → Troubleshooting
- **Deployment:** See DEPLOYMENT_CHECKLIST.md

## Key Improvements from v1.0

### Performance
- ✅ Specialized models for each task
- ✅ Optimized temperature settings
- ✅ Appropriate token limits
- ✅ Better response quality

### Reliability
- ✅ Automatic retries (3 attempts)
- ✅ Exponential backoff
- ✅ Fallback models
- ✅ Better error handling

### Observability
- ✅ Structured JSON logs
- ✅ Latency tracking
- ✅ Token usage metrics
- ✅ Error tracking
- ✅ Event logging (retry, fallback)

### Maintainability
- ✅ Modular design
- ✅ Centralized configuration
- ✅ Type annotations
- ✅ Comprehensive documentation
- ✅ Easy model swapping

## System Requirements

- **Python:** 3.8+
- **CPU:** 2+ cores
- **RAM:** 4GB+
- **Disk:** 500MB+ for dependencies
- **Network:** Internet access to Hugging Face Router

## License & Support

For questions or issues:
1. Check the documentation
2. Review the logs
3. Check Hugging Face Router status
4. See troubleshooting guide

## Version History

**v2.0** (2026-05-27)
- ✨ Multi-LLM architecture
- ✨ Specialized models
- ✨ Structured logging
- ✨ Retry & fallback logic

**v1.0** (2026-05-20)
- Initial implementation with single model

---

**Status:** ✅ Production Ready

**Next Steps:** Start with [QUICK_START.md](QUICK_START.md)

*Last updated: 2026-05-27 | Version: 2.0 | Maintained by: AI Support Team*
