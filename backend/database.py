from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./hrbot.db")

# Automatically switch to asyncpg if postgres is detected
if DATABASE_URL.startswith("postgres://") or DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

if DATABASE_URL.startswith("sqlite"):
    engine = create_async_engine(
        DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    engine = create_async_engine(DATABASE_URL)

AsyncSessionLocal = sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(String, primary_key=True, index=True)
    employee = Column(String, index=True)
    topic = Column(String, index=True)
    status = Column(String, default="open")
    priority = Column(String, default="medium")
    description = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class DocumentLog(Base):
    __tablename__ = "document_logs"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    chunks_indexed = Column(Integer)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

