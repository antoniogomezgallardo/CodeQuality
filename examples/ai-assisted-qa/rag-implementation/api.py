"""
FastAPI REST API for RAG QA Assistant

Provides HTTP endpoints for:
- Querying the knowledge base
- Managing conversation sessions
- Document ingestion
- Health checks

Run with: uvicorn api:app --reload
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
import uuid
from datetime import datetime
import logging

from rag_pipeline import RAGPipeline, RAGConfig

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="QA Knowledge Base API",
    description="RAG-powered assistant for SDLC, testing, and CI/CD questions",
    version="1.0.0"
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global RAG pipeline instance
rag_pipeline: Optional[RAGPipeline] = None


# Request/Response Models
class QueryRequest(BaseModel):
    """Request model for queries"""
    question: str = Field(..., min_length=1, max_length=1000)
    session_id: Optional[str] = None
    include_sources: bool = True

    class Config:
        json_schema_extra = {
            "example": {
                "question": "What is test-driven development?",
                "session_id": "user-123-session-456",
                "include_sources": True
            }
        }


class Source(BaseModel):
    """Source document information"""
    content: str
    source: str
    file_name: str


class QueryResponse(BaseModel):
    """Response model for queries"""
    answer: str
    sources: List[Source]
    confidence: float
    session_id: Optional[str]
    timestamp: str

    class Config:
        json_schema_extra = {
            "example": {
                "answer": "Test-driven development (TDD) is a software development approach...",
                "sources": [
                    {
                        "content": "TDD is a practice where you write tests before code...",
                        "source": "docs/04-testing-strategy/04-README.md",
                        "file_name": "04-README.md"
                    }
                ],
                "confidence": 0.9,
                "session_id": "user-123-session-456",
                "timestamp": "2024-10-15T10:30:00Z"
            }
        }


class SessionRequest(BaseModel):
    """Request to create a new session"""
    user_id: Optional[str] = None


class SessionResponse(BaseModel):
    """Response with session information"""
    session_id: str
    created_at: str


class IngestRequest(BaseModel):
    """Request to ingest new documents"""
    docs_directory: str


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    version: str
    vectorstore_ready: bool
    timestamp: str


# Startup/Shutdown Events
@app.on_event("startup")
async def startup_event():
    """Initialize RAG pipeline on startup"""
    global rag_pipeline

    try:
        logger.info("Initializing RAG pipeline...")
        config = RAGConfig()
        rag_pipeline = RAGPipeline(config)

        # Try to load existing vector store
        try:
            rag_pipeline.load_existing()
            logger.info("Loaded existing vector store")
        except Exception as e:
            logger.warning(f"Could not load vector store: {e}")
            logger.info("Vector store will be created on first ingestion")

    except Exception as e:
        logger.error(f"Failed to initialize RAG pipeline: {e}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down RAG API")


# API Endpoints
@app.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint with API information"""
    return {
        "message": "QA Knowledge Base API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy" if rag_pipeline else "initializing",
        version="1.0.0",
        vectorstore_ready=rag_pipeline.vector_store.vectorstore is not None if rag_pipeline else False,
        timestamp=datetime.utcnow().isoformat()
    )


@app.post("/query", response_model=QueryResponse)
async def query_knowledge_base(request: QueryRequest):
    """
    Query the knowledge base

    Args:
        request: QueryRequest with question and optional session_id

    Returns:
        QueryResponse with answer, sources, and confidence

    Raises:
        HTTPException: If RAG pipeline not initialized or query fails
    """
    if not rag_pipeline:
        raise HTTPException(status_code=503, detail="RAG pipeline not initialized")

    if not rag_pipeline.vector_store.vectorstore:
        raise HTTPException(
            status_code=503,
            detail="Vector store not ready. Please ingest documents first."
        )

    try:
        logger.info(f"Processing query: {request.question[:50]}...")

        result = rag_pipeline.query(
            question=request.question,
            session_id=request.session_id
        )

        # Convert to response model
        sources = [Source(**source) for source in result['sources']] if request.include_sources else []

        return QueryResponse(
            answer=result['answer'],
            sources=sources,
            confidence=result['confidence'],
            session_id=result.get('session_id'),
            timestamp=datetime.utcnow().isoformat()
        )

    except Exception as e:
        logger.error(f"Query failed: {e}")
        raise HTTPException(status_code=500, detail=f"Query processing failed: {str(e)}")


@app.post("/session", response_model=SessionResponse)
async def create_session(request: SessionRequest):
    """
    Create a new conversation session

    Args:
        request: SessionRequest with optional user_id

    Returns:
        SessionResponse with session_id
    """
    session_id = f"{request.user_id or 'anonymous'}-{uuid.uuid4().hex[:8]}"

    return SessionResponse(
        session_id=session_id,
        created_at=datetime.utcnow().isoformat()
    )


@app.delete("/session/{session_id}")
async def clear_session(session_id: str):
    """
    Clear conversation history for a session

    Args:
        session_id: Session identifier

    Returns:
        Success message
    """
    if not rag_pipeline:
        raise HTTPException(status_code=503, detail="RAG pipeline not initialized")

    try:
        rag_pipeline.clear_session(session_id)
        return {"message": f"Session {session_id} cleared", "timestamp": datetime.utcnow().isoformat()}
    except Exception as e:
        logger.error(f"Failed to clear session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ingest")
async def ingest_documents(request: IngestRequest, background_tasks: BackgroundTasks):
    """
    Ingest documents into the knowledge base (background task)

    Args:
        request: IngestRequest with docs_directory path
        background_tasks: FastAPI background tasks

    Returns:
        Acceptance message (processing happens in background)
    """
    if not rag_pipeline:
        raise HTTPException(status_code=503, detail="RAG pipeline not initialized")

    def ingest_task():
        """Background task for document ingestion"""
        try:
            logger.info(f"Starting document ingestion from {request.docs_directory}")
            rag_pipeline.initialize_from_documents(request.docs_directory)
            logger.info("Document ingestion completed")
        except Exception as e:
            logger.error(f"Document ingestion failed: {e}")

    background_tasks.add_task(ingest_task)

    return {
        "message": "Document ingestion started",
        "docs_directory": request.docs_directory,
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/stats")
async def get_stats():
    """
    Get statistics about the knowledge base

    Returns:
        Dictionary with knowledge base statistics
    """
    if not rag_pipeline or not rag_pipeline.vector_store.vectorstore:
        raise HTTPException(status_code=503, detail="Vector store not ready")

    try:
        collection = rag_pipeline.vector_store.vectorstore._collection
        count = collection.count()

        return {
            "total_chunks": count,
            "active_sessions": len(rag_pipeline.conversation_memory),
            "embedding_model": rag_pipeline.config.embedding_model,
            "llm_model": rag_pipeline.config.llm_model,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to get stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Error handlers
@app.exception_handler(ValueError)
async def value_error_handler(request, exc):
    """Handle ValueError exceptions"""
    return HTTPException(status_code=400, detail=str(exc))


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception: {exc}")
    return HTTPException(status_code=500, detail="Internal server error")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
