# RAG Implementation for QA Knowledge Base

Complete production-ready implementation of a Retrieval-Augmented Generation (RAG) system for answering questions about software quality assurance, testing, and CI/CD practices.

## Architecture

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│                      FastAPI REST API                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Query      │  │   Session    │  │   Ingest     │      │
│  │  Endpoint    │  │  Management  │  │  Endpoint    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                     RAG Pipeline                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  1. Document Processing                                 │ │
│  │     - Load markdown files                               │ │
│  │     - Chunk into optimal sizes                          │ │
│  │     - Extract metadata                                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                  │
│                           ▼                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  2. Vector Store (Chroma)                               │ │
│  │     - Generate embeddings (OpenAI)                      │ │
│  │     - Store vectors with metadata                       │ │
│  │     - Similarity search                                 │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                  │
│                           ▼                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  3. LLM Generation (GPT-4)                              │ │
│  │     - Retrieve relevant context                         │ │
│  │     - Maintain conversation history                     │ │
│  │     - Generate response with citations                  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Features

✅ **Document Ingestion**: Automatically process markdown documentation
✅ **Smart Chunking**: Optimal document splitting with overlap
✅ **Semantic Search**: Vector-based similarity search
✅ **Conversation Memory**: Context-aware multi-turn conversations
✅ **Source Citations**: Every answer includes source references
✅ **REST API**: Production-ready FastAPI endpoints
✅ **Session Management**: Handle multiple concurrent users
✅ **Confidence Scoring**: Quality indicators for responses
✅ **Background Processing**: Non-blocking document ingestion

## Quick Start

### Prerequisites

- Python 3.9+
- OpenAI API key
- Documentation directory (markdown files)

### Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

### Initialize Vector Store

```python
from rag_pipeline import RAGPipeline, RAGConfig

# Configure
config = RAGConfig(
    openai_api_key="your-api-key",
    chunk_size=1000,
    chunk_overlap=200,
    top_k_results=3
)

# Initialize and ingest documents
rag = RAGPipeline(config)
rag.initialize_from_documents("../../docs")  # Path to your docs
```

### Start API Server

```bash
# Start FastAPI server
uvicorn api:app --reload --host 0.0.0.0 --port 8000

# API will be available at http://localhost:8000
# Interactive docs at http://localhost:8000/docs
```

## API Usage

### Query Endpoint

**Request:**
```bash
curl -X POST "http://localhost:8000/query" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is test-driven development?",
    "session_id": "user-123",
    "include_sources": true
  }'
```

**Response:**
```json
{
  "answer": "Test-driven development (TDD) is a software development approach where you write tests before writing the actual code. The cycle follows: 1) Write a failing test, 2) Write minimal code to pass the test, 3) Refactor the code while keeping tests green.",
  "sources": [
    {
      "content": "TDD is a practice where tests are written first...",
      "source": "docs/04-testing-strategy/04-README.md",
      "file_name": "04-README.md"
    }
  ],
  "confidence": 0.9,
  "session_id": "user-123",
  "timestamp": "2024-10-15T10:30:00Z"
}
```

### Create Session

```bash
curl -X POST "http://localhost:8000/session" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "john.doe"}'
```

### Clear Session

```bash
curl -X DELETE "http://localhost:8000/session/user-123"
```

### Ingest Documents (Background)

```bash
curl -X POST "http://localhost:8000/ingest" \
  -H "Content-Type: application/json" \
  -d '{"docs_directory": "/path/to/docs"}'
```

### Get Stats

```bash
curl "http://localhost:8000/stats"
```

## Python Client Usage

```python
from rag_pipeline import RAGPipeline, RAGConfig

# Initialize
config = RAGConfig()
rag = RAGPipeline(config)
rag.load_existing()  # Load pre-built vector store

# Single query
result = rag.query("How do I implement CI/CD?")
print(result['answer'])
print(f"Confidence: {result['confidence']}")

# Conversational queries (with context)
session_id = "demo-session"

result1 = rag.query("What are DORA metrics?", session_id=session_id)
print(result1['answer'])

# Follow-up question uses previous context
result2 = rag.query("How can I improve them?", session_id=session_id)
print(result2['answer'])

# Clear conversation
rag.clear_session(session_id)
```

## Configuration Options

### RAGConfig Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `openai_api_key` | env var | OpenAI API key |
| `embedding_model` | `text-embedding-3-small` | Embedding model |
| `llm_model` | `gpt-4-turbo-preview` | LLM for generation |
| `temperature` | `0.1` | LLM temperature (0-1) |
| `chunk_size` | `1000` | Document chunk size |
| `chunk_overlap` | `200` | Overlap between chunks |
| `top_k_results` | `3` | Results to retrieve |
| `similarity_threshold` | `0.7` | Min similarity score |
| `max_history_length` | `5` | Conversation turns to keep |
| `max_tokens` | `8000` | Max tokens per response |

### Customization Examples

**Use Different Models:**
```python
config = RAGConfig(
    embedding_model="text-embedding-3-large",  # More accurate
    llm_model="gpt-3.5-turbo",                 # Faster, cheaper
)
```

**Tune Retrieval:**
```python
config = RAGConfig(
    chunk_size=500,            # Smaller chunks
    top_k_results=5,           # More context
    similarity_threshold=0.6,  # More lenient
)
```

**Use Local LLM:**
```python
from langchain.llms import Ollama

# Replace OpenAI LLM with local Ollama
llm = Ollama(model="llama2")
rag.llm = llm
```

## Performance Optimization

### 1. Embedding Caching

```python
# Cache embeddings for faster repeated queries
from langchain.embeddings import CacheBackedEmbeddings
from langchain.storage import LocalFileStore

store = LocalFileStore("./embedding_cache")
cached_embeddings = CacheBackedEmbeddings.from_bytes_store(
    underlying_embeddings=OpenAIEmbeddings(),
    document_embedding_cache=store,
    namespace="qa_docs"
)
```

### 2. Batch Processing

```python
# Process documents in batches
processor = DocumentProcessor(config)
documents = processor.load_documents_from_directory("docs")

batch_size = 100
for i in range(0, len(documents), batch_size):
    batch = documents[i:i+batch_size]
    vector_store.add_documents(batch)
```

### 3. Index Optimization

```python
# Use approximate nearest neighbors for large datasets
vector_store = Chroma(
    collection_metadata={"hnsw:space": "cosine", "hnsw:M": 16}
)
```

## Testing

```bash
# Run unit tests
pytest tests/

# Run with coverage
pytest --cov=. tests/

# Test API endpoints
pytest tests/test_api.py -v
```

## Cost Estimation

### Ingestion Costs (One-time)

Assuming 100 markdown files, 500KB total:

```yaml
Embedding Generation:
  - Model: text-embedding-3-small
  - Tokens: ~125,000 (500KB text)
  - Cost: $0.001 per 1K tokens
  - Total: ~$0.13

Vector Storage:
  - Chroma: Free (local)
  - Cloud: ~$10-20/month (Pinecone)
```

### Query Costs (Per 1000 queries)

```yaml
Retrieval:
  - Embedding query: ~$0.01
  - Vector search: Free (local)

Generation:
  - Model: gpt-4-turbo-preview
  - Input: ~1,500 tokens (context)
  - Output: ~300 tokens (answer)
  - Cost: $0.01 input + $0.03 output per 1K tokens
  - Per query: ~$0.024
  - Per 1000 queries: ~$24

Total: ~$24-25 per 1000 queries
```

### Cost Reduction Strategies

1. **Use GPT-3.5-turbo**: ~10x cheaper ($2.50 per 1000 queries)
2. **Cache common queries**: Redis cache for frequent questions
3. **Use smaller embeddings**: text-embedding-3-small vs large
4. **Implement rate limiting**: Prevent abuse
5. **Local LLM option**: Ollama/Llama for sensitive data (free)

## Security Best Practices

### 1. API Key Management

```python
# Use environment variables
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
```

### 2. Input Validation

```python
from pydantic import validator

class QueryRequest(BaseModel):
    question: str

    @validator('question')
    def validate_question(cls, v):
        if len(v) > 1000:
            raise ValueError("Question too long")
        if not v.strip():
            raise ValueError("Question cannot be empty")
        return v
```

### 3. Rate Limiting

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/query")
@limiter.limit("10/minute")
async def query_endpoint(request: QueryRequest):
    ...
```

### 4. Sensitive Data Handling

```python
# Don't log sensitive queries
logger.info(f"Processing query: {request.question[:50]}...")  # Truncate

# Sanitize before sending to OpenAI
def sanitize_query(query: str) -> str:
    # Remove emails, IPs, API keys
    import re
    query = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL]', query)
    return query
```

## Monitoring & Observability

### Add Logging

```python
import structlog

logger = structlog.get_logger()

@app.post("/query")
async def query_endpoint(request: QueryRequest):
    logger.info(
        "query_received",
        question_length=len(request.question),
        session_id=request.session_id,
        timestamp=datetime.utcnow()
    )
    ...
```

### Track Metrics

```python
from prometheus_client import Counter, Histogram

query_counter = Counter('rag_queries_total', 'Total queries')
response_time = Histogram('rag_response_seconds', 'Response time')

@app.post("/query")
async def query_endpoint(request: QueryRequest):
    query_counter.inc()
    with response_time.time():
        result = rag.query(request.question)
    return result
```

## Troubleshooting

### Common Issues

**Issue: "Vector store not ready"**
```bash
# Solution: Ingest documents first
curl -X POST "http://localhost:8000/ingest" \
  -H "Content-Type: application/json" \
  -d '{"docs_directory": "../../docs"}'
```

**Issue: "OpenAI API key not found"**
```bash
# Solution: Set environment variable
export OPENAI_API_KEY="sk-..."
```

**Issue: "Out of memory during ingestion"**
```python
# Solution: Process in smaller batches
config = RAGConfig(chunk_size=500, batch_size=50)
```

**Issue: "Poor answer quality"**
```python
# Solution: Tune retrieval parameters
config = RAGConfig(
    top_k_results=5,           # More context
    chunk_overlap=300,         # More overlap
    temperature=0.0,           # More deterministic
)
```

## Production Deployment

### Docker Deployment

See `docker-compose.yml` for complete setup with Redis caching and monitoring.

### Environment Variables

```bash
# .env file
OPENAI_API_KEY=sk-...
CHROMA_PERSIST_DIRECTORY=/app/data/chroma
LOG_LEVEL=INFO
MAX_WORKERS=4
```

### Health Checks

```yaml
# docker-compose.yml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

## Next Steps

1. **Add More Data Sources**: Integrate GitHub issues, Slack conversations, Jira tickets
2. **Improve Retrieval**: Implement hybrid search (keyword + semantic)
3. **Add Feedback Loop**: Let users rate answers to improve quality
4. **Multi-Language Support**: Add support for different programming languages
5. **Advanced Features**: Question decomposition, multi-hop reasoning

## Related Documentation

- [AI Fundamentals](../../../docs/15-ai-in-quality-assurance/ai-fundamentals.md)
- [Building AI QA Assistant](../../../docs/15-ai-in-quality-assurance/building-ai-qa-assistant.md)
- [AI Tool Evaluation Template](../../../templates/ai-tool-evaluation.md)

## License

MIT License - See LICENSE file for details
