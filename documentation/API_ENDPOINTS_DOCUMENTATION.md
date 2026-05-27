# API Endpoints Documentation - Complete Guide

**Last Updated:** May 27, 2026  
**API Version:** 2.0.0  
**Framework:** FastAPI  
**Status:** ✅ Production Ready

---

## 📋 Table of Contents

1. [Health Check Endpoint](#1-health-check-endpoint)
2. [List Models Endpoint](#2-list-models-endpoint)
3. [Judge Relevance Endpoint](#3-judge-relevance-endpoint)
4. [Analyze Ticket Endpoint](#4-analyze-ticket-endpoint)
5. [Get Guidance Endpoint](#5-get-guidance-endpoint)
6. [Generate Email Endpoint](#6-generate-email-endpoint)
7. [Judge Analysis Endpoint](#7-judge-analysis-endpoint)
8. [Judge Response Endpoint](#8-judge-response-endpoint)
9. [Error Handling](#error-handling)
10. [Rate Limiting](#rate-limiting)

---

## 🌐 Base URL

```
http://localhost:8000     (Development)
https://api.yourdomain.com (Production)
```

---

## 1. Health Check Endpoint

### Overview
Checks if the API is running and returns basic status information including active models.

### Request Details

| Property | Value |
|----------|-------|
| **Method** | GET |
| **Endpoint** | `/` |
| **Rate Limit** | Unlimited |
| **Authentication** | Not required |
| **Response Model** | JSON object |

### Request Example

```bash
curl -X GET http://localhost:8000/
```

### Response Example

```json
{
  "message": "AI Support Ticket Router API is running (Multi-LLM v2.0)",
  "version": "2.0.0",
  "active_models": [
    {
      "name": "mistral-7b",
      "task": "relevance_judge"
    },
    {
      "name": "mistral-7b",
      "task": "analyze"
    }
  ]
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `message` | String | API status message |
| `version` | String | API version number |
| `active_models` | Array | List of active LLM models |

### Use Case

- **Health monitoring:** Verify API is running
- **Model availability:** Check which models are active
- **System status:** Quick status check for dashboards

### Error Responses

```json
// 500 - Internal Server Error
{
  "detail": "Internal server error"
}
```

---

## 2. List Models Endpoint

### Overview
Returns all configured LLM models and their assigned task types.

### Request Details

| Property | Value |
|----------|-------|
| **Method** | GET |
| **Endpoint** | `/api/models` |
| **Rate Limit** | Unlimited |
| **Authentication** | Not required |
| **Response Model** | JSON object |

### Request Example

```bash
curl -X GET http://localhost:8000/api/models
```

### Response Example

```json
{
  "models": [
    {
      "name": "mistral-7b",
      "provider": "huggingface",
      "task": "relevance_judge",
      "max_tokens": 200,
      "temperature": 0.3
    },
    {
      "name": "mistral-7b",
      "provider": "huggingface",
      "task": "analyze",
      "max_tokens": 150,
      "temperature": 0.3
    },
    {
      "name": "qwen-3.6b",
      "provider": "huggingface",
      "task": "guidance",
      "max_tokens": 300,
      "temperature": 0.5
    }
  ],
  "description": "Each model is optimized for its specific task"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `models` | Array | List of configured models |
| `models[].name` | String | Model name/identifier |
| `models[].provider` | String | Model provider (huggingface, groq, etc.) |
| `models[].task` | String | Task type (relevance_judge, analyze, guidance, email, etc.) |
| `models[].max_tokens` | Integer | Maximum tokens for this task |
| `models[].temperature` | Float | Temperature for response variability |
| `description` | String | General description |

### Use Case

- **Model discovery:** Find available models
- **Task mapping:** See which model handles which task
- **Configuration verification:** Verify model assignments

### Error Responses

```json
// 500 - Internal Server Error
{
  "detail": "Failed to load models"
}
```

---

## 3. Judge Relevance Endpoint

### Overview
Validates if an incoming support ticket is actually a legitimate support issue (vs. spam or off-topic).

**Purpose:** Filter out non-support requests before processing  
**Model Used:** Mistral 7B  
**Task Type:** `relevance_judge`  
**Token Limit:** 200 tokens

### Request Details

| Property | Value |
|----------|-------|
| **Method** | POST |
| **Endpoint** | `/api/judge-relevance` |
| **Rate Limit** | 20 requests/minute |
| **Authentication** | Not required |
| **Request Model** | `TicketRequest` |
| **Response Model** | `RelevanceJudgeResponse` |
| **Content-Type** | application/json |

### Request Model

```python
class TicketRequest(BaseModel):
    ticket: str = Field(..., min_length=1, description="The combined content of the support ticket.")
```

### Request Example

```bash
curl -X POST http://localhost:8000/api/judge-relevance \
  -H "Content-Type: application/json" \
  -d '{
    "ticket": "My app keeps crashing when I upload files larger than 100MB. Error: OutOfMemoryException. Running on Windows 10."
  }'
```

### Response Model

```python
class RelevanceJudgeResponse(BaseModel):
    is_relevant: bool
    confidence: float
    feedback: str
```

### Response Example

**Valid Support Ticket:**
```json
{
  "is_relevant": true,
  "confidence": 0.95,
  "feedback": "This is a legitimate technical issue related to file upload functionality."
}
```

**Irrelevant Ticket:**
```json
{
  "is_relevant": false,
  "confidence": 0.98,
  "feedback": "This appears to be personal advice request unrelated to the platform."
}
```

### Response Fields

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| `is_relevant` | Boolean | true/false | Whether ticket is support-related |
| `confidence` | Float | 0.0-1.0 | Confidence level of judgment (0=low, 1=high) |
| `feedback` | String | - | Explanation of why ticket is/isn't relevant |

### Processing Flow

```
Input: Ticket text
  ↓
Sanitization: Type check, length check, injection prevention
  ↓
LLM Processing: Send to Mistral 7B with relevance prompt
  ↓
JSON Extraction: Parse model response
  ↓
Validation: Ensure required fields present
  ↓
Output: RelevanceJudgeResponse
```

### Validation Examples

**Valid Inputs:**
```
- "My password reset link isn't working"
- "I was overcharged $50 last month"
- "Can I export my account data?"
- "The app crashes on startup"
```

**Invalid Inputs (Rejected):**
```
- "" (empty string - min_length=1)
- "Tell me a joke" (off-topic)
- "Can you help me with my math homework?" (personal, not support)
- Very long input (>10,000 characters - rejected at sanitization)
```

### Use Cases

1. **Initial ticket filtering:** Determine if ticket should proceed to analysis
2. **Spam detection:** Identify non-support requests
3. **Quality control:** Route only legitimate tickets to support team
4. **Customer experience:** Quickly reject off-topic submissions

### Error Handling

| Status Code | Reason | Response |
|-------------|--------|----------|
| 200 | Success | RelevanceJudgeResponse |
| 400 | Invalid input | `{"detail": "Input exceeds maximum length of 10000 characters"}` |
| 429 | Rate limit exceeded | `{"error": "Too many requests", "message": "Rate limit exceeded. Please try again later.", "status": 429}` |
| 503 | AI service unavailable | `{"detail": "AI service unavailable: ..."}` |

### Performance Expectations

- **Avg Response Time:** 1-3 seconds
- **Success Rate:** >99%
- **Fallback Behavior:** If processing fails, returns `is_relevant=True, confidence=0.5` (err on side of processing)

### Example Request/Response Flow

**Request:**
```json
{
  "ticket": "I created an account but can't log in. It says my password is wrong, but I just set it."
}
```

**Processing:**
1. Validate input is string ✓
2. Check length < 10,000 chars ✓
3. Remove dangerous characters ✓
4. Check for suspicious patterns ✓
5. Send to Mistral 7B with relevance prompt
6. Model thinks: "This is a legitimate account access issue"
7. Extract JSON response
8. Return response

**Response:**
```json
{
  "is_relevant": true,
  "confidence": 0.92,
  "feedback": "This is a genuine account management issue requiring support assistance."
}
```

---

## 4. Analyze Ticket Endpoint

### Overview
Performs deep analysis of a support ticket to extract:
- **Category:** Type of issue (Technical, Billing, Feature Request, etc.)
- **Urgency:** Priority level (Low, Medium, High)
- **Sentiment:** Customer emotion (Positive, Neutral, Negative)

**Purpose:** Categorize and prioritize tickets for routing  
**Model Used:** Mistral 7B  
**Task Type:** `analyze`  
**Token Limit:** 150 tokens

### Request Details

| Property | Value |
|----------|-------|
| **Method** | POST |
| **Endpoint** | `/api/analyze` |
| **Rate Limit** | 15 requests/minute |
| **Authentication** | Not required |
| **Request Model** | `TicketRequest` |
| **Response Model** | `TicketAnalysis` |
| **Content-Type** | application/json |

### Request Model

```python
class TicketRequest(BaseModel):
    ticket: str = Field(..., min_length=1)
```

### Response Model

```python
class TicketAnalysis(BaseModel):
    category: CategoryEnum
    urgency: UrgencyEnum
    sentiment: SentimentEnum
```

### Enums

**CategoryEnum** (14 options):
```python
TECHNICAL_ISSUE = "Technical Issue"
BILLING_INQUIRY = "Billing Inquiry"
FEATURE_REQUEST = "Feature Request"
GENERAL_QUESTION = "General Question"
ACCOUNT_MANAGEMENT = "Account Management"
BUG_REPORT = "Bug Report"
COMPLAINT_ESCALATION = "Complaint/Escalation"
SECURITY_PRIVACY = "Security/Privacy"
REFUND_REQUEST = "Refund Request"
INTEGRATION_ISSUE = "Integration Issue"
PERFORMANCE_ISSUE = "Performance Issue"
DOCUMENTATION_API = "Documentation/API Question"
DATA_REQUEST = "Data Request"
SERVICE_STATUS = "Service Status"
```

**UrgencyEnum** (3 options):
```python
LOW = "Low"
MEDIUM = "Medium"
HIGH = "High"
```

**SentimentEnum** (3 options):
```python
POSITIVE = "Positive"
NEUTRAL = "Neutral"
NEGATIVE = "Negative"
```

### Request Example

```bash
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "ticket": "We''ve been using your service for 6 months and love it, but I think adding dark mode would be great for late-night work."
  }'
```

### Response Example

```json
{
  "category": "Feature Request",
  "urgency": "Low",
  "sentiment": "Positive"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `category` | String (Enum) | Type of issue (see CategoryEnum above) |
| `urgency` | String (Enum) | Priority: Low, Medium, or High |
| `sentiment` | String (Enum) | Customer emotion: Positive, Neutral, or Negative |

### Processing Flow

```
Input: Ticket text
  ↓
Sanitization: Type, length, injection checks
  ↓
LLM Processing: Mistral 7B analyzes ticket
  ↓
JSON Extraction: Parse {category, urgency, sentiment}
  ↓
Validation: Ensure valid enum values
  ↓
Cleanup: If multiple categories, take first one
  ↓
Output: TicketAnalysis
```

### Analysis Examples

**Example 1: Technical Issue - High Urgency**
```
Input: "The app is completely down. No one can access it. This is critical!"
Output: {
  "category": "Technical Issue",
  "urgency": "High",
  "sentiment": "Negative"
}
```

**Example 2: Billing Inquiry - Medium Urgency**
```
Input: "I was charged twice for the premium plan. Can you please investigate?"
Output: {
  "category": "Billing Inquiry",
  "urgency": "Medium",
  "sentiment": "Neutral"
}
```

**Example 3: Feature Request - Low Urgency**
```
Input: "Love your product! It would be even better with mobile app support though."
Output: {
  "category": "Feature Request",
  "urgency": "Low",
  "sentiment": "Positive"
}
```

### Category Selection Logic

| Category | When to Select |
|----------|---|
| Technical Issue | App crashes, errors, bugs, performance issues |
| Billing Inquiry | Payment, invoice, charge questions |
| Feature Request | Enhancement, new feature suggestions |
| General Question | How-tos, general information requests |
| Account Management | Password reset, profile updates, account settings |
| Bug Report | Specific reproducible bug description |
| Complaint/Escalation | Dissatisfaction, escalation request |
| Security/Privacy | Data breach, privacy concerns, security issues |
| Refund Request | Money back request |
| Integration Issue | Third-party integration problems |
| Performance Issue | Slow app, latency, lag |
| Documentation/API Question | API docs, guides, tutorials |
| Data Request | Export data, data access request |
| Service Status | System down, outage, maintenance |

### Use Cases

1. **Ticket routing:** Route to appropriate team based on category
2. **Priority management:** Handle high-urgency tickets first
3. **SLA tracking:** Meet response time SLAs by urgency
4. **Sentiment analysis:** Identify upset customers for proactive follow-up
5. **Reporting:** Track issue distribution and trends

### Error Handling

| Status Code | Reason | Response |
|-------------|--------|----------|
| 200 | Success | TicketAnalysis |
| 400 | Invalid input | `{"detail": "Input validation error"}` |
| 429 | Rate limit exceeded | Rate limit response |
| 500 | Analysis failed | `{"detail": "AI failed to generate a valid analysis."}` |
| 503 | Service unavailable | `{"detail": "AI service unavailable: ..."}` |

### Performance Expectations

- **Avg Response Time:** 1-3 seconds
- **Success Rate:** >95%
- **Accuracy:** ~85-90% (some tickets are ambiguous)

---

## 5. Get Guidance Endpoint

### Overview
Generates actionable guidance or troubleshooting steps based on the ticket analysis.

- **High Urgency:** Provides immediate troubleshooting steps
- **Low/Medium Urgency:** Provides detailed self-service guidance

**Purpose:** Give customers/support team next steps to resolve  
**Model Used:** Qwen 3.6B  
**Task Type:** `guidance`  
**Token Limit:** 300 tokens

### Request Details

| Property | Value |
|----------|-------|
| **Method** | POST |
| **Endpoint** | `/api/guidance` |
| **Rate Limit** | 15 requests/minute |
| **Authentication** | Not required |
| **Request Model** | `GuidanceRequest` |
| **Response Model** | JSON object |
| **Content-Type** | application/json |

### Request Model

```python
class GuidanceRequest(BaseModel):
    ticket: str
    analysis: TicketAnalysis  # From /api/analyze endpoint
```

### Request Example

```bash
curl -X POST http://localhost:8000/api/guidance \
  -H "Content-Type: application/json" \
  -d '{
    "ticket": "My app keeps crashing when uploading files.",
    "analysis": {
      "category": "Technical Issue",
      "urgency": "High",
      "sentiment": "Negative"
    }
  }'
```

### Response Example

**High Urgency Response:**
```json
{
  "guidance": "1. Restart the app and clear cache (Settings > Storage > Clear Cache)\n2. Check file size - ensure it''s less than 100MB\n3. Update to latest version\n4. Try on WiFi instead of mobile data\n5. If persists, contact support with error logs"
}
```

**Low/Medium Urgency Response:**
```json
{
  "guidance": "For dark mode on your account, check Settings > Preferences > Theme. If not visible, we''re rolling this feature out gradually. Here are helpful resources: [Knowledge Base: Theme Preferences] [FAQ: Dark Mode] You can also request early access in Settings > Feature Requests."
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `guidance` | String | Actionable steps, troubleshooting, or self-service guidance |

### Processing Logic

```
Input: Ticket + Analysis
  ↓
Check Urgency Level:
  ├─ HIGH → Generate troubleshooting steps (immediate actions)
  └─ LOW/MEDIUM → Generate self-service guidance (knowledge base)
  ↓
LLM Processing: Qwen 3.6B generates guidance
  ↓
Text Extraction: Extract text from response
  ↓
Output: Guidance string
```

### Guidance Types

**High Urgency (Troubleshooting Steps):**
- Immediate actionable steps
- Concise, no fluff
- Technical instructions
- Example: "1. Restart... 2. Check... 3. Try..."

**Low/Medium Urgency (Self-Service Guidance):**
- Detailed explanations
- Knowledge base references
- Article suggestions
- Contact information

### Examples

**High Urgency Example:**
```
Ticket: "The app won't start. Just keeps crashing."
Urgency: High
Guidance:
1. Force stop the app (Settings > Apps > Your App > Force Stop)
2. Clear app data (Settings > Apps > Your App > Storage > Clear Data)
3. Restart your device
4. Reinstall the app
5. If still failing, check device storage (needs 500MB free)
```

**Low Urgency Example:**
```
Ticket: "Can I get an invoice for my purchase?"
Urgency: Low
Guidance:
Self-Service: Visit your account dashboard > Billing > Invoices
Download all invoices as PDF. Invoices are available for all past 3 years.
Related Articles:
- How to download receipts
- Tax documentation help
- Billing FAQ
Need help? Contact billing@support.com
```

### Use Cases

1. **Customer self-service:** Reduce support tickets with self-service guidance
2. **Support escalation:** Give support team immediate troubleshooting steps
3. **Knowledge base:** Link to relevant documentation
4. **Incident response:** Quick resolution for high-urgency issues
5. **Customer education:** Help users understand features

### Error Handling

| Status Code | Reason |
|-------------|--------|
| 200 | Success |
| 400 | Invalid input |
| 429 | Rate limit exceeded |
| 500 | Failed to generate guidance |
| 503 | AI service unavailable |

### Performance Expectations

- **Avg Response Time:** 2-5 seconds
- **Success Rate:** >99%
- **Quality:** Professional, helpful guidance

---

## 6. Generate Email Endpoint

### Overview
Generates a professional, empathetic customer response email based on:
- Original ticket
- Ticket analysis (category, urgency, sentiment)
- Guidance provided

**Purpose:** Automate professional customer responses  
**Model Used:** Qwen 3.6B  
**Task Type:** `email`  
**Token Limit:** 400 tokens

### Request Details

| Property | Value |
|----------|-------|
| **Method** | POST |
| **Endpoint** | `/api/email` |
| **Rate Limit** | 15 requests/minute |
| **Authentication** | Not required |
| **Request Model** | `EmailRequest` |
| **Response Model** | JSON object |
| **Content-Type** | application/json |

### Request Model

```python
class EmailRequest(BaseModel):
    ticket: str
    analysis: TicketAnalysis
    guidance: str  # Output from /api/guidance
```

### Request Example

```bash
curl -X POST http://localhost:8000/api/email \
  -H "Content-Type: application/json" \
  -d '{
    "ticket": "I''ve been trying to reset my password for hours but the link expired.",
    "analysis": {
      "category": "Account Management",
      "urgency": "Medium",
      "sentiment": "Negative"
    },
    "guidance": "Password links expire after 1 hour for security. Visit /forgot-password to request a new link."
  }'
```

### Response Example

```json
{
  "finalEmail": "Subject: Password Reset Assistance - Account Management\n\nDear Customer,\n\nThank you for reaching out about your password reset issue. We understand how frustrating it is when password links expire.\n\nHere''s how to resolve this:\n\nPassword reset links are intentionally designed to expire after 1 hour for your account security. If your link expired, simply visit our Password Reset page and request a new link. The process takes less than 2 minutes.\n\nSteps:\n1. Go to [Your App] > Forgot Password\n2. Enter your email address\n3. Check your email for a new reset link (valid for 1 hour)\n4. Click the link and set a new password\n\nIf you continue experiencing issues, our support team is here to help. Reply to this email or contact us at support@yourdomain.com.\n\nWe appreciate your patience,\nCustomer Support Team"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `finalEmail` | String | Complete customer response email ready to send |

### Email Generation Process

```
Input: Ticket + Analysis + Guidance
  ↓
Context Building:
  ├─ Tone: Professional, empathetic
  ├─ Content: Address customer emotion (sentiment)
  ├─ Urgency: Prioritize high-urgency issues
  └─ Category: Specific guidance by issue type
  ↓
LLM Processing: Qwen generates response email
  ↓
Text Extraction: Extract email text
  ↓
Output: Complete email ready to send
```

### Email Characteristics

**Tone & Style:**
- Professional yet friendly
- Empathetic to customer frustration
- Clear and concise
- Action-oriented

**Structure:**
1. **Subject:** Auto-generated from ticket topic
2. **Greeting:** Formal salutation
3. **Acknowledgment:** Recognize customer's issue
4. **Solution:** Provide clear steps
5. **Next Steps:** What to do if issue persists
6. **Closing:** Professional sign-off

### Sentiment-Aware Responses

**Negative Sentiment:**
- More empathetic opening
- Extra validation ("We understand...")
- Clear escalation path
- Apology if appropriate

**Neutral Sentiment:**
- Professional, straightforward
- Focus on solution
- Helpful tone

**Positive Sentiment:**
- Friendly tone
- Appreciation for patience
- Offer additional help

### Examples

**Example 1: Technical Issue Response**
```
Subject: Your App Crash Issue - Technical Support

Dear [Customer],

Thank you for reporting the app crash issue. We understand how frustrating technical problems can be.

We've identified that crashes occur with files larger than 100MB due to memory limitations.

Quick Fix:
1. Update to version 3.2+ (released today)
2. Split large files into smaller chunks (<100MB each)
3. Clear app cache in Settings > Storage

Your device will then handle files up to 500MB.

If the issue persists after updating, please:
- Reply with your device model and OS version
- Share the error log from Settings > Diagnostics

We're here to help!

Best regards,
Support Team
```

**Example 2: Billing Issue Response**
```
Subject: Billing Inquiry - Account Charges

Hello [Customer],

Thank you for contacting us about the duplicate charge. We take billing issues seriously.

Investigation & Resolution:
Your account shows two charges on [date]. This was due to a system glitch (now fixed).

Action Taken:
✓ Identified duplicate charge of $50
✓ Issued refund (processing in 3-5 business days)
✓ Applied $10 service credit to your account

Check Your Account:
1. Login to [Your App]
2. Go to Billing > Transaction History
3. Verify refund appears as "Pending"

Questions? Reply here or call billing support at [phone].

Thank you for your patience!

Customer Support
```

### Use Cases

1. **Automated responses:** Send immediate customer confirmation
2. **Support efficiency:** Support team edits pre-generated email
3. **Consistency:** Maintain professional tone across all responses
4. **Speed:** Generate responses in seconds, not minutes
5. **Quality:** AI-crafted professional content

### Customization Options

Customers can:
- Copy email and edit before sending
- Use as template/draft
- Accept as-is and send directly
- Mark for human review if needed

### Error Handling

| Status Code | Reason |
|-------------|--------|
| 200 | Success |
| 400 | Invalid input |
| 429 | Rate limit exceeded |
| 500 | Failed to generate email |
| 503 | AI service unavailable |

### Performance Expectations

- **Avg Response Time:** 3-5 seconds
- **Success Rate:** >99%
- **Quality:** Professional, polished email ready for customer

---

## 7. Judge Analysis Endpoint

### Overview
Validates the accuracy of the ticket analysis (category, urgency, sentiment) using a more powerful model.

**Purpose:** Quality control - ensure analysis is correct  
**Model Used:** GPT-OSS 120B (via Groq)  
**Task Type:** `judge_analysis`  
**Token Limit:** 200 tokens

### Request Details

| Property | Value |
|----------|-------|
| **Method** | POST |
| **Endpoint** | `/api/judge-analysis` |
| **Rate Limit** | 10 requests/minute |
| **Authentication** | Not required |
| **Request Model** | `AnalysisJudgeRequest` |
| **Response Model** | `AnalysisJudgeResponse` |
| **Content-Type** | application/json |

### Request Model

```python
class AnalysisJudgeRequest(BaseModel):
    ticket: str
    analysis: TicketAnalysis  # Analysis to validate
```

### Response Model

```python
class AnalysisJudgeResponse(BaseModel):
    is_correct: bool
    confidence: float
    feedback: str
```

### Request Example

```bash
curl -X POST http://localhost:8000/api/judge-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "ticket": "I need to update my billing address for the invoice.",
    "analysis": {
      "category": "Account Management",
      "urgency": "Low",
      "sentiment": "Neutral"
    }
  }'
```

### Response Example

```json
{
  "is_correct": true,
  "confidence": 0.94,
  "feedback": "Correct analysis. This is clearly an account management task with low urgency and neutral sentiment."
}
```

### Incorrect Analysis Example

```json
{
  "is_correct": false,
  "confidence": 0.88,
  "feedback": "The category should be 'Billing Inquiry' not 'Account Management', though urgency and sentiment are correct."
}
```

### Response Fields

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| `is_correct` | Boolean | true/false | Whether analysis is accurate |
| `confidence` | Float | 0.0-1.0 | Confidence in judgment |
| `feedback` | String | - | Explanation of judgment |

### Processing Flow

```
Input: Ticket + Analysis to judge
  ↓
Sanitization: Validate inputs
  ↓
LLM Validation: GPT-OSS 120B reviews analysis
  ↓
Judgment: Is analysis correct?
  ↓
Confidence Score: How confident in judgment
  ↓
Output: Validation result
```

### Quality Control Logic

The judge verifies:
1. **Category Accuracy:** Is the category appropriate for this ticket?
2. **Urgency Assessment:** Is urgency level justified?
3. **Sentiment Detection:** Is customer sentiment correctly identified?
4. **Consistency:** Do all three align logically?

### Validation Examples

**Correct Analysis:**
```
Ticket: "Your new features are amazing! Keep up the great work!"
Analysis: { Category: FEATURE_REQUEST, Urgency: LOW, Sentiment: POSITIVE }
Judge: ✓ Correct (clearly positive feedback, low urgency)
```

**Incorrect Analysis:**
```
Ticket: "The app crashes every time I try to login. This is critical!"
Analysis: { Category: GENERAL_QUESTION, Urgency: LOW, Sentiment: NEUTRAL }
Judge: ✗ Incorrect (should be TECHNICAL_ISSUE, HIGH urgency, NEGATIVE sentiment)
```

### Use Cases

1. **Quality assurance:** Verify analysis accuracy before using it
2. **Model improvement:** Train on rejected analyses
3. **Escalation:** Flag incorrect analyses for manual review
4. **Feedback loop:** Improve analysis model over time
5. **Confidence scoring:** Only use high-confidence analyses automatically

### Confidence Interpretation

| Confidence | Interpretation |
|-------------|---|
| 0.9-1.0 | Very confident - use analysis |
| 0.75-0.89 | Confident - generally safe |
| 0.5-0.74 | Moderate - review recommended |
| <0.5 | Low confidence - manual review |

### Error Handling

| Status Code | Reason |
|-------------|--------|
| 200 | Success |
| 400 | Invalid input |
| 429 | Rate limit exceeded |
| 500 | Validation failed |
| 503 | AI service unavailable |

### Performance Expectations

- **Avg Response Time:** 2-4 seconds
- **Success Rate:** >98%
- **Accuracy:** ~88-92%

---

## 8. Judge Response Endpoint

### Overview
Final quality check for the complete ticket response including:
- Ticket analysis (category, urgency, sentiment)
- Guidance provided
- Generated email
- Overall quality, correctness, and relevance

**Purpose:** Final QA before sending response to customer  
**Model Used:** GPT-OSS 120B (via Groq)  
**Task Type:** `judge`  
**Token Limit:** 350 tokens

### Request Details

| Property | Value |
|----------|-------|
| **Method** | POST |
| **Endpoint** | `/api/judge` |
| **Rate Limit** | 10 requests/minute |
| **Authentication** | Not required |
| **Request Model** | `JudgeRequest` |
| **Response Model** | `JudgeResponse` |
| **Content-Type** | application/json |

### Request Model

```python
class JudgeRequest(BaseModel):
    ticket: str
    analysis: TicketAnalysis
    guidance: str
    finalEmail: str
```

### Response Model

```python
class JudgeResponse(BaseModel):
    quality_score: int           # 1-10
    correctness_score: int       # 1-10
    relevance_score: int         # 1-10
    overall_score: int           # Average of above
    feedback: str                # Explanation
    is_approved: bool            # Overall score >= 7
```

### Request Example

```bash
curl -X POST http://localhost:8000/api/judge \
  -H "Content-Type: application/json" \
  -d '{
    "ticket": "I can''t log in with my credentials.",
    "analysis": {
      "category": "Account Management",
      "urgency": "High",
      "sentiment": "Negative"
    },
    "guidance": "Try resetting your password. Visit /forgot-password...",
    "finalEmail": "Subject: Account Login Help..."
  }'
```

### Response Example

**Approved Response:**
```json
{
  "quality_score": 9,
  "correctness_score": 8,
  "relevance_score": 9,
  "overall_score": 8,
  "feedback": "Excellent response. Addresses the issue directly, appropriate tone for frustrated customer, clear next steps provided.",
  "is_approved": true
}
```

**Needs Improvement:**
```json
{
  "quality_score": 6,
  "correctness_score": 7,
  "relevance_score": 5,
  "overall_score": 6,
  "feedback": "Email lacks clear action items. Customer needs specific steps to resolve login issue.",
  "is_approved": false
}
```

### Response Fields

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| `quality_score` | Integer | 1-10 | Email quality, tone, professionalism |
| `correctness_score` | Integer | 1-10 | Category and urgency correct? |
| `relevance_score` | Integer | 1-10 | Does response address the issue? |
| `overall_score` | Integer | 1-10 | Average of three scores |
| `feedback` | String | - | Detailed explanation of scoring |
| `is_approved` | Boolean | true/false | Ready to send? (true if overall >= 7) |

### Scoring Criteria

**Quality Score (1-10):**
- **9-10:** Professional, empathetic, well-structured
- **7-8:** Good quality, minor improvements possible
- **5-6:** Adequate but needs polish
- **1-4:** Poor quality, needs rewrite

**Correctness Score (1-10):**
- **9-10:** Category and urgency perfectly identified
- **7-8:** Mostly correct, minor issues
- **5-6:** Some misidentifications
- **1-4:** Fundamentally incorrect

**Relevance Score (1-10):**
- **9-10:** Fully addresses customer's issue
- **7-8:** Addresses most concerns
- **5-6:** Partially relevant
- **1-4:** Doesn't address issue

### Processing Flow

```
Input: Complete ticket response
  ↓
Evaluation:
  ├─ Quality: Is email professional and well-written?
  ├─ Correctness: Are analysis and guidance correct?
  ├─ Relevance: Does it solve the customer's issue?
  ├─ Tone: Appropriate for sentiment?
  └─ Completeness: Covers all necessary points?
  ↓
Scoring: Rate each dimension 1-10
  ↓
Overall: Calculate average score
  ↓
Approval: Overall >= 7?
  ↓
Output: JudgeResponse with feedback
```

### Approval Logic

```
Overall Score Calculation:
overall_score = round((quality + correctness + relevance) / 3)

Approval:
is_approved = (overall_score >= 7)

Interpretation:
8-10: Ready to send immediately
7: Acceptable (minor improvements possible)
6: Needs review (consider revision)
<6: Not approved (rewrite recommended)
```

### Examples

**High Quality Response (Approved):**
```
Ticket: "I was charged twice"
Analysis: Billing Inquiry, High, Negative
Guidance: "We found duplicate charge, issuing refund..."
Email: Professional, addresses issue directly, explains solution
Scores: Quality=9, Correctness=9, Relevance=9, Overall=9 ✅ APPROVED
```

**Low Quality Response (Not Approved):**
```
Ticket: "My password isn't working"
Analysis: Account Management, Medium, Neutral
Guidance: "Try resetting password"
Email: Vague, doesn't explain steps, poor structure
Scores: Quality=4, Correctness=6, Relevance=3, Overall=4 ❌ NOT APPROVED
```

### Use Cases

1. **Quality assurance:** Ensure responses meet quality standards
2. **Automation decision:** Auto-send if approved, route for review if not
3. **Training data:** Use rejected responses to improve models
4. **Customer satisfaction:** Higher quality = happier customers
5. **Performance tracking:** Monitor average scores over time

### Feedback Examples

**Approved with notes:**
```
"Good response. The guidance is clear and actionable. Tone appropriately matches the customer's negative sentiment. Consider adding a timeline for refund processing in future responses."
```

**Not approved:**
```
"The email doesn't address the customer's specific error. Include troubleshooting steps and provide a phone number for escalation given the high urgency."
```

### Error Handling

| Status Code | Reason |
|-------------|--------|
| 200 | Success |
| 400 | Invalid input |
| 429 | Rate limit exceeded |
| 500 | Evaluation failed |
| 503 | AI service unavailable |

### Performance Expectations

- **Avg Response Time:** 3-5 seconds
- **Success Rate:** >99%
- **Approval Rate:** Typically 60-80% on first attempt

---

## ⚠️ Error Handling

### Common Error Codes

| Code | Meaning | Reason | Solution |
|------|---------|--------|----------|
| 200 | OK | Success | - |
| 400 | Bad Request | Invalid input | Check request format, field types |
| 429 | Too Many Requests | Rate limit hit | Wait and retry (see rate limits) |
| 500 | Internal Server Error | Server error | Retry, contact support if persists |
| 503 | Service Unavailable | AI service down | Retry later |

### Error Response Format

```json
{
  "detail": "Error message explaining what went wrong"
}
```

### Common Issues & Solutions

**Issue: "Input exceeds maximum length"**
- Solution: Ticket is >10,000 characters, split into smaller tickets

**Issue: "Rate limit exceeded"**
- Solution: Wait 1 minute, then retry

**Issue: "AI service unavailable"**
- Solution: Retry in 30 seconds, AI service is temporarily down

**Issue: "Invalid category in response"**
- Solution: Check valid categories in CategoryEnum above

---

## 🚦 Rate Limiting

### Rate Limits by Endpoint

| Endpoint | Limit | Why |
|----------|-------|-----|
| `/api/judge-relevance` | 20/min | Light validation |
| `/api/analyze` | 15/min | Medium computation |
| `/api/guidance` | 15/min | Medium computation |
| `/api/email` | 15/min | Medium computation |
| `/api/judge-analysis` | 10/min | Heavy computation |
| `/api/judge` | 10/min | Heavy computation |
| `/` | Unlimited | Health check |
| `/api/models` | Unlimited | Configuration |

### Rate Limit Headers

```
Rate-Limit-Limit: 15
Rate-Limit-Remaining: 14
Rate-Limit-Reset: 1685042340
```

### Rate Limit Behavior

```
Within Limit: ✅ 200 OK
At Limit: ❌ 429 Too Many Requests

Wait & Retry:
429 response includes Retry-After header
Wait that duration and retry request
```

### Testing Rate Limits

```bash
# Send 20 requests in sequence
for i in {1..20}; do
  curl -i -X POST http://localhost:8000/api/analyze \
    -H "Content-Type: application/json" \
    -d '{"ticket": "test"}'
  echo "Request $i"
done

# Results:
# Requests 1-15: 200 OK
# Requests 16-20: 429 Too Many Requests
```

---

## 📊 API Response Times

### Expected Performance

| Endpoint | Avg Time | Range |
|----------|----------|-------|
| `/` | <100ms | <100-200ms |
| `/api/models` | <100ms | <100-200ms |
| `/api/judge-relevance` | 1-3s | 1-5s |
| `/api/analyze` | 1-3s | 1-5s |
| `/api/guidance` | 2-5s | 2-10s |
| `/api/email` | 3-5s | 3-10s |
| `/api/judge-analysis` | 2-4s | 2-8s |
| `/api/judge` | 3-5s | 3-10s |

### Performance Tips

- Batch requests when possible (but respect rate limits)
- Implement timeout: 15 seconds for most endpoints
- Cache results if analyzing same ticket multiple times
- Use async/await for parallel requests

---

## 🔐 Security Features

All endpoints include:
- ✅ Input validation & sanitization
- ✅ Prompt injection prevention
- ✅ Rate limiting
- ✅ CORS protection
- ✅ Error logging

---

## 📚 Complete Workflow Example

```
1. Receive support ticket from customer
   Input: "My app keeps crashing"

2. Judge Relevance
   POST /api/judge-relevance
   Response: is_relevant=true, confidence=0.95

3. Analyze Ticket
   POST /api/analyze
   Response: {category: "Technical Issue", urgency: "High", sentiment: "Negative"}

4. Get Guidance
   POST /api/guidance
   Response: {guidance: "1. Clear cache... 2. Update app..."}

5. Generate Email
   POST /api/email
   Response: {finalEmail: "Dear customer, we understand..."}

6. Judge Analysis
   POST /api/judge-analysis
   Response: {is_correct: true, confidence: 0.92}

7. Judge Response
   POST /api/judge
   Response: {overall_score: 8, is_approved: true}

8. Send Email to Customer
   Email sent successfully ✓
```

---

**API Documentation Complete**

For more information, see code comments in `application/backend/main.py`

