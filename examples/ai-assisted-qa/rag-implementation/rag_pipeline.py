"""
Complete RAG (Retrieval-Augmented Generation) Implementation
For QA Knowledge Base Assistant

This implementation demonstrates a production-ready RAG system that can:
- Ingest documentation from multiple sources
- Answer questions about SDLC, testing, CI/CD practices
- Maintain conversation context
- Provide source citations

Tech Stack:
- LangChain for orchestration
- OpenAI for embeddings and LLM
- Chroma for vector database
- FastAPI for REST API (see api.py)
"""

import os
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
import chromadb
from chromadb.config import Settings
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chat_models import ChatOpenAI
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain.docstore.document import Document
import tiktoken


@dataclass
class RAGConfig:
    """Configuration for RAG pipeline"""
    # OpenAI Configuration
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    embedding_model: str = "text-embedding-3-small"
    llm_model: str = "gpt-4-turbo-preview"
    temperature: float = 0.1

    # Vector Database Configuration
    chroma_persist_directory: str = "./chroma_db"
    collection_name: str = "qa_knowledge_base"

    # Chunking Configuration
    chunk_size: int = 1000
    chunk_overlap: int = 200

    # Retrieval Configuration
    top_k_results: int = 3
    similarity_threshold: float = 0.7

    # Conversation Configuration
    max_history_length: int = 5
    max_tokens: int = 8000


class DocumentProcessor:
    """Handles document ingestion, chunking, and preprocessing"""

    def __init__(self, config: RAGConfig):
        self.config = config
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=config.chunk_size,
            chunk_overlap=config.chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""]
        )
        self.tokenizer = tiktoken.encoding_for_model("gpt-4")

    def load_documents_from_directory(self, directory_path: str) -> List[Document]:
        """
        Load all markdown documents from a directory

        Args:
            directory_path: Path to directory containing .md files

        Returns:
            List of Document objects with content and metadata
        """
        documents = []

        for root, _, files in os.walk(directory_path):
            for file in files:
                if file.endswith('.md'):
                    file_path = os.path.join(root, file)
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()

                        # Extract metadata from path
                        relative_path = os.path.relpath(file_path, directory_path)

                        documents.append(Document(
                            page_content=content,
                            metadata={
                                'source': relative_path,
                                'file_path': file_path,
                                'file_name': file,
                                'tokens': len(self.tokenizer.encode(content))
                            }
                        ))
                    except Exception as e:
                        print(f"Error loading {file_path}: {e}")

        return documents

    def chunk_documents(self, documents: List[Document]) -> List[Document]:
        """
        Split documents into chunks for better retrieval

        Args:
            documents: List of documents to chunk

        Returns:
            List of chunked documents with preserved metadata
        """
        chunked_docs = []

        for doc in documents:
            chunks = self.text_splitter.split_text(doc.page_content)

            for i, chunk in enumerate(chunks):
                chunked_doc = Document(
                    page_content=chunk,
                    metadata={
                        **doc.metadata,
                        'chunk_index': i,
                        'total_chunks': len(chunks)
                    }
                )
                chunked_docs.append(chunked_doc)

        return chunked_docs

    def process_documents(self, directory_path: str) -> List[Document]:
        """
        Complete document processing pipeline

        Args:
            directory_path: Path to documentation directory

        Returns:
            Processed and chunked documents ready for embedding
        """
        print(f"Loading documents from {directory_path}...")
        documents = self.load_documents_from_directory(directory_path)
        print(f"Loaded {len(documents)} documents")

        print("Chunking documents...")
        chunked_docs = self.chunk_documents(documents)
        print(f"Created {len(chunked_docs)} chunks")

        return chunked_docs


class VectorStore:
    """Manages vector database for document embeddings"""

    def __init__(self, config: RAGConfig):
        self.config = config
        self.embeddings = OpenAIEmbeddings(
            model=config.embedding_model,
            openai_api_key=config.openai_api_key
        )

        # Initialize Chroma client
        self.client = chromadb.Client(Settings(
            chroma_db_impl="duckdb+parquet",
            persist_directory=config.chroma_persist_directory
        ))

        self.vectorstore: Optional[Chroma] = None

    def create_vectorstore(self, documents: List[Document]) -> Chroma:
        """
        Create vector store from documents

        Args:
            documents: List of processed documents

        Returns:
            Chroma vector store instance
        """
        print(f"Creating embeddings for {len(documents)} chunks...")

        self.vectorstore = Chroma.from_documents(
            documents=documents,
            embedding=self.embeddings,
            collection_name=self.config.collection_name,
            persist_directory=self.config.chroma_persist_directory
        )

        self.vectorstore.persist()
        print("Vector store created and persisted")

        return self.vectorstore

    def load_vectorstore(self) -> Chroma:
        """
        Load existing vector store from disk

        Returns:
            Chroma vector store instance
        """
        self.vectorstore = Chroma(
            collection_name=self.config.collection_name,
            embedding_function=self.embeddings,
            persist_directory=self.config.chroma_persist_directory
        )

        return self.vectorstore

    def similarity_search(
        self,
        query: str,
        k: int = None
    ) -> List[Tuple[Document, float]]:
        """
        Search for similar documents

        Args:
            query: Search query
            k: Number of results to return

        Returns:
            List of (Document, similarity_score) tuples
        """
        k = k or self.config.top_k_results

        results = self.vectorstore.similarity_search_with_score(
            query=query,
            k=k
        )

        # Filter by similarity threshold
        filtered_results = [
            (doc, score) for doc, score in results
            if score >= self.config.similarity_threshold
        ]

        return filtered_results


class RAGPipeline:
    """Main RAG pipeline orchestrating retrieval and generation"""

    def __init__(self, config: RAGConfig):
        self.config = config

        # Initialize components
        self.llm = ChatOpenAI(
            model_name=config.llm_model,
            temperature=config.temperature,
            openai_api_key=config.openai_api_key
        )

        self.vector_store = VectorStore(config)
        self.conversation_memory: Dict[str, ConversationBufferMemory] = {}

    def initialize_from_documents(self, docs_directory: str):
        """
        Initialize RAG pipeline by ingesting documents

        Args:
            docs_directory: Path to documentation directory
        """
        processor = DocumentProcessor(self.config)
        documents = processor.process_documents(docs_directory)
        self.vector_store.create_vectorstore(documents)

    def load_existing(self):
        """Load existing vector store from disk"""
        self.vector_store.load_vectorstore()

    def get_or_create_memory(self, session_id: str) -> ConversationBufferMemory:
        """
        Get or create conversation memory for a session

        Args:
            session_id: Unique session identifier

        Returns:
            ConversationBufferMemory instance
        """
        if session_id not in self.conversation_memory:
            self.conversation_memory[session_id] = ConversationBufferMemory(
                memory_key="chat_history",
                return_messages=True,
                output_key="answer"
            )

        return self.conversation_memory[session_id]

    def query(
        self,
        question: str,
        session_id: Optional[str] = None
    ) -> Dict[str, any]:
        """
        Query the RAG system

        Args:
            question: User's question
            session_id: Optional session ID for conversation context

        Returns:
            Dictionary containing:
                - answer: Generated response
                - sources: List of source documents
                - confidence: Confidence score
        """
        # Get conversation memory if session provided
        memory = None
        if session_id:
            memory = self.get_or_create_memory(session_id)

        # Create conversational retrieval chain
        qa_chain = ConversationalRetrievalChain.from_llm(
            llm=self.llm,
            retriever=self.vector_store.vectorstore.as_retriever(
                search_kwargs={"k": self.config.top_k_results}
            ),
            memory=memory,
            return_source_documents=True,
            verbose=False
        )

        # Execute query
        result = qa_chain({
            "question": question
        })

        # Extract and format sources
        sources = []
        for doc in result.get('source_documents', []):
            sources.append({
                'content': doc.page_content[:200] + "...",  # Preview
                'source': doc.metadata.get('source', 'Unknown'),
                'file_name': doc.metadata.get('file_name', 'Unknown')
            })

        # Calculate confidence based on source relevance
        confidence = self._calculate_confidence(result.get('source_documents', []))

        return {
            'answer': result['answer'],
            'sources': sources,
            'confidence': confidence,
            'session_id': session_id
        }

    def _calculate_confidence(self, source_docs: List[Document]) -> float:
        """
        Calculate confidence score based on retrieval quality

        Args:
            source_docs: Retrieved source documents

        Returns:
            Confidence score between 0 and 1
        """
        if not source_docs:
            return 0.0

        # Simple heuristic: more sources = higher confidence
        # In production, you'd use actual similarity scores
        num_sources = len(source_docs)

        if num_sources >= 3:
            return 0.9
        elif num_sources == 2:
            return 0.7
        else:
            return 0.5

    def clear_session(self, session_id: str):
        """Clear conversation memory for a session"""
        if session_id in self.conversation_memory:
            del self.conversation_memory[session_id]


# Example usage
if __name__ == "__main__":
    # Configuration
    config = RAGConfig(
        openai_api_key=os.getenv("OPENAI_API_KEY"),
        chunk_size=1000,
        chunk_overlap=200,
        top_k_results=3
    )

    # Initialize RAG pipeline
    rag = RAGPipeline(config)

    # Option 1: Initialize from documents (first time)
    # rag.initialize_from_documents("../../docs")

    # Option 2: Load existing vector store
    rag.load_existing()

    # Query examples
    questions = [
        "What is test-driven development?",
        "How do I set up CI/CD pipeline?",
        "What are DORA metrics?",
        "What is the difference between unit and integration tests?"
    ]

    session_id = "demo-session-1"

    for question in questions:
        print(f"\nQ: {question}")
        result = rag.query(question, session_id=session_id)
        print(f"A: {result['answer']}")
        print(f"Confidence: {result['confidence']}")
        print(f"Sources: {[s['file_name'] for s in result['sources']]}")
        print("-" * 80)
