# 🤖 AI Support Ticket Router

**Intelligent ticket analysis, guidance generation, and quality assurance using Multi-LLM architecture**

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.9%2B-green.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-19.2%2B-blue.svg)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104%2B-009485.svg)](https://fastapi.tiangolo.com/)

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Setup Instructions](#setup-instructions)
- [AI Capabilities](#ai-capabilities)
- [Multilingual Support](#multilingual-support)
- [API Endpoints](#api-endpoints)
- [Security Features](#security-features)
- [Challenges Faced](#challenges-faced)
- [Future Improvements](#future-improvements)
- [Documentation](#documentation)

---

## 🎯 Project Overview

AI Support Ticket Router is an intelligent customer support automation system that:

1. **Analyzes** incoming support tickets for category, urgency, and sentiment
2. **Generates** contextual troubleshooting guidance or self-service instructions
3. **Drafts** professional customer response emails
4. **Validates** analysis accuracy and response quality using multiple LLMs
5. **Supports** multiple languages (English, Tamil, Telugu)
6. **Routes** tickets intelligently based on priority and complexity

**Use Case:** Automate 50-70% of routine support tickets while maintaining quality standards through AI validation.

---

## ✨ Key Features

### Core Capabilities
- ✅ **Multi-LLM Architecture** - Uses 4 different LLM providers for optimal performance
- ✅ **Ticket Analysis** - Extracts category, urgency (Low/Medium/High), sentiment (Positive/Neutral/Negative)
- ✅ **Smart Guidance** - Generates troubleshooting steps for technical issues, self-service guides for others
- ✅ **Email Generation** - Creates professional, empathetic customer responses
- ✅ **Dual Validation** - Judges analysis accuracy and final response quality with confidence scores
- ✅ **Multilingual Support** - Translate troubleshooting steps to Tamil and Telugu
- ✅ **Ticket Editing** - Modify tickets and regenerate guidance on-the-fly

### Security & Quality
- ✅ **Input Sanitization** - Prevents prompt injection attacks
- ✅ **Dynamic CORS** - Environment-based origin configuration
- ✅ **Rate Limiting** - Prevents API abuse (15-20 req/min per endpoint)
- ✅ **Error Handling** - Comprehensive error messages and logging
- ✅ **Type Safety** - Pydantic models for request/response validation

### Modern UI/UX
- ✅ **Step-by-Step Progress** - Visual progress tracker for 4-step workflow
- ✅ **Real-time Loading** - Smooth loading states and skeleton screens
- ✅ **Responsive Design** - Works seamlessly on desktop and mobile
- ✅ **Dark Mode Ready** - Material-UI theming support
- ✅ **Copy Functionality** - One-click copy for guidance and emails

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI SUPPORT TICKET ROUTER                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐          ┌──────────────────────────────┐ │
│  │   React Frontend │◄────────►│   FastAPI Backend            │ │
│  │   (localhost:5173)           │   (localhost:8000)           │ │
│  └──────────────────┘          └──────────────────────────────┘ │
│         │                               │                         │
│         │                               ├─► Mistral 7B           │
│         │                               ├─► DeepSeek V4          │
│         │                               ├─► GPT-OSS 120B (Groq)  │
│         │                               └─► OpenAI GPT-4o        │
│         │                                                          │
│         └──► User Interface                                       │
│              • Ticket Submission                                  │
│              • Analysis Results                                   │
│              • Guidance Display                                   │
│              • Email Preview                                      │
│              • Quality Scores                                     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Processing Pipeline

```
Customer Support Ticket
    ↓
1. Judge Relevance (is it legitimate support?)
    ↓ (if relevant)
2. Analyze (category, urgency, sentiment)
    ↓
3. Validate Analysis (accuracy check)
    ↓
4. Generate Guidance (troubleshooting steps or self-service guide)
    ↓
5. Generate Email (professional customer response)
    ↓
6. Judge Response (quality & correctness assessment)
    ↓ (if score >= 7)
7. Send to Customer ✅
    └─► (if score < 7) Route for Human Review ⚠️
```

### Multi-LLM Strategy

| Task | LLM Used | Reason |
|------|----------|--------|
| **Judge Relevance** | Mistral 7B (Featherless) | Fast, good for classification |
| **Analyze Ticket** | Mistral 7B (Featherless) | Fast, structured output |
| **Generate Guidance** | DeepSeek V4 Flash (Novita) | Creative, detailed instructions |
| **Generate Email** | DeepSeek V4 Flash (Novita) | Empathetic, professional tone |
| **Judge Analysis** | GPT-OSS 120B (Groq) | Most accurate validation |
| **Judge Response** | GPT-OSS 120B (Groq) | Comprehensive quality assessment |
| **Translate** | Mistral 7B or DeepSeek | Fast translation while preserving structure |

---

## 🚀 Setup Instructions

### Prerequisites
- Python 3.9+
- Node.js 18+
- Git

### Backend Setup

```bash
# 1. Navigate to backend
cd application/backend

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment variables
cp .env.example .env
# Edit .env with your LLM API keys:
# - FEATHERLESS_API_KEY (for Mistral)
# - NOVITA_API_KEY (for DeepSeek)
# - GROQ_API_KEY (for GPT-OSS 120B)
# - OPENAI_API_KEY (for GPT-4o)

# 5. Start backend server
python main.py
# Server runs on http://localhost:8000
```

### Frontend Setup

```bash
# 1. Navigate to frontend
cd application/frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
# Server runs on http://localhost:5173
```

### Quick Start

```bash
# Terminal 1: Start backend
cd application/backend
source venv/bin/activate
python main.py

# Terminal 2: Start frontend
cd application/frontend
npm run dev

# Open browser to http://localhost:5173
```

---

## 🧠 AI Capabilities

### 1. Ticket Analysis
**Endpoint:** `POST /api/analyze`

Extracts three key dimensions from customer tickets:

- **Category** (14 types):
  - Technical Issue, Billing Inquiry, Feature Request, General Question, Account Management
  - Bug Report, Complaint/Escalation, Security/Privacy, Refund Request, Integration Issue
  - Performance Issue, Documentation/API Question, Data Request, Service Status

- **Urgency** (3 levels):
  - Low: General questions, documentation requests
  - Medium: Feature requests, minor issues, billing inquiries
  - High: App crashes, security concerns, service outages

- **Sentiment** (3 types):
  - Positive: Compliments, praises
  - Neutral: General inquiries, factual questions
  - Negative: Complaints, upset customers

**Response Time:** 1-3 seconds

### 2. Intelligent Guidance Generation
**Endpoint:** `POST /api/guidance`

Generates contextual help based on urgency:

- **High Urgency** → Troubleshooting steps (numbered, technical)
- **Medium/Low** → Self-service guidance (instructional, friendly)

Each guidance includes:
- Numbered step format for clarity
- Technical accuracy maintained
- User-friendly language
- Escalation path provided

**Response Time:** 2-5 seconds

### 3. Professional Email Generation
**Endpoint:** `POST /api/email`

Creates customer-facing responses with:
- Empathetic opening acknowledging the issue
- Clear, actionable troubleshooting steps
- Professional closing with support contact info
- Tone matching urgency level

**Response Time:** 3-5 seconds

### 4. Dual Validation System

**Analysis Validation** (`POST /api/judge-analysis`):
- Verifies ticket categorization is correct
- Confidence score (0-1 indicating certainty)
- Feedback on analysis quality

**Response Validation** (`POST /api/judge`):
- Rates quality, correctness, relevance (1-10 scale)
- Calculates overall score
- Auto-approval if score ≥ 7
- Detailed feedback for improvement

**Response Time:** 2-5 seconds per validation

### 5. Multilingual Translation
**Endpoint:** `POST /api/translate-guidance`

Translates troubleshooting steps while:
- Preserving numbered list format
- Maintaining technical accuracy
- Keeping step clarity
- Supporting Tamil (தமிழ் மொழி) and Telugu (తెలుగు)

**Response Time:** 2-4 seconds per language

---

## 🌍 Multilingual Support

### Supported Languages
1. **English** - Default, all features
2. **Tamil** (தமிழ் மொழி) - For troubleshooting steps
3. **Telugu** (తెలుగు) - For troubleshooting steps

### Usage
1. Generate troubleshooting guidance
2. Click "🇮🇳 Tamil" or "🇮🇳 Telugu" button
3. View translation side-by-side with original
4. Copy translated text directly

### Why These Languages?
- Target support for South Indian customer bases
- High demand for Tamil and Telugu localization
- Improves customer satisfaction in regional markets

---

## 📡 API Endpoints

### Quick Reference

| # | Endpoint | Method | Purpose | Rate Limit |
|---|----------|--------|---------|-----------|
| 1 | `/` | GET | Health check | Unlimited |
| 2 | `/api/models` | GET | List available LLM models | Unlimited |
| 3 | `/api/judge-relevance` | POST | Validate ticket relevance | 20/min |
| 4 | `/api/analyze` | POST | Extract category, urgency, sentiment | 15/min |
| 5 | `/api/guidance` | POST | Generate troubleshooting/guidance | 15/min |
| 6 | `/api/email` | POST | Generate customer response email | 15/min |
| 7 | `/api/judge-analysis` | POST | Validate analysis accuracy | 10/min |
| 8 | `/api/judge` | POST | Final quality check | 10/min |
| 9 | `/api/translate-guidance` | POST | Translate to Tamil/Telugu | 15/min |

### Common Use Cases

#### Use Case 1: Auto-Response System
```
Ticket Arrives → Judge Relevance → Analyze → Generate Guidance → Generate Email → Judge Quality → Send if ≥7
```

#### Use Case 2: Ticket Routing
```
Ticket → Analyze → Route based on category & urgency → Assign to team
```

#### Use Case 3: Quality Control
```
Response Generated → Judge Quality → If <7, escalate for human review
```

#### Use Case 4: Multilingual Support
```
Generate Guidance → Translate to Tamil/Telugu → Send in customer's language
```

### Detailed Documentation
See [`documentation/02_API_QUICK_REFERENCE.md`](documentation/02_API_QUICK_REFERENCE.md) for curl/Python/JavaScript examples.

See [`documentation/03_API_ENDPOINTS_DOCUMENTATION.md`](documentation/03_API_ENDPOINTS_DOCUMENTATION.md) for complete specifications.

---

## 🔒 Security Features

### Input Protection
- **Prompt Injection Prevention** - Detects and blocks malicious patterns
- **Input Sanitization** - Removes dangerous characters and scripts
- **Length Validation** - Prevents oversized payloads
- **Type Checking** - Strict Pydantic validation on all inputs

### Network Security
- **Dynamic CORS** - Configurable allowed origins via environment
- **Rate Limiting** - Per-endpoint rate limits (10-20 req/min)
- **Error Logging** - All errors logged with context
- **Timeout Protection** - API calls timeout after 30 seconds

### Code Quality
- **Token Limits** - Prevents context overflow in LLM calls
- **DRY Principle** - Eliminated duplicate JSON parsing logic
- **Type Safety** - IntEnum for token limits, Pydantic for models
- **Error Handling** - Graceful fallbacks and user-friendly messages

See [`documentation/07_SECURITY_FIXES_SUMMARY.md`](documentation/07_SECURITY_FIXES_SUMMARY.md) for details.

---

## 🎓 Challenges Faced

### 1. Multi-LLM Orchestration
**Challenge:** Different LLMs have varying response formats, latency, and accuracy
**Solution:** 
- Created unified request/response wrappers
- Implemented model-specific prompt engineering
- Added validation layer to normalize outputs
- Used Groq for consistency-critical operations

### 2. Structured Output Extraction
**Challenge:** LLMs sometimes return malformed JSON or incomplete data
**Solution:**
- Added retry logic with exponential backoff
- Implemented fallback parsing for edge cases
- Created `extract_json_from_response()` helper function
- Validated outputs against Pydantic models

### 3. Maintaining Formatting in Translations
**Challenge:** Translations could break numbered lists and technical structure
**Solution:**
- Crafted specific prompts to preserve formatting
- Tested translations with various content types
- Implemented post-translation validation
- Maintained side-by-side original for reference

### 4. Frontend Rendering Performance
**Challenge:** Large markdown/text rendered slowly
**Solution:**
- Implemented lazy loading for guidance display
- Added skeleton screens during generation
- Used React memoization for expensive renders
- Optimized Material-UI components

### 5. State Management Complexity
**Challenge:** Multiple async operations happening simultaneously
**Solution:**
- Unified loading state object for all operations
- Unified error state object for feedback
- Used React hooks consistently throughout
- Prevented race conditions with proper cleanup

### 6. Browser Caching Issues
**Challenge:** Frontend changes weren't reflecting after push
**Solution:**
- Switched from Create React App to Vite (faster rebuilds)
- Implemented proper build cache busting
- Added hard refresh instructions for users
- Created development server restart scripts

---

## 🚀 Future Improvements

### Short Term (1-2 weeks)
- [ ] Add support for more languages (Hindi, Gujarati, Marathi)
- [ ] Implement ticket history/conversation threading
- [ ] Add analytics dashboard for ticket trends
- [ ] Create admin panel for LLM model switching
- [ ] Add webhook support for Slack/Teams integration

### Medium Term (1-2 months)
- [ ] Fine-tune models on customer support data
- [ ] Implement active learning for continuous improvement
- [ ] Add real-time collaboration features
- [ ] Build customer feedback loop integration
- [ ] Create A/B testing framework for prompts

### Long Term (2-6 months)
- [ ] Develop proprietary customer support LLM
- [ ] Implement reinforcement learning from feedback
- [ ] Add voice input/output support
- [ ] Build predictive escalation system
- [ ] Create mobile app for support agents
- [ ] Implement federated learning for privacy-preserving updates

### Infrastructure
- [ ] Containerize with Docker
- [ ] Deploy to Kubernetes
- [ ] Set up CI/CD pipeline
- [ ] Implement comprehensive monitoring/alerting
- [ ] Add automated testing framework
- [ ] Set up disaster recovery plan

---

## 📚 Documentation

### In This Repository

| File | Purpose |
|------|---------|
| [`documentation/01_API_DOCS_INDEX.md`](documentation/01_API_DOCS_INDEX.md) | Navigation guide for API docs |
| [`documentation/02_API_QUICK_REFERENCE.md`](documentation/02_API_QUICK_REFERENCE.md) | Quick lookup with code examples |
| [`documentation/03_API_ENDPOINTS_DOCUMENTATION.md`](documentation/03_API_ENDPOINTS_DOCUMENTATION.md) | Complete endpoint specifications |
| [`documentation/04_API_DOCUMENTATION_SUMMARY.md`](documentation/04_API_DOCUMENTATION_SUMMARY.md) | Overview and integration checklist |
| [`documentation/05_CODE_QUALITY_IMPROVEMENTS.md`](documentation/05_CODE_QUALITY_IMPROVEMENTS.md) | Security & quality fixes explained |
| [`documentation/06_CODE_QUALITY_QUICK_REFERENCE.md`](documentation/06_CODE_QUALITY_QUICK_REFERENCE.md) | Quick reference for code changes |
| [`documentation/07_SECURITY_FIXES_SUMMARY.md`](documentation/07_SECURITY_FIXES_SUMMARY.md) | Security implementations |
| [`documentation/08_MULTI_LLM_ARCHITECTURE.md`](documentation/08_MULTI_LLM_ARCHITECTURE.md) | Multi-LLM system design |
| [`documentation/09_ARCHITECTURE_DIAGRAM.md`](documentation/09_ARCHITECTURE_DIAGRAM.md) | System architecture & diagrams |
| [`documentation/10_FRONTEND_REDESIGN.md`](documentation/10_FRONTEND_REDESIGN.md) | UI/UX improvements |

### Getting Started

1. **I want to use the API** → Start with [`documentation/02_API_QUICK_REFERENCE.md`](documentation/02_API_QUICK_REFERENCE.md)
2. **I'm building an integration** → Read [`documentation/03_API_ENDPOINTS_DOCUMENTATION.md`](documentation/03_API_ENDPOINTS_DOCUMENTATION.md)
3. **I need to understand security** → See [`documentation/07_SECURITY_FIXES_SUMMARY.md`](documentation/07_SECURITY_FIXES_SUMMARY.md)
4. **I want system overview** → Check [`documentation/08_MULTI_LLM_ARCHITECTURE.md`](documentation/08_MULTI_LLM_ARCHITECTURE.md)

---

## 📊 Technology Stack

### Backend
- **Framework:** FastAPI 0.104+
- **Server:** Uvicorn
- **Validation:** Pydantic
- **Rate Limiting:** Slowapi
- **LLM Providers:** 
  - Featherless AI (Mistral)
  - Novita (DeepSeek)
  - Groq (GPT-OSS 120B)
  - OpenAI (GPT-4o)

### Frontend
- **Framework:** React 19.2+
- **Build Tool:** Vite 8+
- **UI Library:** Material-UI (MUI) 9+
- **HTTP Client:** Axios
- **Router:** React Router v7+
- **Styling:** Emotion + MUI System

### Infrastructure
- **Runtime:** Python 3.9+, Node.js 18+
- **Package Managers:** pip, npm
- **Version Control:** Git
- **Development:** VS Code, Claude Code

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🤝 Contributing

Contributions are welcome! Please:
1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

---

## 📞 Support & Contact

For questions, issues, or suggestions:
- Open an issue on GitHub
- Check existing documentation in `/documentation` folder
- Review the detailed architecture guides for technical questions

---

## 🎉 Acknowledgments

Built with advanced LLM integrations and modern full-stack development practices.

**Key Innovation:** Multilingual support for Tamil and Telugu to serve regional customer bases with AI-powered support automation.

---

**Version:** 2.0.0  
**Last Updated:** May 27, 2026  
**Status:** ✅ Production Ready

Happy coding! 🚀
