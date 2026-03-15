import secrets
import hashlib
import hmac
from .config import get_settings

settings = get_settings()

def generate_api_key(prefix: str = "sk_live") -> tuple[str, str, str]:
    """
    Generates a secure API key for the customer.
    Returns:
        raw_key: The string given to the user ONCE (e.g. sk_live_xyz123).
        key_hash: The hashed version stored in the database.
        display_prefix: A masked version for the UI (e.g. sk_live_...123).
    """
    # 1. Generate 32 bytes of secure random data
    token = secrets.token_urlsafe(32)
    raw_key = f"{prefix}_{token}"
    
    # 2. Hash it using HMAC-SHA256 with our server's secret salt
    # This ensures even if the database is leaked, the keys cannot be reverse-engineered.
    key_hash = hash_api_key(raw_key)
    
    # 3. Create a safe display prefix for the dashboard (e.g., sk_live_abc123...)
    display_prefix = f"{prefix}_{token[:4]}...{token[-4:]}"
    
    return raw_key, key_hash, display_prefix

def hash_api_key(raw_key: str) -> str:
    """
    Hashes an API key securely using the server's API_AUTH_SECRET.
    """
    secret_bytes = settings.API_AUTH_SECRET.encode('utf-8')
    key_bytes = raw_key.encode('utf-8')
    
    # Use HMAC with SHA-256
    digest = hmac.new(secret_bytes, key_bytes, hashlib.sha256).hexdigest()
    return digest

def verify_api_key(raw_provided_key: str, stored_hash: str) -> bool:
    """
    Compares the provided raw key with the stored hash using a constant-time comparison
    to prevent timing attacks.
    """
    provided_hash = hash_api_key(raw_provided_key)
    return hmac.compare_digest(provided_hash, stored_hash)
