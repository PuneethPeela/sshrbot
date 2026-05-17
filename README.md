# HRBot - Intelligent HR Helpdesk Assistant

HRBot is an intelligent, automated HR Helpdesk Assistant built for the Promtal HR platform. It leverages advanced Large Language Models (Claude Sonnet 4 / Gemini) combined with Retrieval-Augmented Generation (RAG) to instantly and accurately resolve employee questions regarding payroll, leave, HR policies, and onboarding.

## Features (Hackathon MVP)

- **Real-time Chat Interface:** A clean, markdown-supported chat UI with typing indicators and streaming responses.
- **RAG-based Policy Question Answering:** Upload HR policy documents (PDF/DOCX) which are chunked, embedded, and queried to provide accurate, context-aware answers.
- **Confidence-based Escalation:** Automatically routes sensitive or low-confidence queries to human HR representatives.
- **Topic Classification:** Automatically tags queries into predefined HR categories (PAYROLL, LEAVE, ONBOARDING, POLICY, BENEFITS, GENERAL).
- **Source Citation:** Cites the specific policy document and section for every policy-based answer.
- **Admin & Employee Portals:** Allows HR to upload policies and view ticket logs, while employees can ask questions, check leave balances, and view ticket statuses.

## Tech Stack

### Frontend
- React 18 (Vite)
- Tailwind CSS
- Framer Motion (Animations)
- React Markdown

### Backend
- FastAPI (Python)
- Claude Sonnet 4 API (via Anthropic) or Google Gemini API
- ChromaDB (Local Vector DB for MVP)
- SQLite (Local Database for MVP)

### Deployment
- Docker
- Google Cloud Run

## Setup Instructions

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
pip install -r requirements.txt

# Create .env file and add your API keys
echo "ANTHROPIC_API_KEY=your_key_here" > .env

# Run FastAPI server
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Usage
- Navigate to `http://localhost:5173` to access the chat interface.
- Navigate to `http://localhost:8000/docs` to view the FastAPI Swagger documentation.

## Hackathon Impact
HR teams spend roughly 40% of their time answering repetitive policy questions. HRBot automates this process, saving approximately 8 hours per week per HR executive while ensuring compliance and employee satisfaction.
