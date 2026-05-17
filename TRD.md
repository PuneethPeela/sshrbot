# Technical Requirements Document (TRD) - Promtal HRBot

## 1. System Architecture overview
Promtal HRBot is a full-stack Web Application deployed using a serverless-friendly architecture.
- **Frontend:** React + Vite + TailwindCSS + Framer Motion
- **Backend:** FastAPI (Python)
- **Database:** PostgreSQL (Cloud SQL/Render) + SQLite (Local Dev fallback)
- **Vector Storage:** ChromaDB
- **AI Core:** LangChain + HuggingFace Embeddings + Anthropic Claude 3 Sonnet

## 2. Multi-Agent Orchestration (Simultaneous Execution)
To achieve production readiness and ensure safety, the backend implements a specialized multi-agent routing system:

1. **Router Agent (Topic Classifier):** 
   - Evaluates incoming queries in real-time to assign a topic (PAYROLL, LEAVE, ONBOARDING, etc.).
2. **Compliance & Safety Agent:** 
   - Simultaneously scans the query against restricted semantics (PII extraction attempts, legal disputes, harassment). If tripped, it halts generative responses and triggers an immediate High-Priority Escalation.
3. **Retrieval-Augmented Generation (RAG) Sub-Agent:**
   - Embeds the query using `all-MiniLM-L6-v2`.
   - Searches ChromaDB for the Top-K matching chunks from the tenant's isolated policy PDFs.
   - Generates the answer using Claude 3, strictly bound to the retrieved context.
4. **Action/Webhook Agent:**
   - Operates asynchronously (via FastAPI BackgroundTasks) to trigger Slack/Email alerts to human HR when the Confidence Threshold is breached or a Policy Gap is detected.

## 3. Minimum Full-Stack Implementation Details
### 3.1 Frontend (Vite)
- A highly polished Chat UI with typing indicators and Markdown rendering.
- An Admin Panel with a tuning slider to adjust the global AI Confidence Threshold (0.1 to 0.9).
- The frontend is compiled into a static `/dist` bundle and served directly by the FastAPI backend for a simplified single-container deployment.

### 3.2 Backend (FastAPI)
- **`POST /chat`**: Receives queries, orchestrates the Agents, generates tickets if confidence drops below the threshold, and returns the LLM response with cited sources.
- **`POST /upload`**: Consumes `.pdf` or `.docx` files, processes them through `PyPDFLoader` and `RecursiveCharacterTextSplitter`, and embeds them into ChromaDB.
- **`GET/POST /config`**: Exposes the dynamic threshold values to the Admin Dashboard.

## 4. Deployment Pipeline
The application is validated and fully ready for zero-error deployment.
- **GitHub:** Code is version-controlled with a comprehensive `.gitignore`.
- **Render:** The `render.yaml` blueprint manages the deployment of the Python environment, dependencies, PostgreSQL database connection, and mounts a persistent disk for ChromaDB vector retention.
- **Vercel:** Optional standalone frontend deployment via `vercel.json` utilizing `import.meta.env.VITE_API_URL` to route requests to the Render backend.
