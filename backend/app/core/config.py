from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # Application settings
    APP_NAME: str = "AML Check API"
    ENVIRONMENT: str = "development"
    
    # Supabase configurations
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str
    SUPABASE_ANON_KEY: str | None = None
    
    # Security setting for hashing API keys
    API_AUTH_SECRET: str
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()
