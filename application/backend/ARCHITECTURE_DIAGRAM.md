# Multi-LLM Architecture - Visual Diagrams

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Client Application                             │
│                  (React Frontend / External API)                     │
└──────────────────────────────────────┬──────────────────────────────┘
                                       ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      FastAPI Application                            │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │           Request Processing Pipeline                        │   │
│  │                                                               │   │
│  │  POST /api/analyze                                            │   │
│  │  POST /api/judge-relevance                                    │   │
│  │  POST /api/guidance                                           │   │
│  │  POST /api/email                                              │   │
│  │  POST /api/judge-analysis                                     │   │
│  │  POST /api/judge                                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              ↓                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │    Middleware Layer                                           │   │
│  │                                                               │   │
│  │  • RequestLoggingMiddleware                                   │   │
│  │    └─ Logs incoming requests (timestamp, method, path)       │   │
│  │                                                               │   │
│  │  • LLMErrorHandler                                            │   │
│  │    ├─ Catches HTTPException                                   │   │
│  │    └─ Catches general exceptions → logs errors               │   │
│  │                                                               │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────────┐
│                     LLM Service Layer                                │
│           (services/llm_service.py - Centralized)                   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  call_llm(task_type, messages)                               │   │
│  │                                                               │   │
│  │  1. Get config for task_type (from config/models.py)        │   │
│  │  2. Extract model_id, temperature, max_tokens, timeout      │   │
│  │  3. Attempt API call                                          │   │
│  │  4. On failure: Retry up to 3 times with exponential backoff │   │
│  │  5. On persistent failure: Use fallback model                │   │
│  │  6. Log performance metrics (latency, tokens)                │   │
│  │  7. Return response text                                      │   │
│  │                                                               │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              ↓                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  extract_json_response() / extract_text_response()           │   │
│  │                                                               │   │
│  │  • Clean markdown formatting                                 │   │
│  │  • Remove code blocks                                         │   │
│  │  • Extract JSON objects                                       │   │
│  │  • Validate required keys                                     │   │
│  │  • Return parsed/clean response                               │   │
│  │                                                               │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              ↓                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Structured Logging (logging_config.py)                      │   │
│  │                                                               │   │
│  │  Log events:                                                  │   │
│  │  • log_llm_call() - successful API calls                      │   │
│  │  • log_retry() - retry attempts                               │   │
│  │  • log_fallback() - fallback model activation                 │   │
│  │  • log_response_parsing() - parsing success/failure           │   │
│  │  • log_performance() - latency & token metrics                │   │
│  │                                                               │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    Model Selection Layer                             │
│            (config/models.py - Task-Based Routing)                  │
│                                                                      │
│  MODEL_CONFIG = {                                                    │
│    "relevance_judge": { model_id, temperature, max_tokens, ... },   │
│    "analyze": { model_id, temperature, max_tokens, ... },           │
│    "judge_analysis": { model_id, temperature, max_tokens, ... },    │
│    "guidance": { model_id, temperature, max_tokens, ... },          │
│    "email": { model_id, temperature, max_tokens, ... },             │
│    "judge": { model_id, temperature, max_tokens, ... }              │
│  }                                                                    │
│                                                                      │
│  FALLBACK_MODELS = {                                                 │
│    "mistralai/Mistral-7B" → "meta-llama/Llama-3.1-8B",             │
│    "openai/gpt-oss-120b" → "Qwen/Qwen3.6-27B",                     │
│    ...                                                               │
│  }                                                                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                                 ↓
        ┌────────────────────────┼────────────────────────┐
        ↓                        ↓                        ↓
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   MISTRAL 7B     │  │  GPT-OSS 120B    │  │   QWEN 3.6B      │
│ (via Groq)       │  │  (via Groq)      │  │ (via Featherless)│
│                  │  │                  │  │                  │
│ Fast • Cheap     │  │ Smart • Reasoning│  │ Detailed • NLG   │
│                  │  │                  │  │                  │
│ Tasks:           │  │ Tasks:           │  │ Tasks:           │
│ • Relevance ✓    │  │ • Analysis Judge │  │ • Guidance Gen. ✓│
│ • Analysis ✓     │  │ • Quality Judge  │  │ • Email Gen. ✓   │
│                  │  │                  │  │                  │
│ Max Tokens: 200  │  │ Max Tokens: 400  │  │ Max Tokens: 600  │
│ Temperature: 0.1 │  │ Temperature: 0.3 │  │ Temperature: 0.6 │
│ Latency: 200-400 │  │ Latency: 800-1200│  │ Latency: 600-1000│
│         (ms)     │  │         (ms)     │  │         (ms)     │
└────────────────┬─┘  └────────────────┬─┘  └────────────────┬─┘
                 │                     │                     │
                 │                     │                     │
                 └─────────────────────┼─────────────────────┘
                                       ↓
                    ┌──────────────────────────────────┐
                    │  Hugging Face Router v1 API      │
                    │  https://router.huggingface.co/v1│
                    │                                  │
                    │  OpenAI-Compatible Endpoint      │
                    │  POST /chat/completions          │
                    └──────────────────────────────────┘
                                       ↓
                    ┌──────────────────────────────────┐
                    │   LLM Model Inference            │
                    │   (Cloud-hosted)                 │
                    └──────────────────────────────────┘
```

---

## Request Flow - Detailed Example

### Example: Analyze Ticket

```
1. USER REQUEST
   ┌────────────────────────────────────────────┐
   │ POST /api/analyze                          │
   │ {                                          │
   │   "ticket": "My login is broken"          │
   │ }                                          │
   └────────────────────────────────────────────┘
                         ↓

2. REQUEST LOGGING MIDDLEWARE
   ┌────────────────────────────────────────────┐
   │ Log incoming request                       │
   │ {                                          │
   │   "event": "request",                      │
   │   "method": "POST",                        │
   │   "path": "/api/analyze"                   │
   │ }                                          │
   └────────────────────────────────────────────┘
                         ↓

3. ENDPOINT HANDLER (main.py)
   ┌────────────────────────────────────────────┐
   │ async def analyze_ticket(request)          │
   │ ├─ Extract ticket from request             │
   │ ├─ Get LLM service instance                │
   │ └─ Create analysis prompt                  │
   └────────────────────────────────────────────┘
                         ↓

4. LLM SERVICE - Get Config
   ┌────────────────────────────────────────────┐
   │ llm_service.call_llm(                      │
   │   task_type="analyze"                      │
   │ )                                          │
   │                                            │
   │ → Get config from config/models.py         │
   │ {                                          │
   │   "model_id": "mistralai/Mistral-7B...",  │
   │   "max_tokens": 150,                       │
   │   "temperature": 0.1,                      │
   │   "timeout": 30                            │
   │ }                                          │
   └────────────────────────────────────────────┘
                         ↓

5. ATTEMPT API CALL
   ┌────────────────────────────────────────────┐
   │ OpenAI().chat.completions.create(          │
   │   model="mistralai/Mistral-7B...",        │
   │   messages=[{"role": "user", ...}],       │
   │   max_tokens=150,                          │
   │   temperature=0.1,                         │
   │   timeout=30                               │
   │ )                                          │
   └────────────────────────────────────────────┘
                         ↓
                    [SUCCESS]
                         ↓

6. RESPONSE PROCESSING
   ┌────────────────────────────────────────────┐
   │ LLM Response:                              │
   │ {"category": "Account", "urgency": "High"}│
   │                                            │
   │ → extract_json_response()                  │
   │   ├─ Remove markdown formatting           │
   │   ├─ Remove code blocks                    │
   │   ├─ Extract JSON                          │
   │   └─ Validate required keys                │
   │       ✓ category present                   │
   │       ✓ urgency present                    │
   │       ✓ sentiment present                  │
   └────────────────────────────────────────────┘
                         ↓

7. STRUCTURED LOGGING
   ┌────────────────────────────────────────────┐
   │ log_llm_call()                             │
   │ {                                          │
   │   "timestamp": "2026-05-27T...",          │
   │   "task_type": "analyze",                  │
   │   "model_id": "mistralai/Mistral-7B...",  │
   │   "endpoint": "/api/analyze",              │
   │   "status": "success",                     │
   │   "latency_ms": 275.5,                     │
   │   "tokens": {                              │
   │     "input": 85,                           │
   │     "output": 42,                          │
   │     "total": 127                           │
   │   }                                        │
   │ }                                          │
   └────────────────────────────────────────────┘
                         ↓

8. RESPONSE VALIDATION
   ┌────────────────────────────────────────────┐
   │ Create TicketAnalysis model                │
   │ TicketAnalysis(                            │
   │   category="Account Management",           │
   │   urgency="High",                          │
   │   sentiment="Negative"                     │
   │ )                                          │
   └────────────────────────────────────────────┘
                         ↓

9. CLIENT RESPONSE
   ┌────────────────────────────────────────────┐
   │ HTTP 200 OK                                │
   │ {                                          │
   │   "category": "Account Management",        │
   │   "urgency": "High",                       │
   │   "sentiment": "Negative"                  │
   │ }                                          │
   └────────────────────────────────────────────┘
```

---

## Retry & Fallback Flow

```
┌──────────────────────────────────────────────┐
│  call_llm(task_type="analyze")              │
└────────────────┬─────────────────────────────┘
                 ↓
    ┌────────────────────────────┐
    │ Attempt 1: Try Primary Model
    │ (mistralai/Mistral-7B)      │
    │                             │
    │ timeout=30 seconds          │
    └────────┬────────────────────┘
             ↓
          [SUCCESS] → Return response
                 OR [FAILURE] → Continue
             ↓
    ┌────────────────────────────┐
    │ Log Retry Event             │
    │ Wait 1 second (exponential  │
    │ backoff)                    │
    │                             │
    │ Attempt 2: Try Primary Model
    │ timeout=30 seconds          │
    └────────┬────────────────────┘
             ↓
          [SUCCESS] → Return response
                 OR [FAILURE] → Continue
             ↓
    ┌────────────────────────────┐
    │ Log Retry Event             │
    │ Wait 2 seconds (2x backoff) │
    │                             │
    │ Attempt 3: Try Primary Model
    │ timeout=30 seconds          │
    └────────┬────────────────────┘
             ↓
          [SUCCESS] → Return response
                 OR [FAILURE] → Continue
             ↓
    ┌────────────────────────────┐
    │ Log Retry Event             │
    │ Wait 4 seconds (2x backoff) │
    │                             │
    │ Attempt 4: Try Primary Model
    │ timeout=30 seconds          │
    └────────┬────────────────────┘
             ↓
          [SUCCESS] → Return response
                 OR [FAILURE] → Continue
             ↓
    ┌────────────────────────────────┐
    │ Log Fallback Event              │
    │ Switch to Fallback Model        │
    │                                 │
    │ Get fallback from:              │
    │ FALLBACK_MODELS[primary_model]  │
    │                                 │
    │ mistralai/Mistral-7B →          │
    │   meta-llama/Llama-3.1-8B       │
    │                                 │
    │ Attempt 5: Try Fallback Model   │
    │ timeout=30 seconds              │
    └────────┬────────────────────────┘
             ↓
          [SUCCESS] → Return response
                 OR [FAILURE] → Error
             ↓
    ┌────────────────────────────────┐
    │ Return error to client          │
    │ Log error event                 │
    │ Include error details           │
    └────────────────────────────────┘
```

---

## Data Flow - Full Pipeline

```
TICKET → Judge Relevance → Analyze → Guidance → Email → Judge Quality
         (Mistral 7B)   (Mistral) (Qwen 3.6B) (Qwen) (GPT-OSS 120B)
            ↓               ↓          ↓         ↓        ↓
         200-400ms    200-400ms   600-1000ms  600-1000ms 800-1200ms
         (Fast)       (Fast)      (Detailed)  (Detailed) (Smart)

         ├─ is_relevant ✓
         │
         ├─ category
         ├─ urgency
         ├─ sentiment ✓
         │
         ├─ is_correct
         ├─ confidence ✓
         │
         ├─ guidance
         ├─ troubleshooting
         ├─ self-service ✓
         │
         ├─ finalEmail
         ├─ tone
         ├─ empathy ✓
         │
         ├─ quality_score (1-10)
         ├─ correctness_score (1-10)
         ├─ relevance_score (1-10)
         ├─ is_approved ✓


         Total Pipeline Time: ~4-5 seconds (sequential execution)
         Possible Optimization: ~2-3 seconds (parallel execution)
```

---

## Service Layer - Interaction Diagram

```
┌─────────────────────────────────────────┐
│      Main Application (main.py)         │
│                                         │
│  @app.post("/api/analyze")             │
│  async def analyze_ticket(...):        │
│    ├─ get_llm_service()                │
│    ├─ call_llm()                       │
│    ├─ extract_json_response()          │
│    └─ return response                  │
└────────────────┬────────────────────────┘
                 ↓
┌────────────────────────────────────┐
│    LLM Service (services/)         │
│  ├─ call_llm()                     │
│  ├─ extract_json_response()        │
│  └─ extract_text_response()        │
└────────┬───────────────┬───────────┘
         ↓               ↓
   ┌─────────────┐  ┌──────────────────┐
   │ Config      │  │ Response Cleaner │
   │ (models.py) │  │ (cleaner.py)     │
   │             │  │                  │
   │ get_model   │  │ extract_json()   │
   │ _config()   │  │ validate_schema()│
   └─────────────┘  └────────────┬─────┘
                                 ↓
                    ┌────────────────────────┐
                    │ Logging                │
                    │ (logging_config.py)    │
                    │                        │
                    │ log_llm_call()         │
                    │ log_retry()            │
                    │ log_fallback()         │
                    │ log_performance()      │
                    └────────────────────────┘
```

---

## Error Handling Flow

```
REQUEST
  ↓
TRY {
  LLM Service.call_llm()
    ├─ PRIMARY MODEL FAILS
    │  ├─ Retry 1 (wait 1s) → Fail
    │  ├─ Retry 2 (wait 2s) → Fail
    │  ├─ Retry 3 (wait 4s) → Fail
    │  └─ Use FALLBACK MODEL → Success/Fail
    │
    └─ Handle response
       ├─ Extract JSON
       ├─ Validate schema
       └─ Return data
}
CATCH HTTPException {
  LLMErrorHandler middleware
  ├─ Log error
  ├─ Return 503 error
  └─ Status = Service Unavailable
}
CATCH Exception {
  LLMErrorHandler middleware
  ├─ Log error
  ├─ Return 500 error
  └─ Status = Internal Server Error
}
  ↓
RESPONSE (JSON)
{
  "error": "message",
  "status_code": 503,
  "timestamp": "..."
}
```

---

## Configuration Relationship

```
┌─────────────────────────────────────────────────┐
│ config/models.py (Central Configuration)        │
│                                                 │
│ MODEL_CONFIG = {                               │
│   "analyze": {                                 │
│     "model_id": "mistralai/Mistral-7B...",    │
│     "max_tokens": 150,                        │
│     "temperature": 0.1,                       │
│     "timeout_seconds": 30,                    │
│     "description": "Structured extraction"    │
│   },                                          │
│   ...                                         │
│ }                                             │
│                                               │
│ FALLBACK_MODELS = {                           │
│   "mistralai/Mistral-7B" →                   │
│     "meta-llama/Llama-3.1-8B"                │
│ }                                             │
│                                               │
│ RETRY_CONFIG = {                              │
│   "max_retries": 3,                           │
│   "initial_backoff_seconds": 1,               │
│   "max_backoff_seconds": 10,                  │
│   "backoff_multiplier": 2                     │
│ }                                             │
└────┬────────────────────────────────────┬─────┘
     ↓                                    ↓
┌─────────────────┐             ┌──────────────────┐
│ LLM Service     │             │ Endpoints        │
│ get_model       │             │ (main.py)        │
│ _config()       │             │                  │
│ get_fallback    │             │ /analyze         │
│ _model()        │             │ /judge-relevance │
└─────────────────┘             │ /guidance        │
                                │ /email           │
                                │ /judge           │
                                └──────────────────┘

CHANGE = Edit config/models.py → Restart → All endpoints use new config
```

---

## File Organization

```
backend/
│
├── config/
│   ├── __init__.py
│   └── models.py ........................ Model assignments & fallbacks
│
├── services/
│   ├── __init__.py
│   └── llm_service.py .................. LLM API wrapper with retry/fallback
│
├── utils/
│   ├── __init__.py
│   ├── response_cleaner.py ............ JSON extraction & response cleaning
│   └── logging_config.py ............. Structured logging
│
├── middleware/
│   ├── __init__.py
│   └── error_handler.py .............. Error handling & request logging
│
├── main.py ............................ FastAPI app with all endpoints
├── requirements.txt ................... Dependencies
│
└── Documentation/
    ├── MULTI_LLM_ARCHITECTURE.md ...... Full technical documentation
    ├── IMPLEMENTATION_SUMMARY.md ...... What was built & how
    ├── QUICK_START.md ................. Getting started in 5 minutes
    ├── DEPLOYMENT_CHECKLIST.md ........ Production deployment guide
    └── ARCHITECTURE_DIAGRAM.md ........ This file (visual diagrams)
```

---

## Temperature Settings Rationale

```
                    0.0 ————————————————————→ 1.0
             Deterministic              Creative/Random

Relevance Judge:     0.2 ✓
├─ Binary decision needed
├─ Consistent output important
└─ Low randomness desired

Analysis:            0.1 ✓
├─ Metadata extraction
├─ Consistency critical
└─ No variation wanted

Judge Analysis:      0.3 ✓
├─ Reasoning required
├─ Some variation okay
└─ Balance of reasoning & consistency

Guidance:            0.5 ✓
├─ Detailed generation
├─ Helpful variations
└─ Balanced approach

Email:               0.6 ✓
├─ Professional tone
├─ Varied phrasing
└─ Empathetic variations

Judge Quality:       0.2 ✓
├─ Scoring needed
├─ Consistent evaluation
└─ Low randomness desired
```

---

## Token Limit Rationale

```
Task          Tokens   Reason
─────────────────────────────────────────────
Relevance     200      Binary decision + confidence + feedback
Analysis      150      JSON with 3 fields (category, urgency, sentiment)
Judge Analy.  250      JSON with validation + confidence + detailed feedback
Guidance      500      Detailed troubleshooting/self-service steps
Email         600      Professional email with multiple paragraphs
Judge Quality 400      Detailed quality scoring + multi-dimensional feedback

Total Pipeline: ~1500-2000 tokens per full request
```

---

*These diagrams illustrate the multi-LLM architecture at different levels of detail.*
*For implementation details, see the source code comments and MULTI_LLM_ARCHITECTURE.md.*
