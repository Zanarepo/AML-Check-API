from supabase import create_client, Client
from .config import get_settings

settings = get_settings()

def get_supabase_client() -> Client:
    """
    Dependency to get the Supabase Client.
    We use the SERVICE_ROLE_KEY here because this is the backend server,
    which needs unrestricted access to the database to validate hashed API keys
    and run pgvector queries.
    """
    url: str = settings.SUPABASE_URL
    key: str = settings.SUPABASE_SERVICE_KEY
    
    if not url or not key:
        raise ValueError("Supabase URL or Key is missing from Environment Variables.")
        
    return create_client(url, key)
