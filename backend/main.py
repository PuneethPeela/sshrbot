import os
import uuid
import tempfile
import asyncio
from typing import List, Optional, Dict
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from dotenv import load_dotenv

# Database
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import AsyncSessionLocal, Ticket, DocumentLog, engine, Base
from security import verify_firebase_token

# Langchain and RAG
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_anthropic import ChatAnthropic
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate

load_dotenv()

app = FastAPI(title="HRBot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize DB asynchronously
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# Dependency
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

class ChatRequest(BaseModel):
    query: str
    employee_id: str
    employee_name: str

class ChatResponse(BaseModel):
    answer: str
    confidence: float
    topic: str
    ticket_id: Optional[str] = None
    sources: List[str] = []
    policy_gap: bool = False

class ConfigUpdate(BaseModel):
    confidence_threshold: float

# App State Configuration
app_config = {
    "confidence_threshold": 0.6
}

# --- AI Setup ---
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
vectorstore = Chroma(persist_directory="./chroma_db", embedding_function=embeddings)

def get_llm():
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return None
    return ChatAnthropic(model_name="claude-3-sonnet-20240229", anthropic_api_key=api_key)

# Topic Classification Prompt
async def async_classify_topic(query: str) -> str:
    # Simulating an async agent
    await asyncio.sleep(0.01)
    query = query.lower()
    if any(word in query for word in ["salary", "pay", "payslip", "deduction", "reimbursement", "form 16"]):
        return "PAYROLL"
    if any(word in query for word in ["leave", "sick", "casual", "maternity", "lop", "holiday", "balance"]):
        return "LEAVE"
    if any(word in query for word in ["join", "onboard", "document", "probation", "first day"]):
        return "ONBOARDING"
    if any(word in query for word in ["conduct", "dress", "posh", "travel", "wfh", "policy"]):
        return "POLICY"
    if any(word in query for word in ["insurance", "health", "gratuity", "nps", "meal", "stock", "benefits"]):
        return "BENEFITS"
    return "GENERAL"

async def async_is_sensitive(query: str) -> bool:
    # Simulating an async compliance agent
    await asyncio.sleep(0.01)
    sensitive_words = ["harassment", "termination", "sue", "legal", "lawyer", "quit", "resign", "dispute", "discriminated"]
    return any(word in query.lower() for word in sensitive_words)

# Mock Slack/Email Webhook
def trigger_escalation_webhook(ticket_id: str, topic: str, employee_name: str, priority: str):
    import time
    time.sleep(1) # Simulate network call
    print(f"[WEBHOOK FIRED] 🚀 Slack Alert: New {priority.upper()} Priority Escalation from {employee_name} regarding {topic}. Ticket ID: {ticket_id}")

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db), user: dict = Depends(verify_firebase_token)):
    
    # 1. Execute multiple agents SIMULTANEOUSLY for high-performance orchestration
    topic_task = asyncio.create_task(async_classify_topic(request.query))
    compliance_task = asyncio.create_task(async_is_sensitive(request.query))
    
    # Await both agents concurrently
    topic, is_query_sensitive = await asyncio.gather(topic_task, compliance_task)
    
    answer = ""
    confidence = 0.9  # Mock confidence for MVP
    sources = []
    policy_gap = False
    
    llm = get_llm()
    
    if is_query_sensitive:
        confidence = 0.4
        answer = "This sounds like a sensitive issue that requires direct HR attention."
    elif not llm:
        # Fallback Mock if no API Key
        answer = f"I am currently in offline mode. I would have searched the policy for '{request.query}' and answered it."
        confidence = 0.8
    else:
        # Real RAG implementation
        prompt_template = f"""You are HRBot, an intelligent HR Helpdesk Assistant for Promtal HR.
        You are professional but warm. Speak like a helpful HR colleague. Address the employee as {request.employee_name}.
        
        LEGAL AND SAFETY BOUNDARIES:
        1. NEVER provide legal advice. If a query requires legal interpretation, advise consulting an employment lawyer.
        2. DO NOT discuss the compensation or personal data of other employees.
        3. Protect employee privacy (PII). Be objective and neutral in your responses.
        4. Answer the following question using ONLY the provided context. If you are unsure or the context doesn't have the answer, say "I don't have enough information from the policies to answer that."
        
        Context: {{context}}
        Question: {{question}}
        
        Helpful Answer:"""
        PROMPT = PromptTemplate(template=prompt_template, input_variables=["context", "question"])
        
        chain_type_kwargs = {{"prompt": PROMPT}}
        qa = RetrievalQA.from_chain_type(
            llm=llm, 
            chain_type="stuff", 
            retriever=vectorstore.as_retriever(search_kwargs={"k": 3}),
            return_source_documents=True,
            chain_type_kwargs=chain_type_kwargs
        )
        
        res = qa({"query": request.query})
        answer = res['result']
        
        # Check if the LLM couldn't find the answer (Policy Gap Detection)
        policy_gap = False
        if "I don't have enough information" in answer:
            confidence = 0.4
            policy_gap = True
            
        for doc in res['source_documents']:
            source_name = doc.metadata.get('source', 'Unknown Policy')
            if source_name not in sources:
                sources.append(source_name)

    ticket_id = None
    
    # Escalation Logic (Confidence threshold based on admin tuning)
    threshold = app_config["confidence_threshold"]
    if confidence < threshold or "speak to hr" in request.query.lower():
        ticket_id = f"TKT-{str(uuid.uuid4())[:8].upper()}"
        escalation_msg = f"I'm connecting you with the HR team for this. Your ticket ID is {ticket_id}. The HR team will review your query and get back within 1 business day."
        
        answer = answer + " " + escalation_msg
        priority = "high" if is_query_sensitive or topic == "PAYROLL" else "medium"
        
        if policy_gap:
            topic = "POLICY_GAP" # Flag specially for the HR dashboard
        
        db_ticket = Ticket(
            id=ticket_id,
            employee=request.employee_name,
            topic=topic,
            status="open",
            priority=priority,
            description=request.query
        )
        db.add(db_ticket)
        await db.commit()
        
        # Trigger async webhook notification
        background_tasks.add_task(trigger_escalation_webhook, ticket_id, topic, request.employee_name, priority)

    return ChatResponse(
        answer=answer,
        confidence=confidence,
        topic=topic,
        ticket_id=ticket_id,
        sources=sources,
        policy_gap=policy_gap
    )

@app.post("/upload")
async def upload_document(file: UploadFile = File(...), db: AsyncSession = Depends(get_db), user: dict = Depends(verify_firebase_token)):
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        # Load and chunk PDF
        loader = PyPDFLoader(tmp_path)
        documents = loader.load()
        
        # Add metadata source
        for doc in documents:
            doc.metadata['source'] = file.filename

        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        chunks = text_splitter.split_documents(documents)
        
        # Store in Chroma
        vectorstore.add_documents(chunks)
        vectorstore.persist()
        
        # Log to DB
        doc_log = DocumentLog(
            filename=file.filename,
            chunks_indexed=len(chunks)
        )
        db.add(doc_log)
        await db.commit()
        
        return {"filename": file.filename, "status": "processed", "chunks_indexed": len(chunks)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        os.remove(tmp_path)

@app.get("/tickets")
async def get_tickets(db: AsyncSession = Depends(get_db), user: dict = Depends(verify_firebase_token)):
    result = await db.execute(select(Ticket).order_by(Ticket.created_at.desc()))
    tickets = result.scalars().all()
    return tickets

@app.get("/config")
async def get_config(user: dict = Depends(verify_firebase_token)):
    return app_config

@app.post("/config")
async def update_config(config: ConfigUpdate, user: dict = Depends(verify_firebase_token)):
    app_config["confidence_threshold"] = config.confidence_threshold
    return app_config

# Serve Frontend Static Files
app.mount("/", StaticFiles(directory="../frontend/dist", html=True), name="frontend")

@app.exception_handler(404)
async def not_found(request, exc):
    return FileResponse("../frontend/dist/index.html")

