from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import os
import asyncio
import logging
from datetime import datetime
import json

# AI and ML imports
import openai
from langchain.chat_models import ChatOpenAI
from langchain.memory import ConversationBufferMemory
from langchain.schema import HumanMessage, AIMessage
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Pinecone
import pinecone

# Database imports
from motor.motor_asyncio import AsyncIOMotorClient
import redis.asyncio as redis

# Monitoring and logging
from prometheus_client import Counter, Histogram, generate_latest
import structlog

# Initialize FastAPI app
app = FastAPI(
    title="SMILE AI Service",
    description="AI Agent Management and Conversation Service",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = structlog.get_logger()

# Security
security = HTTPBearer()

# Metrics
REQUEST_COUNT = Counter('ai_requests_total', 'Total AI requests', ['method', 'endpoint'])
REQUEST_DURATION = Histogram('ai_request_duration_seconds', 'AI request duration')
CONVERSATION_COUNT = Counter('conversations_total', 'Total conversations')
TRAINING_COUNT = Counter('training_jobs_total', 'Total training jobs', ['status'])

# Configuration
class Config:
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
    PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
    PINECONE_ENVIRONMENT = os.getenv("PINECONE_ENVIRONMENT")
    MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017/smile_ai")
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
    JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")

config = Config()

# Initialize external services
openai.api_key = config.OPENAI_API_KEY

# Initialize Pinecone
if config.PINECONE_API_KEY:
    pinecone.init(
        api_key=config.PINECONE_API_KEY,
        environment=config.PINECONE_ENVIRONMENT
    )

# Database connections
mongodb_client = AsyncIOMotorClient(config.MONGODB_URL)
db = mongodb_client.smile_ai
redis_client = redis.from_url(config.REDIS_URL)

# Pydantic models
class AIPersonality(BaseModel):
    tone: str = Field(..., description="The tone of the AI agent")
    expertise: List[str] = Field(..., description="Areas of expertise")
    response_style: str = Field(..., description="Response style")
    language_style: str = Field(..., description="Language style")
    template_id: Optional[str] = None

class AICapabilities(BaseModel):
    conversation: bool = True
    content_creation: bool = False
    recommendations: bool = False
    customer_service: bool = False
    data_analysis: bool = False
    custom_capabilities: List[str] = []

class AIAgentConfig(BaseModel):
    agent_id: str
    name: str
    creator_id: str
    personality: AIPersonality
    capabilities: AICapabilities
    system_prompt: Optional[str] = None
    max_context_length: int = 4000
    temperature: float = 0.7
    max_tokens: int = 1000

class ConversationMessage(BaseModel):
    role: str = Field(..., description="Role: user, assistant, or system")
    content: str = Field(..., description="Message content")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = {}

class ChatRequest(BaseModel):
    agent_id: str
    message: str
    conversation_id: Optional[str] = None
    user_id: str
    context: Dict[str, Any] = {}

class ChatResponse(BaseModel):
    message: str
    conversation_id: str
    timestamp: datetime
    metadata: Dict[str, Any] = {}

class TrainingRequest(BaseModel):
    agent_id: str
    training_data: List[Dict[str, Any]]
    training_type: str = "conversation"  # conversation, documents, examples
    
class TrainingResponse(BaseModel):
    job_id: str
    status: str
    message: str

# AI Agent Management
class AIAgentManager:
    def __init__(self):
        self.agents = {}
        self.embeddings = OpenAIEmbeddings() if config.OPENAI_API_KEY else None
        
    async def create_agent(self, config: AIAgentConfig) -> Dict[str, Any]:
        """Create a new AI agent"""
        try:
            # Store agent configuration in database
            agent_doc = {
                "agent_id": config.agent_id,
                "name": config.name,
                "creator_id": config.creator_id,
                "personality": config.personality.dict(),
                "capabilities": config.capabilities.dict(),
                "system_prompt": self._generate_system_prompt(config),
                "config": config.dict(),
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "status": "active"
            }
            
            result = await db.ai_agents.insert_one(agent_doc)
            
            # Initialize agent in memory
            self.agents[config.agent_id] = {
                "config": config,
                "memory": ConversationBufferMemory(return_messages=True),
                "chat_model": ChatOpenAI(
                    temperature=config.temperature,
                    max_tokens=config.max_tokens,
                    model="gpt-3.5-turbo"
                )
            }
            
            logger.info(f"Created AI agent: {config.agent_id}")
            return {"agent_id": config.agent_id, "status": "created"}
            
        except Exception as e:
            logger.error(f"Error creating agent: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to create agent: {str(e)}")
    
    def _generate_system_prompt(self, config: AIAgentConfig) -> str:
        """Generate system prompt based on agent configuration"""
        personality = config.personality
        capabilities = config.capabilities
        
        prompt = f"""You are {config.name}, an AI agent with the following characteristics:

Personality:
- Tone: {personality.tone}
- Expertise: {', '.join(personality.expertise)}
- Response Style: {personality.response_style}
- Language Style: {personality.language_style}

Capabilities:
"""
        
        if capabilities.conversation:
            prompt += "- Engage in natural conversations\n"
        if capabilities.content_creation:
            prompt += "- Create engaging content\n"
        if capabilities.recommendations:
            prompt += "- Provide personalized recommendations\n"
        if capabilities.customer_service:
            prompt += "- Assist with customer service inquiries\n"
        if capabilities.data_analysis:
            prompt += "- Analyze and interpret data\n"
        
        prompt += """
Important: You must ALWAYS identify yourself as an AI agent. Never pretend to be human.
Be helpful, harmless, and honest in all interactions.
If asked about topics outside your expertise, politely redirect or admit limitations.
"""
        
        return prompt
    
    async def get_agent(self, agent_id: str) -> Optional[Dict[str, Any]]:
        """Get agent configuration from database"""
        agent = await db.ai_agents.find_one({"agent_id": agent_id})
        return agent
    
    async def chat_with_agent(self, request: ChatRequest) -> ChatResponse:
        """Process chat request with AI agent"""
        try:
            REQUEST_COUNT.labels(method="POST", endpoint="/chat").inc()
            
            # Get agent configuration
            agent = await self.get_agent(request.agent_id)
            if not agent:
                raise HTTPException(status_code=404, detail="AI agent not found")
            
            # Get or create conversation
            conversation_id = request.conversation_id or f"conv_{request.user_id}_{request.agent_id}_{int(datetime.utcnow().timestamp())}"
            
            # Load conversation history
            conversation_history = await self._load_conversation_history(conversation_id)
            
            # Prepare messages for the chat model
            messages = []
            
            # Add system prompt
            messages.append({"role": "system", "content": agent["system_prompt"]})
            
            # Add conversation history
            for msg in conversation_history[-10:]:  # Last 10 messages for context
                messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })
            
            # Add current user message
            messages.append({"role": "user", "content": request.message})
            
            # Generate AI response
            response = await openai.ChatCompletion.acreate(
                model="gpt-3.5-turbo",
                messages=messages,
                temperature=agent["config"]["temperature"],
                max_tokens=agent["config"]["max_tokens"]
            )
            
            ai_message = response.choices[0].message.content
            
            # Save conversation messages
            await self._save_conversation_messages(conversation_id, [
                {
                    "role": "user",
                    "content": request.message,
                    "timestamp": datetime.utcnow(),
                    "user_id": request.user_id
                },
                {
                    "role": "assistant",
                    "content": ai_message,
                    "timestamp": datetime.utcnow(),
                    "agent_id": request.agent_id
                }
            ])
            
            CONVERSATION_COUNT.inc()
            
            return ChatResponse(
                message=ai_message,
                conversation_id=conversation_id,
                timestamp=datetime.utcnow(),
                metadata={
                    "agent_id": request.agent_id,
                    "model": "gpt-3.5-turbo",
                    "tokens_used": response.usage.total_tokens
                }
            )
            
        except Exception as e:
            logger.error(f"Error in chat: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")
    
    async def _load_conversation_history(self, conversation_id: str) -> List[Dict[str, Any]]:
        """Load conversation history from database"""
        cursor = db.conversations.find(
            {"conversation_id": conversation_id}
        ).sort("timestamp", 1)
        
        messages = []
        async for doc in cursor:
            messages.extend(doc.get("messages", []))
        
        return messages
    
    async def _save_conversation_messages(self, conversation_id: str, messages: List[Dict[str, Any]]):
        """Save conversation messages to database"""
        doc = {
            "conversation_id": conversation_id,
            "messages": messages,
            "timestamp": datetime.utcnow()
        }
        
        await db.conversations.insert_one(doc)
    
    async def train_agent(self, request: TrainingRequest) -> TrainingResponse:
        """Train AI agent with custom data"""
        try:
            job_id = f"train_{request.agent_id}_{int(datetime.utcnow().timestamp())}"
            
            # Store training job
            training_job = {
                "job_id": job_id,
                "agent_id": request.agent_id,
                "training_data": request.training_data,
                "training_type": request.training_type,
                "status": "queued",
                "created_at": datetime.utcnow()
            }
            
            await db.training_jobs.insert_one(training_job)
            
            # Queue training job (in production, use a proper job queue like Celery)
            asyncio.create_task(self._process_training_job(job_id))
            
            TRAINING_COUNT.labels(status="queued").inc()
            
            return TrainingResponse(
                job_id=job_id,
                status="queued",
                message="Training job queued successfully"
            )
            
        except Exception as e:
            logger.error(f"Error queuing training job: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Training error: {str(e)}")
    
    async def _process_training_job(self, job_id: str):
        """Process training job (background task)"""
        try:
            # Update job status
            await db.training_jobs.update_one(
                {"job_id": job_id},
                {"$set": {"status": "processing", "started_at": datetime.utcnow()}}
            )
            
            # Get training job details
            job = await db.training_jobs.find_one({"job_id": job_id})
            if not job:
                return
            
            # Process training data (simplified implementation)
            # In production, this would involve fine-tuning or vector embedding
            await asyncio.sleep(10)  # Simulate training time
            
            # Update agent with training results
            await db.ai_agents.update_one(
                {"agent_id": job["agent_id"]},
                {
                    "$set": {
                        "last_trained": datetime.utcnow(),
                        "training_status": "completed"
                    }
                }
            )
            
            # Mark job as completed
            await db.training_jobs.update_one(
                {"job_id": job_id},
                {
                    "$set": {
                        "status": "completed",
                        "completed_at": datetime.utcnow()
                    }
                }
            )
            
            TRAINING_COUNT.labels(status="completed").inc()
            logger.info(f"Training job completed: {job_id}")
            
        except Exception as e:
            logger.error(f"Training job failed: {str(e)}")
            await db.training_jobs.update_one(
                {"job_id": job_id},
                {
                    "$set": {
                        "status": "failed",
                        "error": str(e),
                        "failed_at": datetime.utcnow()
                    }
                }
            )
            TRAINING_COUNT.labels(status="failed").inc()

# Initialize AI Agent Manager
agent_manager = AIAgentManager()

# Auth dependency
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Validate JWT token and get current user"""
    # In production, implement proper JWT validation
    return {"user_id": "test_user", "role": "user"}

# API Routes
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "version": "1.0.0"
    }

@app.get("/metrics")
async def get_metrics():
    """Prometheus metrics endpoint"""
    return generate_latest()

@app.post("/agents", response_model=Dict[str, Any])
async def create_agent(
    config: AIAgentConfig,
    current_user: Dict = Depends(get_current_user)
):
    """Create a new AI agent"""
    return await agent_manager.create_agent(config)

@app.get("/agents/{agent_id}")
async def get_agent(
    agent_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Get AI agent details"""
    agent = await agent_manager.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent

@app.post("/chat", response_model=ChatResponse)
async def chat_with_agent(
    request: ChatRequest,
    current_user: Dict = Depends(get_current_user)
):
    """Chat with an AI agent"""
    return await agent_manager.chat_with_agent(request)

@app.post("/agents/{agent_id}/train", response_model=TrainingResponse)
async def train_agent(
    agent_id: str,
    request: TrainingRequest,
    background_tasks: BackgroundTasks,
    current_user: Dict = Depends(get_current_user)
):
    """Train an AI agent with custom data"""
    request.agent_id = agent_id
    return await agent_manager.train_agent(request)

@app.get("/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Get conversation history"""
    messages = await agent_manager._load_conversation_history(conversation_id)
    return {"conversation_id": conversation_id, "messages": messages}

@app.get("/agents/{agent_id}/analytics")
async def get_agent_analytics(
    agent_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Get AI agent analytics"""
    # Get conversation count
    conversation_count = await db.conversations.count_documents(
        {"messages.agent_id": agent_id}
    )
    
    # Get recent conversations
    recent_conversations = []
    cursor = db.conversations.find(
        {"messages.agent_id": agent_id}
    ).sort("timestamp", -1).limit(10)
    
    async for doc in cursor:
        recent_conversations.append(doc)
    
    return {
        "agent_id": agent_id,
        "total_conversations": conversation_count,
        "recent_conversations": len(recent_conversations),
        "status": "active"
    }

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    logger.info("Starting SMILE AI Service")
    
    # Test database connections
    try:
        await db.command("ping")
        logger.info("MongoDB connection successful")
    except Exception as e:
        logger.error(f"MongoDB connection failed: {str(e)}")
    
    try:
        await redis_client.ping()
        logger.info("Redis connection successful")
    except Exception as e:
        logger.error(f"Redis connection failed: {str(e)}")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down SMILE AI Service")
    mongodb_client.close()
    await redis_client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )
