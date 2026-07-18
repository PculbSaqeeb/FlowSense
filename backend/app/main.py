"""
FlowSense - FastAPI Application
Main entry point for the hospital flow prediction API
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import asyncio
import time
from datetime import datetime

from .core.config import settings
from .core.database import db_manager
from .models import database_models  # Import models so Base.metadata knows about them
from .routes import dashboard, predictions, recommendations
from .routes import stream, ai, reports, beds, escalation
from .services.state_manager import state_manager


# Application lifespan events
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events"""
    # Startup
    print(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    print(f"Environment: {settings.ENVIRONMENT}")
    
    # Create database tables
    await db_manager.create_tables()
    print("Database tables created")
    
    # Train ML models on startup
    try:
        from .services.ml_engine import ml_engine
        print("[STARTUP] Training ML models on real hospital data (143,280 ED visits)...")
        await asyncio.get_event_loop().run_in_executor(None, ml_engine.train, 180)
        print(f"[STARTUP] ML models trained. is_trained={ml_engine.is_trained}, models={list(ml_engine.models.keys())}")
    except Exception as e:
        print(f"[STARTUP] ML training FAILED: {e}")
        import traceback
        traceback.print_exc()
    
    # Start background state manager for SSE
    state_manager.start()
    print("[STARTUP] SSE state manager started")
    
    yield
    
    # Shutdown
    state_manager.stop()
    print("SSE state manager stopped")
    print("Shutting down application")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=settings.APP_DESCRIPTION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add request processing time to response headers"""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(round(process_time, 4))
    response.headers["X-Timestamp"] = datetime.utcnow().isoformat()
    return response


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions"""
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "An unexpected error occurred",
            "error_code": "INTERNAL_SERVER_ERROR",
            "details": {
                "error": str(exc),
                "path": request.url.path,
                "method": request.method,
            },
            "timestamp": datetime.utcnow().isoformat(),
        }
    )


# Register routers
app.include_router(dashboard.router, prefix=settings.API_V1_PREFIX)
app.include_router(predictions.router, prefix=settings.API_V1_PREFIX)
app.include_router(recommendations.router, prefix=settings.API_V1_PREFIX)
app.include_router(stream.router, prefix=settings.API_V1_PREFIX)
app.include_router(ai.router, prefix=settings.API_V1_PREFIX)
app.include_router(reports.router, prefix=settings.API_V1_PREFIX)
app.include_router(beds.router, prefix=settings.API_V1_PREFIX)
app.include_router(escalation.router, prefix=settings.API_V1_PREFIX)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "timestamp": datetime.utcnow().isoformat(),
    }


# API info endpoint
@app.get("/")
async def root():
    """API information"""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "description": settings.APP_DESCRIPTION,
        "docs": "/docs",
        "health": "/health",
        "api_prefix": settings.API_V1_PREFIX,
    }
