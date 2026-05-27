# AI Support Ticket Router

This is a full-stack application that uses AI to analyze, route, and respond to customer support tickets. It analyzes incoming tickets for category, urgency, and sentiment, then generates tailored guidance and a draft email response based on the ticket's urgency.

## Architecture

The application uses a decoupled frontend/backend architecture:
- **Frontend:** A React single-page application built with Vite.
- **Backend:** A Python API server built with FastAPI.
- **AI Service:** Hugging Face Router for Large Language Model (LLM) calls.

```mermaid
sequenceDiagram
    participant User as User (Browser)
    participant FE as React Frontend
    participant BE as Python Backend (FastAPI)
    participant AI as Hugging Face Router

    User->>+FE: 1. Submits support ticket form
    FE->>+BE: 2. POST /api/process-ticket with ticket data
    BE->>+AI: 3. LLM Call 1: Analyze ticket (Category, Urgency, Sentiment)
    AI-->>-BE: 4. Returns structured JSON analysis
    BE->>BE: 5. IF/ELSE Logic based on 'urgency'
    alt Urgency is High
        BE->>+AI: 6a. LLM Call 2: Generate troubleshooting steps
        AI-->>-BE: 7a. Returns troubleshooting text
    else Urgency is Low/Medium
        BE->>+AI: 6b. LLM Call 2: Generate self-service guidance
        AI-->>-BE: 7b. Returns guidance text
    end
    BE->>+AI: 8. LLM Call 3: Generate final customer email
    AI-->>-BE: 9. Returns complete email text
    BE-->>-FE: 10. Returns 200 OK with {analysis, guidance, finalEmail}
    FE-->>-User: 11. Displays results on the screen
```

## Tech Stack

- **Frontend:** React, Vite, Axios
- **Backend:** Python, FastAPI, Uvicorn, OpenAI Client, python-dotenv
- **AI:** Hugging Face Router (`meta-llama/Llama-3.1-8B-Instruct`)

## Setup and Installation

### Prerequisites
- Node.js and npm
- Python and pip
- A Hugging Face API Token with "Read" access.

### Backend Setup

1.  Navigate to the `backend` directory: `cd backend`
2.  Create and activate a virtual environment:
    ```bash
    # On Windows
    python -m venv venv
    .\venv\Scripts\activate
    ```
3.  Install dependencies: `pip install -r requirements.txt`
4.  Create a `.env` file in the `backend` directory and add your API key:
    ```
    HUGGING_FACE_API_KEY=hf_YourSecretTokenGoesHere
    ```
5.  Run the server: `uvicorn main:app --reload`
    The backend will be running at `http://localhost:8000`.

### Frontend Setup

1.  In a new terminal, navigate to the `frontend` directory: `cd frontend`
2.  Install dependencies: `npm install`
3.  Run the development server: `npm run dev`
    The frontend will be running at `http://localhost:5173` and is ready to connect to the backend.