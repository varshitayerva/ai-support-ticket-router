# LLM Calls - Quick Reference Table

## All LLM API Calls at a Glance

```
┌────┬──────────────────┬──────────────────────────┬────────────────┬──────────────┬────────────┐
│ # │ ENDPOINT         │ PURPOSE                  │ INPUT          │ OUTPUT       │ max_tokens │
├────┼──────────────────┼──────────────────────────┼────────────────┼──────────────┼────────────┤
│ 1  │ judge-relevance  │ Is ticket a support      │ Ticket text    │ JSON:        │ 200        │
│    │                  │ issue? (Filter spam)     │                │ is_relevant  │            │
├────┼──────────────────┼──────────────────────────┼────────────────┼──────────────┼────────────┤
│ 2  │ analyze          │ Extract category,        │ Ticket text    │ JSON:        │ 100        │
│    │                  │ urgency, sentiment       │                │ {category,   │            │
│    │                  │                          │                │ urgency,     │            │
│    │                  │                          │                │ sentiment}   │            │
├────┼──────────────────┼──────────────────────────┼────────────────┼──────────────┼────────────┤
│ 3  │ judge-analysis   │ Validate if analysis     │ Ticket +       │ JSON:        │ 200        │
│    │                  │ is correct (Quality      │ Analysis       │ is_correct   │            │
│    │                  │ check)                   │                │              │            │
├────┼──────────────────┼──────────────────────────┼────────────────┼──────────────┼────────────┤
│ 4a │ guidance         │ Generate TROUBLESHOOTING │ Ticket text    │ Plain text:  │ 300        │
│    │ (HIGH urgency)   │ steps for urgent issues  │ (urgency=HIGH) │ Steps        │            │
├────┼──────────────────┼──────────────────────────┼────────────────┼──────────────┼────────────┤
│ 4b │ guidance         │ Generate SELF-SERVICE    │ Ticket text    │ Plain text:  │ 300        │
│    │ (LOW/MED urgency)│ guidance for low/med     │ (urgency!=HIGH)│ Guidance     │            │
├────┼──────────────────┼──────────────────────────┼────────────────┼──────────────┼────────────┤
│ 5  │ email            │ Draft professional      │ Ticket +       │ Plain text:  │ 400        │
│    │                  │ customer response        │ Analysis +     │ Email draft  │            │
│    │                  │                          │ Guidance       │              │            │
├────┼──────────────────┼──────────────────────────┼────────────────┼──────────────┼────────────┤
│ 6  │ judge            │ Evaluate response        │ Ticket +       │ JSON:        │ 300        │
│    │                  │ quality (1-10 scores)    │ Analysis +     │ {quality,    │            │
│    │                  │                          │ Guidance +     │ correctness, │            │
│    │                  │                          │ Email          │ relevance,   │            │
│    │                  │                          │                │ feedback}    │            │
└────┴──────────────────┴──────────────────────────┴────────────────┴──────────────┴────────────┘
```

---

## Call Sequence

```
REQUIRED (Happens First):
  ┌─ CALL 1: /api/judge-relevance ────────────────────┐
  │ "Is this a support issue?"                         │
  │ If NO → Stop                                       │
  └────────────────────────────────────────────────────┘
                        ↓
  ┌─ CALL 2: /api/analyze ──────────────────────────────┐
  │ "What category, urgency, sentiment?"                │
  │ Navigate to ResultsPage with initial analysis       │
  └─────────────────────────────────────────────────────┘

OPTIONAL (User Triggered):
  ┌─ CALL 3: /api/judge-analysis ────────────────────┐
  │ When user clicks: "Generate Guidance"             │
  │ "Is the analysis correct?"                        │
  │ If NO → Show error & stop                         │
  └───────────────────────────────────────────────────┘
                        ↓
  ┌─ CALL 4: /api/guidance ───────────────────────────┐
  │ "Generate helpful guidance"                       │
  │ Branch on urgency:                                │
  │  • HIGH → Troubleshooting steps                   │
  │  • LOW/MED → Self-service guidance                │
  └───────────────────────────────────────────────────┘
                        ↓
  ┌─ CALL 5: /api/email ──────────────────────────────┐
  │ When user clicks: "Generate Email"                │
  │ "Draft professional customer response"            │
  └───────────────────────────────────────────────────┘
                        ↓
  ┌─ CALL 6: /api/judge ──────────────────────────────┐
  │ When user clicks: "Judge Quality"                 │
  │ "Evaluate: quality, correctness, relevance"       │
  │ Returns: 1-10 scores + approval/rejection         │
  └───────────────────────────────────────────────────┘
```

---

## Call Distribution by Scenario

### Scenario A: User submits IRRELEVANT ticket
```
CALL 1 → is_relevant: false
RESULT: ❌ Stop, show "Not a Support Issue"
Total Calls: 1
```

### Scenario B: User submits ticket but leaves page
```
CALL 1 → is_relevant: true
CALL 2 → Analyze
RESULT: ✅ Analysis shown, user leaves
Total Calls: 2
```

### Scenario C: User generates guidance only
```
CALL 1 → is_relevant: true
CALL 2 → Analyze
CALL 3 → Judge analysis (is_correct: true)
CALL 4 → Generate guidance
RESULT: ✅ Guidance shown, user leaves
Total Calls: 4
```

### Scenario D: User goes full workflow (all 6)
```
CALL 1 → is_relevant: true
CALL 2 → Analyze
CALL 3 → Judge analysis (is_correct: true)
CALL 4 → Generate guidance
CALL 5 → Generate email
CALL 6 → Judge quality
RESULT: ✅ All results shown with quality scores
Total Calls: 6
```

---

## Prompt Templates (What Gets Sent to LLM)

### CALL 1: Relevance Judge
**Role:** Support ticket relevance validator  
**Task:** Determine if ticket is a genuine support issue  
**Output Format:** JSON  
**Example Input:** "My app crashes when I tap login"  
**Example Output:** `{"is_relevant": true, "confidence": 0.95, "feedback": "..."}`

### CALL 2: Analysis
**Role:** Ticket classification system  
**Task:** Extract category (14 options), urgency (Low/Medium/High), sentiment (Positive/Neutral/Negative)  
**Output Format:** JSON  
**Example Input:** "My app crashes when I tap login"  
**Example Output:** `{"category": "Bug Report", "urgency": "High", "sentiment": "Negative"}`

### CALL 3: Analysis Judge
**Role:** Expert ticket classification validator  
**Task:** Verify if the initial analysis is correct  
**Output Format:** JSON with confidence score  
**Example Input:** Ticket + Analysis (from CALL 2)  
**Example Output:** `{"is_correct": true, "confidence": 0.92, "feedback": "..."}`

### CALL 4a: Guidance (HIGH urgency)
**Role:** Support specialist  
**Task:** Provide immediate, actionable troubleshooting steps  
**Output Format:** Plain text  
**Tone:** Urgent, professional, concise  
**Example:** "1. Force close app\n2. Clear cache\n3. Restart device..."

### CALL 4b: Guidance (LOW/MEDIUM urgency)
**Role:** Knowledge base curator  
**Task:** Provide detailed self-service guidance + knowledge base links  
**Output Format:** Plain text  
**Tone:** Helpful, empowering, encouraging  
**Example:** "You can solve this yourself:\n1. Go to Settings\n2. Click Account\n..."

### CALL 5: Email Draft
**Role:** Customer support representative  
**Task:** Draft professional, empathetic customer response  
**Output Format:** Plain text (email)  
**Tone Matching:**
  - HIGH urgency: Reassuring, shows we understand the seriousness
  - LOW/MED urgency: Empowering, guides to self-service
**Example:** "Dear Customer,\n\nThank you for reaching out..."

### CALL 6: Quality Judge
**Role:** Expert support quality evaluator  
**Task:** Score response on 3 criteria (1-10 each)  
**Output Format:** JSON with scores + approval  
**Scoring Criteria:**
  - **Quality:** Professional, clear, well-structured
  - **Correctness:** Category/urgency assessment correct
  - **Relevance:** Addresses customer's specific issue
**Example Output:** `{"quality_score": 9, "correctness_score": 9, "relevance_score": 8, "overall_score": 9, "is_approved": true, "feedback": "..."}`

---

## Token Usage

```
Single Full Workflow (Scenario D: All 6 calls):

Call 1:  ~150 tokens ┐
Call 2:  ~75 tokens  │
Call 3:  ~150 tokens ├─ ~1,225 total tokens
Call 4:  ~250 tokens │
Call 5:  ~350 tokens │
Call 6:  ~250 tokens ┘

Cost (estimated): $0.10-0.20 per complete workflow
              (based on Hugging Face routing rates)
```

---

## API Endpoints Summary

| Endpoint | HTTP Method | Request Body | Response | When Used |
|----------|------------|--------------|----------|-----------|
| `/api/judge-relevance` | POST | `{ticket: string}` | JSON | Step 1 (automatic) |
| `/api/analyze` | POST | `{ticket: string}` | JSON | Step 2 (automatic) |
| `/api/judge-analysis` | POST | `{ticket, analysis}` | JSON | Before guidance |
| `/api/guidance` | POST | `{ticket, analysis}` | JSON | After judge passes |
| `/api/email` | POST | `{ticket, analysis, guidance}` | JSON | After guidance |
| `/api/judge` | POST | `{ticket, analysis, guidance, finalEmail}` | JSON | For quality check |

---

## Decision Points

```
CALL 1 Decision:
├─ is_relevant == true  → Continue to CALL 2
└─ is_relevant == false → ❌ STOP (User gets error message)

CALL 3 Decision:
├─ is_correct == true  → Continue to CALL 4
└─ is_correct == false → ⚠️ Warn user (Can't generate guidance)

CALL 6 Decision:
├─ overall_score >= 7  → ✅ is_approved = true (green)
└─ overall_score < 7   → ⚠️ is_approved = false (red - needs review)
```

---

## Quick Facts

- **Total Possible Calls:** 6 per ticket
- **Minimum Calls:** 2 (relevance + analyze)
- **Model:** meta-llama/Llama-3.1-8B-Instruct (all calls)
- **Provider:** Hugging Face Router
- **API Standard:** OpenAI-compatible
- **Max Tokens per Call:** 100-400 (varies by call)
- **Total Token Budget:** ~1,225 per full workflow
- **Validation Levels:** 3 (relevance → analysis → quality)

