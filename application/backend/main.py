# main.py
import os
import json
from fastapi import FastAPI, HTTPException
from enum import Enum
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from openai import OpenAIError
from dotenv import load_dotenv
import asyncio

# Import new multi-LLM architecture components
from config.models import get_model_id, list_all_models
from services.llm_service import get_llm_service
from middleware.error_handler import LLMErrorHandler, RequestLoggingMiddleware
from utils.logging_config import setup_logging, llm_logger
from utils.response_cleaner import extract_json

# Load environment variables from .env file
load_dotenv()

# Setup logging
setup_logging(level="INFO")

# --- Pydantic Models for Strict Data Validation ---

class CategoryEnum(str, Enum):
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

class UrgencyEnum(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"

class SentimentEnum(str, Enum):
    POSITIVE = "Positive"
    NEUTRAL = "Neutral"
    NEGATIVE = "Negative"

class TicketRequest(BaseModel):
    ticket: str = Field(..., min_length=1, description="The combined content of the support ticket.")

class RelevanceJudgeResponse(BaseModel):
    is_relevant: bool
    confidence: float
    feedback: str

class TicketAnalysis(BaseModel):
    category: CategoryEnum
    urgency: UrgencyEnum
    sentiment: SentimentEnum

class GuidanceRequest(BaseModel):
    ticket: str
    analysis: TicketAnalysis


# --- FastAPI App Initialization ---
app = FastAPI(
    title="AI Support Ticket Router (Multi-LLM)",
    description="Processes support tickets using multiple specialized AI models via Hugging Face Router.",
    version="2.0.0"
)

# --- Add Middleware ---
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(LLMErrorHandler)

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Root Endpoint for Health Check ---
@app.get("/")
async def read_root():
    return {
        "message": "AI Support Ticket Router API is running (Multi-LLM v2.0)",
        "version": "2.0.0",
        "active_models": list_all_models(),
    }

@app.get("/api/models")
async def list_models():
    """List all configured models and their task types."""
    return {
        "models": list_all_models(),
        "description": "Each model is optimized for its specific task",
    }


# --- Prompt Engineering Templates ---

def get_relevance_judge_prompt(ticket: str) -> str:
    """Generate a prompt to validate if the ticket is relevant to the support system."""
    return f"""You are a support ticket relevance validator. Determine if this is a genuine support issue.

TICKET:
{ticket}

VALID issues: Software bugs, feature requests, account issues, billing problems, API questions, technical problems, service status, data requests, security concerns, documentation questions.

INVALID issues: Personal problems, lost items, unrelated advice, off-topic messages, spam.

Return ONLY JSON:
{{"is_relevant": true/false, "confidence": 0.0-1.0, "feedback": "explanation"}}"""

def get_analysis_prompt(ticket: str) -> str:
    return f"""Analyze this support ticket and extract EXACTLY ONE category, urgency level, and sentiment.

IMPORTANT: Choose the SINGLE MOST APPROPRIATE category. Do not list multiple.

CHOOSE ONE CATEGORY (not multiple):
- Technical Issue (app crashes, errors, bugs)
- Billing Inquiry (payments, invoices)
- Feature Request (enhancement suggestions)
- General Question (how-tos, account info)
- Account Management (password reset, profile)
- Bug Report (specific software bug)
- Complaint/Escalation (dissatisfaction, escalation)
- Security/Privacy (data breach, privacy concerns)
- Refund Request (money back requests)
- Integration Issue (third-party integrations)
- Performance Issue (slow app, latency)
- Documentation/API Question (API docs, guides)
- Data Request (export data, access)
- Service Status (system down, outage)

CHOOSE ONE URGENCY: Low, Medium, or High
CHOOSE ONE SENTIMENT: Positive, Neutral, or Negative

TICKET: "{ticket}"

Return ONLY this JSON (no extra text):
{{"category": "ExactCategoryName", "urgency": "High", "sentiment": "Negative"}}"""

def get_troubleshooting_prompt(ticket: str) -> str:
    return f"""A customer has a HIGH-URGENCY issue. Provide immediate actionable troubleshooting steps. Be concise. No fluff.

TICKET: "{ticket}"

Troubleshooting Steps:"""

def get_self_service_prompt(ticket: str) -> str:
    return f"""A customer has a LOW/MEDIUM urgency issue. Provide detailed self-service guidance and knowledge base article suggestions.

TICKET: "{ticket}"

Self-Service Guidance:"""

def get_email_prompt(ticket: str, analysis: dict, guidance: str) -> str:
    return f"""Generate a professional and empathetic customer response email.

TICKET: "{ticket}"
ANALYSIS: {json.dumps(analysis)}
GUIDANCE: "{guidance}"

Response email:"""

def get_analysis_judge_prompt(ticket: str, analysis: dict) -> str:
    """Generate a prompt to validate the ticket analysis."""
    return f"""Validate if this ticket analysis is correct.

TICKET: {ticket}

PROVIDED ANALYSIS:
- Category: {analysis.get('category')}
- Urgency: {analysis.get('urgency')}
- Sentiment: {analysis.get('sentiment')}

VALID CATEGORIES: Technical Issue, Billing Inquiry, Feature Request, General Question, Account Management, Bug Report, Complaint/Escalation, Security/Privacy, Refund Request, Integration Issue, Performance Issue, Documentation/API Question, Data Request, Service Status

Is the analysis correct? Return ONLY JSON:
{{"is_correct": true/false, "confidence": 0.0-1.0, "feedback": "explanation"}}"""

def get_judge_prompt(ticket: str, analysis: dict, guidance: str, email: str) -> str:
    """Generate a prompt for the LLM to judge the ticket response."""
    return f"""Evaluate this ticket response on a 1-10 scale.

TICKET: {ticket}

ANALYSIS:
- Category: {analysis.get('category')}
- Urgency: {analysis.get('urgency')}
- Sentiment: {analysis.get('sentiment')}

GUIDANCE: {guidance}

EMAIL: {email}

Evaluate:
1. QUALITY: Professional, clear, well-structured?
2. CORRECTNESS: Category and urgency correct?
3. RELEVANCE: Addresses the issue?

Return ONLY JSON:
{{"quality_score": 1-10, "correctness_score": 1-10, "relevance_score": 1-10, "feedback": "text", "is_approved": true/false}}"""


# --- API Endpoints ---

@app.post("/api/judge-relevance", response_model=RelevanceJudgeResponse)
async def judge_relevance(ticket_request: TicketRequest):
    """Validates if the ticket is relevant to the support system using Mistral 7B."""
    ticket = ticket_request.ticket
    llm_service = get_llm_service()

    try:
        prompt = get_relevance_judge_prompt(ticket)
        response_text = await llm_service.call_llm(
            task_type="relevance_judge",
            messages=[{"role": "user", "content": prompt}],
        )

        # Parse JSON response
        judge_json = llm_service.extract_json_response(
            response_text,
            required_keys=["is_relevant", "confidence", "feedback"]
        )

        return RelevanceJudgeResponse(
            is_relevant=judge_json.get("is_relevant", True),
            confidence=float(judge_json.get("confidence", 0.5)),
            feedback=judge_json.get("feedback", "Relevance validation completed.")
        )
    except OpenAIError as e:
        raise HTTPException(status_code=503, detail=f"AI service unavailable: {e}")
    except Exception as e:
        llm_logger.logger.error(f"Relevance judge error: {e}")
        return RelevanceJudgeResponse(
            is_relevant=True,
            confidence=0.5,
            feedback="Unable to validate relevance. Proceeding with caution."
        )

@app.post("/api/analyze", response_model=TicketAnalysis)
async def analyze_ticket(ticket_request: TicketRequest):
    """Analyzes ticket and returns category, urgency, and sentiment using Mistral 7B."""
    ticket = ticket_request.ticket
    llm_service = get_llm_service()

    try:
        prompt = get_analysis_prompt(ticket)
        response_text = await llm_service.call_llm(
            task_type="analyze",
            messages=[{"role": "user", "content": prompt}],
        )

        # Parse JSON response
        analysis_json = llm_service.extract_json_response(
            response_text,
            required_keys=["category", "urgency", "sentiment"]
        )

        # Handle case where model returns multiple categories (take first one)
        if isinstance(analysis_json.get("category"), str):
            category = analysis_json["category"].strip()
            # If multiple categories provided, take the first one
            if "," in category:
                category = category.split(",")[0].strip()
            analysis_json["category"] = category

        analysis = TicketAnalysis(**analysis_json)
        return analysis
    except OpenAIError as e:
        raise HTTPException(status_code=503, detail=f"AI service unavailable: {e}")
    except Exception as e:
        llm_logger.logger.error(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail="AI failed to generate a valid analysis.")

@app.post("/api/guidance")
async def get_guidance(guidance_request: GuidanceRequest):
    """Generates guidance based on urgency using Qwen 3.6B."""
    ticket = guidance_request.ticket
    analysis = guidance_request.analysis
    llm_service = get_llm_service()

    try:
        if analysis.urgency == 'High':
            prompt = get_troubleshooting_prompt(ticket)
        else:
            prompt = get_self_service_prompt(ticket)

        response_text = await llm_service.call_llm(
            task_type="guidance",
            messages=[{"role": "user", "content": prompt}],
        )

        guidance_text = llm_service.extract_text_response(response_text)
        return {"guidance": guidance_text}
    except OpenAIError as e:
        raise HTTPException(status_code=503, detail=f"AI service unavailable: {e}")
    except Exception as e:
        llm_logger.logger.error(f"Guidance generation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate guidance.")

class EmailRequest(BaseModel):
    ticket: str
    analysis: TicketAnalysis
    guidance: str

@app.post("/api/email")
async def get_email(email_request: EmailRequest):
    """Generates professional customer email using Qwen 3.6B."""
    ticket = email_request.ticket
    analysis = email_request.analysis
    guidance = email_request.guidance
    llm_service = get_llm_service()

    try:
        prompt = get_email_prompt(ticket, analysis.dict(), guidance)
        response_text = await llm_service.call_llm(
            task_type="email",
            messages=[{"role": "user", "content": prompt}],
        )

        email_text = llm_service.extract_text_response(response_text)
        return {"finalEmail": email_text}
    except OpenAIError as e:
        raise HTTPException(status_code=503, detail=f"AI service unavailable: {e}")
    except Exception as e:
        llm_logger.logger.error(f"Email generation error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate email.")


# --- Analysis Validation Judge ---
class AnalysisJudgeRequest(BaseModel):
    ticket: str
    analysis: TicketAnalysis

class AnalysisJudgeResponse(BaseModel):
    is_correct: bool
    confidence: float
    feedback: str

@app.post("/api/judge-analysis", response_model=AnalysisJudgeResponse)
async def judge_analysis(analysis_judge_request: AnalysisJudgeRequest):
    """Validates the ticket analysis using GPT-OSS 120B via Groq."""
    ticket = analysis_judge_request.ticket
    analysis = analysis_judge_request.analysis
    llm_service = get_llm_service()

    try:
        prompt = get_analysis_judge_prompt(ticket, analysis.dict())
        response_text = await llm_service.call_llm(
            task_type="judge_analysis",
            messages=[{"role": "user", "content": prompt}],
        )

        judge_json = llm_service.extract_json_response(
            response_text,
            required_keys=["is_correct", "confidence", "feedback"]
        )

        return AnalysisJudgeResponse(
            is_correct=judge_json.get("is_correct", True),
            confidence=float(judge_json.get("confidence", 0.5)),
            feedback=judge_json.get("feedback", "Analysis validation completed.")
        )
    except OpenAIError as e:
        raise HTTPException(status_code=503, detail=f"AI service unavailable: {e}")
    except Exception as e:
        llm_logger.logger.error(f"Analysis judge error: {e}")
        return AnalysisJudgeResponse(
            is_correct=True,
            confidence=0.5,
            feedback="Unable to validate analysis. Proceeding with caution."
        )


# --- Final Quality Judge ---
class JudgeRequest(BaseModel):
    ticket: str
    analysis: TicketAnalysis
    guidance: str
    finalEmail: str

class JudgeResponse(BaseModel):
    quality_score: int
    correctness_score: int
    relevance_score: int
    overall_score: int
    feedback: str
    is_approved: bool

@app.post("/api/judge", response_model=JudgeResponse)
async def judge_response(judge_request: JudgeRequest):
    """Final quality evaluation using GPT-OSS 120B via Groq."""
    ticket = judge_request.ticket
    analysis = judge_request.analysis
    guidance = judge_request.guidance
    email = judge_request.finalEmail
    llm_service = get_llm_service()

    try:
        prompt = get_judge_prompt(ticket, analysis.dict(), guidance, email)
        response_text = await llm_service.call_llm(
            task_type="judge",
            messages=[{"role": "user", "content": prompt}],
        )

        judge_json = llm_service.extract_json_response(
            response_text,
            required_keys=["quality_score", "correctness_score", "relevance_score", "feedback"]
        )

        overall_score = round((
            judge_json.get("quality_score", 5) +
            judge_json.get("correctness_score", 5) +
            judge_json.get("relevance_score", 5)
        ) / 3)

        return JudgeResponse(
            quality_score=judge_json.get("quality_score", 5),
            correctness_score=judge_json.get("correctness_score", 5),
            relevance_score=judge_json.get("relevance_score", 5),
            overall_score=overall_score,
            feedback=judge_json.get("feedback", "No feedback provided"),
            is_approved=judge_json.get("is_approved", overall_score >= 7)
        )
    except OpenAIError as e:
        raise HTTPException(status_code=503, detail=f"AI service unavailable: {e}")
    except Exception as e:
        llm_logger.logger.error(f"Judge error: {e}")
        return JudgeResponse(
            quality_score=5,
            correctness_score=5,
            relevance_score=5,
            overall_score=5,
            feedback="Judge evaluation failed. Please review manually.",
            is_approved=False
        )
