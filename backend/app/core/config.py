"""
FlowSense - Application Configuration
Environment-based settings for the hospital flow prediction system
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Application
    APP_NAME: str = "FlowSense API"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "AI-Powered Hospital Flow Prediction System"
    ENVIRONMENT: str = "development"
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./flowsense.db"
    
    # API Configuration
    API_V1_PREFIX: str = "/api/v1"
    CORS_ORIGINS: list = ["*"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


# Global settings instance
settings = Settings()
