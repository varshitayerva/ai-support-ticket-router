# API Quick Reference Guide

**Version:** 2.0.0  
**Base URL:** `http://localhost:8000` (or production URL)

---

## 📋 All Endpoints at a Glance

| # | Endpoint | Method | Rate Limit | Purpose |
|---|----------|--------|------------|---------|
| 1 | `/` | GET | Unlimited | Health check |
| 2 | `/api/models` | GET | Unlimited | List models |
| 3 | `/api/judge-relevance` | POST | 20/min | Validate ticket relevance |
| 4 | `/api/analyze` | POST | 15/min | Extract category, urgency, sentiment |
| 5 | `/api/guidance` | POST | 15/min | Generate troubleshooting/guidance |
| 6 | `/api/email` | POST | 15/min | Generate customer response email |
| 7 | `/api/judge-analysis` | POST | 10/min | Validate analysis accuracy |
| 8 | `/api/judge` | POST | 10/min | Final quality check |

---

## 🚀 Quick Examples

### 1️⃣ Health Check
```bash
curl http://localhost:8000/
```
**Response:** Status + active models

---

### 2️⃣ Judge Relevance
```bash
curl -X POST http://localhost:8000/api/judge-relevance \
  -H "Content-Type: application/json" \
  -d '{"ticket": "My app crashes on startup"}'
```
**Response:**
```json
{
  "is_relevant": true,
  "confidence": 0.95,
  "feedback": "Legitimate technical issue"
}
```

---

### 3️⃣ Analyze Ticket
```bash
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"ticket": "I was charged twice for my subscription"}'
```
**Response:**
```json
{
  "category": "Billing Inquiry",
  "urgency": "Medium",
  "sentiment": "Negative"
}
```

---

### 4️⃣ Get Guidance
```bash
curl -X POST http://localhost:8000/api/guidance \
  -H "Content-Type: application/json" \
  -d '{
    "ticket": "I was charged twice",
    "analysis": {
      "category": "Billing Inquiry",
      "urgency": "Medium",
      "sentiment": "Negative"
    }
  }'
```
**Response:**
```json
{
  "guidance": "1. Check transaction history... 2. Contact billing... 3. If unresolved, escalate"
}
```

---

### 5️⃣ Generate Email
```bash
curl -X POST http://localhost:8000/api/email \
  -H "Content-Type: application/json" \
  -d '{
    "ticket": "I was charged twice",
    "analysis": {
      "category": "Billing Inquiry",
      "urgency": "Medium",
      "sentiment": "Negative"
    },
    "guidance": "We found duplicate charge..."
  }'
```
**Response:**
```json
{
  "finalEmail": "Subject: Billing Help\n\nDear customer,\nWe found a duplicate charge..."
}
```

---

### 6️⃣ Judge Analysis
```bash
curl -X POST http://localhost:8000/api/judge-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "ticket": "Can I download my data?",
    "analysis": {
      "category": "Data Request",
      "urgency": "Low",
      "sentiment": "Neutral"
    }
  }'
```
**Response:**
```json
{
  "is_correct": true,
  "confidence": 0.92,
  "feedback": "Correct analysis"
}
```

---

### 7️⃣ Judge Response
```bash
curl -X POST http://localhost:8000/api/judge \
  -H "Content-Type: application/json" \
  -d '{
    "ticket": "App won''t start",
    "analysis": {
      "category": "Technical Issue",
      "urgency": "High",
      "sentiment": "Negative"
    },
    "guidance": "Clear cache and restart...",
    "finalEmail": "Subject: Technical Help\n\nDear customer..."
  }'
```
**Response:**
```json
{
  "quality_score": 9,
  "correctness_score": 8,
  "relevance_score": 9,
  "overall_score": 8,
  "feedback": "Excellent response",
  "is_approved": true
}
```

---

## 📊 Input/Output Summary

### Judge Relevance
| | |
|---|---|
| **Input** | `{ticket: string}` |
| **Output** | `{is_relevant: bool, confidence: float, feedback: string}` |
| **Time** | ~1-3 seconds |

### Analyze Ticket
| | |
|---|---|
| **Input** | `{ticket: string}` |
| **Output** | `{category: CategoryEnum, urgency: UrgencyEnum, sentiment: SentimentEnum}` |
| **Time** | ~1-3 seconds |

### Get Guidance
| | |
|---|---|
| **Input** | `{ticket: string, analysis: TicketAnalysis}` |
| **Output** | `{guidance: string}` |
| **Time** | ~2-5 seconds |

### Generate Email
| | |
|---|---|
| **Input** | `{ticket: string, analysis: TicketAnalysis, guidance: string}` |
| **Output** | `{finalEmail: string}` |
| **Time** | ~3-5 seconds |

### Judge Analysis
| | |
|---|---|
| **Input** | `{ticket: string, analysis: TicketAnalysis}` |
| **Output** | `{is_correct: bool, confidence: float, feedback: string}` |
| **Time** | ~2-4 seconds |

### Judge Response
| | |
|---|---|
| **Input** | `{ticket: string, analysis: TicketAnalysis, guidance: string, finalEmail: string}` |
| **Output** | `{quality_score: int, correctness_score: int, relevance_score: int, overall_score: int, feedback: string, is_approved: bool}` |
| **Time** | ~3-5 seconds |

---

## 🎯 Category Enum Values

```
Technical Issue
Billing Inquiry
Feature Request
General Question
Account Management
Bug Report
Complaint/Escalation
Security/Privacy
Refund Request
Integration Issue
Performance Issue
Documentation/API Question
Data Request
Service Status
```

---

## 📈 Urgency Enum Values

```
Low
Medium
High
```

---

## 😊 Sentiment Enum Values

```
Positive
Neutral
Negative
```

---

## ⚠️ Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success ✅ |
| 400 | Bad request (invalid input) |
| 429 | Rate limited (too many requests) |
| 500 | Server error |
| 503 | Service unavailable |

---

## 🔄 Typical Workflow

```
1. POST /api/judge-relevance
   ↓ (if relevant)
2. POST /api/analyze
   ↓
3. POST /api/guidance
   ↓
4. POST /api/email
   ↓
5. POST /api/judge-analysis (validate #2)
   ↓
6. POST /api/judge (final check)
   ↓ (if approved)
7. Send email to customer
```

---

## 📱 Python Example

```python
import requests
import json

BASE_URL = "http://localhost:8000"

# 1. Analyze ticket
response = requests.post(
    f"{BASE_URL}/api/analyze",
    json={"ticket": "My app keeps crashing"}
)
analysis = response.json()
print(analysis)
# Output: {category: Technical Issue, urgency: High, sentiment: Negative}

# 2. Get guidance
response = requests.post(
    f"{BASE_URL}/api/guidance",
    json={
        "ticket": "My app keeps crashing",
        "analysis": analysis
    }
)
guidance = response.json()
print(guidance)
# Output: {guidance: "1. Clear cache... 2. Restart..."}

# 3. Generate email
response = requests.post(
    f"{BASE_URL}/api/email",
    json={
        "ticket": "My app keeps crashing",
        "analysis": analysis,
        "guidance": guidance["guidance"]
    }
)
email = response.json()
print(email)
# Output: {finalEmail: "Subject: App Crash Help..."}
```

---

## 🌐 JavaScript/Node.js Example

```javascript
const BASE_URL = "http://localhost:8000";

async function analyzeTicket(ticket) {
  const response = await fetch(`${BASE_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticket })
  });
  return response.json();
}

async function getGuidance(ticket, analysis) {
  const response = await fetch(`${BASE_URL}/api/guidance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticket, analysis })
  });
  return response.json();
}

async function generateEmail(ticket, analysis, guidance) {
  const response = await fetch(`${BASE_URL}/api/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      ticket, 
      analysis, 
      guidance: guidance.guidance 
    })
  });
  return response.json();
}

// Usage
const ticket = "My subscription won't renew";
const analysis = await analyzeTicket(ticket);
const guidance = await getGuidance(ticket, analysis);
const email = await generateEmail(ticket, analysis, guidance);
console.log(email.finalEmail);
```

---

## 🎯 Common Use Cases

### Use Case 1: Auto-respond to emails
```
1. Parse email content
2. Call /api/judge-relevance (is it support?)
3. Call /api/analyze (what type?)
4. Call /api/guidance (what to do?)
5. Call /api/email (generate response)
6. Call /api/judge (quality OK?)
7. Send if approved
```

### Use Case 2: Support ticket routing
```
1. Call /api/analyze (get category & urgency)
2. Route to team based on category
3. Flag if high urgency
4. Track by sentiment (upset customers = escalate)
```

### Use Case 3: Quality control
```
1. For each response generated
2. Call /api/judge (rate quality)
3. Store scores for analytics
4. Improve if low scores
```

### Use Case 4: Analysis validation
```
1. Analyze ticket automatically
2. Call /api/judge-analysis (is it correct?)
3. If low confidence, route to human
4. If high confidence, auto-process
```

---

## 🚨 Rate Limit Status

Check headers in any response:

```
X-RateLimit-Limit: 15
X-RateLimit-Remaining: 12
X-RateLimit-Reset: 1685042340
```

Meaning:
- **Limit:** 15 requests/minute
- **Remaining:** 12 requests left
- **Reset:** Unix timestamp when limit resets

---

## 💡 Tips & Tricks

1. **Batch requests:** Use multiple tickets but respect rate limits
2. **Cache results:** Don't re-analyze same ticket
3. **Error handling:** Retry on 503, wait on 429
4. **Timeout:** Set 15-second timeout for all requests
5. **Logging:** Log all requests for debugging
6. **Fallbacks:** Have default responses if API fails

---

## 📞 Support

**Issues?** Check `API_ENDPOINTS_DOCUMENTATION.md` for detailed info

**Common Problems:**
- Rate limited? → Wait 1 minute
- Invalid category? → Use exact enum value
- Timeout? → API taking >15 seconds, retry
- 503 error? → Service temporarily down, retry

---

**Full documentation:** See `API_ENDPOINTS_DOCUMENTATION.md`

