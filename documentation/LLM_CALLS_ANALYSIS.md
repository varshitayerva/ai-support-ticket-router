# LLM Calls Analysis - AI Support Ticket Router

**Complete breakdown of all LLM (Large Language Model) API calls in the application**

---

## 📊 Summary Table

| # | Endpoint | Purpose | Function | Input | Output | max_tokens | When Called |
|---|----------|---------|----------|-------|--------|-----------|------------|
| 1 | `/api/judge-relevance` | Validate if ticket is a support issue | `get_relevance_judge_prompt()` | Ticket text | JSON: {is_relevant, confidence, feedback} | 200 | Before analyzing |
| 2 | `/api/analyze` | Extract category, urgency, sentiment | `get_analysis_prompt()` | Ticket text | JSON: {category, urgency, sentiment} | 100 | After relevance check |
| 3 | `/api/judge-analysis` | Validate if analysis is correct | `get_analysis_judge_prompt()` | Ticket + Analysis | JSON: {is_correct, confidence, feedback} | 200 | Before generating guidance |
| 4a | `/api/guidance` (High) | Generate troubleshooting steps | `get_troubleshooting_prompt()` | Ticket text | Plain text: Steps | 300 | When urgency=HIGH |
| 4b | `/api/guidance` (Low/Med) | Generate self-service guidance | `get_self_service_prompt()` | Ticket text | Plain text: Guidance | 300 | When urgency=LOW/MEDIUM |
| 5 | `/api/email` | Draft professional customer email | `get_email_prompt()` | Ticket + Analysis + Guidance | Plain text: Email draft | 400 | After guidance generated |
| 6 | `/api/judge` | Evaluate response quality | `get_judge_prompt()` | Ticket + Analysis + Guidance + Email | JSON: {scores, feedback, is_approved} | 300 | After email generated |

---

## 🔄 LLM Call Flow Diagram

```
User Submits Ticket
    ↓
┌─────────────────────────────────────────────────────────────┐
│ CALL 1: /api/judge-relevance                                │
│ Purpose: "Is this a support issue?"                          │
│ Input: Ticket text only                                      │
│ Output: {is_relevant: bool, confidence: float, feedback: str}│
│ Decision: If NOT relevant → STOP & Show Error               │
└─────────────────────────────────────────────────────────────┘
    ↓ (if relevant)
┌─────────────────────────────────────────────────────────────┐
│ CALL 2: /api/analyze                                         │
│ Purpose: "What is the category, urgency, sentiment?"        │
│ Input: Ticket text only                                      │
│ Output: {category, urgency, sentiment}                       │
│ Used For: Display on results page                            │
└─────────────────────────────────────────────────────────────┘
    ↓ (user clicks "Generate Guidance")
┌─────────────────────────────────────────────────────────────┐
│ CALL 3: /api/judge-analysis                                 │
│ Purpose: "Is the analysis correct?"                          │
│ Input: Ticket + Initial Analysis                            │
│ Output: {is_correct: bool, confidence: float, feedback: str}│
│ Decision: If NOT correct → STOP & Show Error               │
└─────────────────────────────────────────────────────────────┘
    ↓ (if analysis is correct)
┌─────────────────────────────────────────────────────────────┐
│ CALL 4: /api/guidance                                        │
│ Purpose: "Generate helpful guidance"                         │
│ Input: Ticket + Analysis (urgency determines prompt)        │
│ Logic:                                                       │
│   if urgency == "High":                                      │
│     → Call with "troubleshooting steps" prompt              │
│   else:                                                      │
│     → Call with "self-service guidance" prompt              │
│ Output: Plain text guidance/steps                            │
│ Display: Show on results page                               │
└─────────────────────────────────────────────────────────────┘
    ↓ (user clicks "Generate Email")
┌─────────────────────────────────────────────────────────────┐
│ CALL 5: /api/email                                           │
│ Purpose: "Draft a professional customer response"           │
│ Input: Ticket + Analysis + Guidance                         │
│ Output: Plain text email draft                               │
│ Display: Show on results page                               │
└─────────────────────────────────────────────────────────────┘
    ↓ (user clicks "Judge Quality")
┌─────────────────────────────────────────────────────────────┐
│ CALL 6: /api/judge                                           │
│ Purpose: "Evaluate response quality"                         │
│ Input: Ticket + Analysis + Guidance + Email                │
│ Output: {quality_score, correctness_score, relevance_score, │
│          overall_score, feedback, is_approved}              │
│ Display: Show scoring breakdown                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Detailed LLM Call Breakdown

### CALL 1: Judge Relevance
**Endpoint:** `POST /api/judge-relevance`  
**Purpose:** Filter out non-support tickets early  
**Function:** `get_relevance_judge_prompt(ticket: str)`

**When It's Called:**
- First step in HomePage.jsx after user submits form
- Guards against spam, off-topic questions, etc.

**Input:**
```
Ticket: "My app keeps crashing when I tap the login button"
```

**Prompt Sent to LLM:**
```
You are a support ticket relevance validator. Determine if this is a genuine 
support issue for a software/service platform.

CUSTOMER TICKET:
My app keeps crashing when I tap the login button

VALID SUPPORT ISSUES include:
- Software bugs, crashes, errors
- Feature requests for the application
- Account and login issues
- Payment/billing problems
- API integration questions
- Performance or technical problems
- Service status/outage reports
- Data access/export requests
- Security or privacy concerns
- Documentation/help questions

INVALID/IRRELEVANT ISSUES include:
- Personal/life problems unrelated to the service
- Lost personal items (pen, wallet, keys, etc.)
- General life advice
- Questions about unrelated topics
- Spam or promotional content
- Completely off-topic messages

Determine if this ticket is relevant to a support system.

Return ONLY this JSON format:
{"is_relevant": true, "confidence": 0.95, "feedback": "This is a relevant support issue."}

If NOT relevant, explain why in feedback. Be direct and clear.
```

**Expected Output:**
```json
{
    "is_relevant": true,
    "confidence": 0.95,
    "feedback": "This is a genuine technical support issue about app crashes."
}
```

**Parameters:**
- **max_tokens:** 200
- **Model:** meta-llama/Llama-3.1-8B-Instruct

**Decision Logic:**
```python
if !response.data.is_relevant:
    Show error: "❌ Not a Support Issue: {feedback}"
    Stop process
else:
    Continue to CALL 2 (Analyze)
```

---

### CALL 2: Analyze Ticket
**Endpoint:** `POST /api/analyze`  
**Purpose:** Categorize ticket and assess urgency/sentiment  
**Function:** `get_analysis_prompt(ticket: str)`

**When It's Called:**
- Second step in HomePage.jsx
- Only if relevance check passed

**Input:**
```
Ticket: "My app keeps crashing when I tap the login button"
```

**Prompt Sent to LLM:**
```
Analyze the following support ticket and extract the category, urgency, and sentiment.
Provide the output ONLY in a valid JSON format with the keys "category", "urgency", and "sentiment".

Allowed categories: [
  "Technical Issue",          # App crashes, errors, bugs
  "Billing Inquiry",          # Payments, invoices, charges
  "Feature Request",          # Enhancement suggestions
  "General Question",         # How-tos, account info
  "Account Management",       # Password reset, profile updates
  "Bug Report",               # Specific software bug
  "Complaint/Escalation",     # Customer dissatisfaction
  "Security/Privacy",         # Data breach, privacy concerns
  "Refund Request",           # Money back requests
  "Integration Issue",        # Third-party integrations
  "Performance Issue",        # Slow app, latency
  "Documentation/API Question",  # API docs, guides
  "Data Request",             # Export data, access
  "Service Status"            # System down, outage
]
Allowed urgencies: ["Low", "Medium", "High"]
Allowed sentiments: ["Positive", "Neutral", "Negative"]

Ticket: "My app keeps crashing when I tap the login button"

JSON Output:
```

**Expected Output:**
```json
{
    "category": "Bug Report",
    "urgency": "High",
    "sentiment": "Negative"
}
```

**Parameters:**
- **max_tokens:** 100
- **Model:** meta-llama/Llama-3.1-8B-Instruct

**Output Processing:**
```python
# Extract JSON from response (LLM might include extra text)
json_start = response.find('{')
json_end = response.rfind('}')
json_string = response[json_start:json_end+1]
analysis = json.loads(json_string)

# Validate with Pydantic (ensures category/urgency/sentiment are valid)
validated_analysis = TicketAnalysis(**analysis)
```

**Display:**
- Shows on ResultsPage.jsx in "Initial Analysis" card
- Displays: Category, Urgency (with color coding), Sentiment

---

### CALL 3: Judge Analysis
**Endpoint:** `POST /api/judge-analysis`  
**Purpose:** Validate if the analysis is correct (3-level validation)  
**Function:** `get_analysis_judge_prompt(ticket: str, analysis: dict)`

**When It's Called:**
- When user clicks "Generate Guidance" button on ResultsPage.jsx
- Ensures the AI's initial analysis was accurate

**Input:**
```
Ticket: "My app keeps crashing when I tap the login button"
Analysis: {
    "category": "Bug Report",
    "urgency": "High",
    "sentiment": "Negative"
}
```

**Prompt Sent to LLM:**
```
You are an expert ticket classification validator. Analyze this ticket and verify 
if the provided analysis is correct.

CUSTOMER TICKET:
My app keeps crashing when I tap the login button

PROVIDED ANALYSIS:
- Category: Bug Report
- Urgency: High
- Sentiment: Negative

VALID CATEGORIES:
1. Technical Issue - App crashes, errors, bugs
2. Billing Inquiry - Payments, invoices, charges
3. Feature Request - Enhancement suggestions
4. General Question - How-tos, account info questions
5. Account Management - Password reset, profile updates, account access
6. Bug Report - Specific software bug reports
7. Complaint/Escalation - Customer dissatisfaction, escalations
8. Security/Privacy - Data breach, privacy concerns
9. Refund Request - Money back requests
10. Integration Issue - Third-party integrations
11. Performance Issue - Slow app, latency problems
12. Documentation/API Question - API docs, technical guides
13. Data Request - Export data, data access requests
14. Service Status - System down, outage reports

VALID URGENCIES: Low, Medium, High
VALID SENTIMENTS: Positive, Neutral, Negative

Validate:
1. Is the category correct? Choose from the 14 valid categories above.
2. Is the urgency level accurate?
3. Does the sentiment match the customer's tone?

Return ONLY this JSON format:
{"is_correct": true, "confidence": 0.95, "feedback": "Analysis is accurate."}

If analysis is incorrect, set is_correct to false and explain why in feedback. 
Suggest the correct category from the valid list.
```

**Expected Output:**
```json
{
    "is_correct": true,
    "confidence": 0.92,
    "feedback": "The ticket is correctly categorized as a Bug Report with High urgency and Negative sentiment."
}
```

**Parameters:**
- **max_tokens:** 200
- **Model:** meta-llama/Llama-3.1-8B-Instruct

**Decision Logic:**
```python
if !analysis_judge.is_correct:
    Show error: "Cannot generate guidance: {analysis_judge.feedback}"
    Stop process
else:
    Continue to CALL 4 (Guidance)
```

**Display:**
- Shows on ResultsPage.jsx in "Analysis Validation" card
- Displays: Confidence %, Status (Valid/Invalid), Validator Feedback
- Only shown if user clicks "Generate Guidance"

---

### CALL 4a: Generate Guidance (HIGH Urgency)
**Endpoint:** `POST /api/guidance`  
**Purpose:** Generate immediate troubleshooting steps for urgent issues  
**Function:** `get_troubleshooting_prompt(ticket: str)`

**When It's Called:**
- When user clicks "Generate Guidance" button
- Only if analysis.urgency == "High"

**Input:**
```
Ticket: "My app keeps crashing when I tap the login button"
Analysis.urgency: "High"
```

**Prompt Sent to LLM:**
```
A customer has a high-urgency issue. Provide immediate, actionable troubleshooting 
steps they can take right now. Be concise and clear. Do not add any conversational fluff.

Ticket: "My app keeps crashing when I tap the login button"

Troubleshooting Steps:
```

**Expected Output:**
```
1. Force close the app:
   - Go to Settings > Apps > [App Name] > Force Stop
   
2. Clear app cache:
   - Settings > Apps > [App Name] > Storage > Clear Cache
   
3. Restart your device
   
4. Reinstall the app:
   - Uninstall from Play Store
   - Restart device
   - Reinstall fresh version
   
5. Check device storage:
   - Ensure at least 500MB free space
   
If issue persists, contact support with device info and last error message.
```

**Parameters:**
- **max_tokens:** 300
- **Model:** meta-llama/Llama-3.1-8B-Instruct

**Key Characteristic:**
- Short, action-focused response (no fluff)
- Meant for immediate customer use
- Step-by-step format

**Display:**
- Shows on ResultsPage.jsx under "Troubleshooting Steps" card
- Button label changes based on urgency: "Generate Troubleshooting Steps"

---

### CALL 4b: Generate Guidance (LOW/MEDIUM Urgency)
**Endpoint:** `POST /api/guidance`  
**Purpose:** Generate self-service guidance with knowledge base links  
**Function:** `get_self_service_prompt(ticket: str)`

**When It's Called:**
- When user clicks "Generate Guidance" button
- Only if analysis.urgency == "Low" or "Medium"

**Input:**
```
Ticket: "How do I change my password?"
Analysis.urgency: "Medium"
```

**Prompt Sent to LLM:**
```
A customer has a low or medium urgency issue. Provide detailed self-service guidance 
and links to potential knowledge base articles they can use to solve their problem. 
Be helpful and empowering.

Ticket: "How do I change my password?"

Self-Service Guidance:
```

**Expected Output:**
```
You can change your password through your account settings:

1. Log in to your account
2. Click on "Settings" in the top-right corner
3. Select "Account" from the left menu
4. Click "Change Password"
5. Enter your current password and new password twice
6. Click "Save Changes"

For more details, check out our knowledge base articles:
- Article: "How to Reset Your Password" (link)
- Article: "Password Security Best Practices" (link)
- FAQ: "I forgot my password" (link)

If you continue to have trouble, our support team is here to help!
```

**Parameters:**
- **max_tokens:** 300
- **Model:** meta-llama/Llama-3.1-8B-Instruct

**Key Characteristics:**
- Longer, more detailed response
- Empowers customer to solve themselves
- Includes knowledge base article references
- Helpful tone

**Display:**
- Shows on ResultsPage.jsx under "Self-Service Guidance" card
- Button label changes based on urgency: "Generate Self-Service Guidance"

---

### CALL 5: Generate Email
**Endpoint:** `POST /api/email`  
**Purpose:** Draft professional customer response email  
**Function:** `get_email_prompt(ticket: str, analysis: dict, guidance: str)`

**When It's Called:**
- When user clicks "Generate Email" button
- Only if guidance was already generated

**Input:**
```
Ticket: "My app keeps crashing when I tap the login button"
Analysis: {
    "category": "Bug Report",
    "urgency": "High",
    "sentiment": "Negative"
}
Guidance: "1. Force close the app...\n2. Clear app cache..."
```

**Prompt Sent to LLM:**
```
Generate a professional and empathetic customer response email based on the provided 
information. Acknowledge the user's problem from the original ticket. Use the provided 
analysis and guidance to form the body of the email. The tone should match the urgency: 
reassuring for 'High' urgency, and empowering for 'Low'/'Medium'.

Original Ticket: "My app keeps crashing when I tap the login button"
Ticket Analysis: {"category": "Bug Report", "urgency": "High", "sentiment": "Negative"}
Generated Guidance: "1. Force close the app...\n2. Clear app cache..."

Customer Email:
```

**Expected Output:**
```
Subject: We're Here to Help - Your App Crash Issue

Dear Valued Customer,

Thank you for reaching out, and I sincerely apologize that you're experiencing 
crashes with our app when tapping the login button. I understand how frustrating 
this must be, and we're committed to helping you resolve this as quickly as possible.

Based on your report, this appears to be a critical bug that we take very seriously. 
I've outlined immediate troubleshooting steps that often resolve this issue:

1. Force close the app (Settings > Apps > [App] > Force Stop)
2. Clear the app cache (Settings > Apps > [App] > Storage > Clear Cache)
3. Restart your device
4. Reinstall the app fresh from the app store
5. Ensure you have at least 500MB of free storage

Please try these steps and let us know if the issue persists. If you continue to 
experience problems after these troubleshooting steps, please reply with:
- Your device type and OS version
- The exact error message (if any) you see when it crashes
- When this issue started

We're here to help and appreciate your patience as we work through this together.

Best regards,
Customer Support Team
```

**Parameters:**
- **max_tokens:** 400
- **Model:** meta-llama/Llama-3.1-8B-Instruct

**Tone Matching:**
```python
if analysis.urgency == "High":
    # Tone: Reassuring, professional, urgent response
    # Shows we understand the seriousness
else:  # "Low" or "Medium"
    # Tone: Empowering, helpful, guides to self-service
    # Encourages customer to solve themselves
```

**Display:**
- Shows on ResultsPage.jsx under "Suggested Customer Email" card
- Wrapped in `<pre>` tag to preserve formatting
- Ready for copy-paste to customer

---

### CALL 6: Judge Response Quality
**Endpoint:** `POST /api/judge`  
**Purpose:** Evaluate final response quality on multiple criteria  
**Function:** `get_judge_prompt(ticket: str, analysis: dict, guidance: str, email: str)`

**When It's Called:**
- When user clicks "Judge Response Quality" button
- Only if email was already generated

**Input:**
```
Ticket: "My app keeps crashing when I tap the login button"
Analysis: {
    "category": "Bug Report",
    "urgency": "High",
    "sentiment": "Negative"
}
Guidance: "1. Force close the app...\n2. Clear app cache..."
Email: "Subject: We're Here to Help...\n\nDear Valued Customer..."
```

**Prompt Sent to LLM:**
```
You are an expert support ticket quality judge. Evaluate the following ticket handling:

ORIGINAL TICKET:
My app keeps crashing when I tap the login button

ANALYSIS:
- Category: Bug Report
- Urgency: High
- Sentiment: Negative

GUIDANCE PROVIDED:
1. Force close the app...
2. Clear app cache...

CUSTOMER EMAIL:
Subject: We're Here to Help...

Dear Valued Customer...

Evaluate on the following criteria (1-10 scale):
1. QUALITY: Is the response professional, clear, and well-structured?
2. CORRECTNESS: Is the category and urgency assessment correct?
3. RELEVANCE: Does the response address the customer's issue?

Provide your evaluation in JSON format:
{
    "quality_score": <1-10>,
    "correctness_score": <1-10>,
    "relevance_score": <1-10>,
    "feedback": "Brief feedback on strengths and weaknesses",
    "is_approved": <true if overall score >= 7, false otherwise>
}

IMPORTANT: Return ONLY valid JSON, no additional text.
```

**Expected Output:**
```json
{
    "quality_score": 9,
    "correctness_score": 9,
    "relevance_score": 8,
    "feedback": "Excellent response. The email is professional, empathetic, and includes clear actionable steps. The category (Bug Report) and urgency (High) are correct. The email appropriately addresses the crash issue with relevant troubleshooting steps.",
    "is_approved": true
}
```

**Parameters:**
- **max_tokens:** 300
- **Model:** meta-llama/Llama-3.1-8B-Instruct

**Scoring Criteria:**
| Criterion | Measures |
|-----------|----------|
| **Quality (1-10)** | Professionalism, clarity, structure, grammar |
| **Correctness (1-10)** | Accurate category/urgency, valid assessment |
| **Relevance (1-10)** | Addresses customer's specific issue |
| **Overall** | Average of 3 scores, rounded |
| **is_approved** | true if overall ≥ 7 |

**Calculation:**
```python
overall_score = round(
    (quality_score + correctness_score + relevance_score) / 3
)
is_approved = overall_score >= 7
```

**Display:**
- Shows on ResultsPage.jsx under "Quality Judge Results" card
- Displays all 4 scores in a grid layout
- Green border for "Approved", Red border for "Needs Review"
- Shows detailed feedback from judge

---

## 📈 LLM Call Statistics

### Total Calls Possible in One Workflow:
```
Minimum: 2 calls
├─ Call 1: Judge Relevance
└─ Call 2: Analyze

Maximum: 6 calls
├─ Call 1: Judge Relevance
├─ Call 2: Analyze
├─ Call 3: Judge Analysis
├─ Call 4: Guidance (Troubleshooting or Self-Service)
├─ Call 5: Email
└─ Call 6: Judge Quality
```

### Call Tokens Breakdown:
```
Call 1 (Relevance):      200 tokens max
Call 2 (Analyze):        100 tokens max
Call 3 (Judge Analysis): 200 tokens max
Call 4 (Guidance):       300 tokens max
Call 5 (Email):          400 tokens max
Call 6 (Judge Quality):  300 tokens max
─────────────────────────────────────
Total (all 6):          1,500 tokens max
```

### Model Used:
```
All Calls: meta-llama/Llama-3.1-8B-Instruct
Provider: Hugging Face Router (OpenAI-compatible API)
API Base: https://router.huggingface.co/v1
Auth: HUGGING_FACE_API_KEY
```

---

## 🎯 Purpose of Each LLM Call

| Call # | Task Type | Why It's Needed | Outcome If Failed |
|--------|-----------|-----------------|-------------------|
| 1 | **Validation** | Filter spam/off-topic | User can't proceed (good - prevents noise) |
| 2 | **Analysis** | Categorize and assess | Error shown to user |
| 3 | **Quality Check** | Ensure analysis accuracy | User warned, can't generate guidance |
| 4 | **Generation** | Create helpful content | User can see the error |
| 5 | **Generation** | Create customer response | User can see the error |
| 6 | **Evaluation** | Quality assurance | User can see judge failed |

---

## 🔄 Decision Tree

```
Start: User Submits Ticket
    │
    ├─→ CALL 1: Judge Relevance
    │   ├─→ is_relevant = true  → Continue
    │   └─→ is_relevant = false → ❌ STOP (Show error)
    │
    ├─→ CALL 2: Analyze
    │   ├─→ Valid analysis → Show results page
    │   └─→ Invalid JSON → ❌ STOP (Server error)
    │
User clicks "Generate Guidance"
    │
    ├─→ CALL 3: Judge Analysis
    │   ├─→ is_correct = true  → Continue
    │   └─→ is_correct = false → ⚠️ Show warning (Can't generate)
    │
    ├─→ CALL 4: Generate Guidance
    │   ├─→ [if urgency = "High"] → Troubleshooting prompt
    │   ├─→ [if urgency = "Low/Medium"] → Self-service prompt
    │   └─→ Get guidance text → Show on page
    │
User clicks "Generate Email"
    │
    ├─→ CALL 5: Generate Email
    │   └─→ Get email draft → Show on page
    │
User clicks "Judge Quality"
    │
    └─→ CALL 6: Judge Response
        └─→ Get quality scores → Show judge results
```

---

## 💰 Cost Implications (Hugging Face Pricing)

Assuming average token usage:
```
Call 1: ~150 tokens × rate = Cost₁
Call 2: ~75 tokens × rate = Cost₂
Call 3: ~150 tokens × rate = Cost₃
Call 4: ~250 tokens × rate = Cost₄
Call 5: ~350 tokens × rate = Cost₅
Call 6: ~250 tokens × rate = Cost₆
─────────────────────────────
Total per workflow: ~1,225 tokens

Cost per 1000 tokens: Varies by provider
Estimated: $0.10-0.20 per complete workflow
```

---

## 🎓 Summary

The AI Support Ticket Router makes **up to 6 LLM API calls** per ticket:

1. **Relevance Check** - Guard against spam
2. **Analysis** - Categorize & assess
3. **Analysis Validation** - Ensure accuracy (3-level validation)
4. **Guidance** - Troubleshooting or self-service
5. **Email Draft** - Professional response
6. **Quality Judge** - Evaluate everything

Each call is **strategic** - they're not redundant; they serve specific purposes in the validation and generation pipeline. The system uses a **progressive disclosure** model where users can stop at any point or continue through all 6 calls.

