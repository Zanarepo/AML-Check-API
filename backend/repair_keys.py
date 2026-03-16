import hmac
import hashlib
from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
API_AUTH_SECRET = os.getenv("API_AUTH_SECRET")

def hash_api_key(raw_key: str, secret: str) -> str:
    secret_bytes = secret.encode('utf-8')
    key_bytes = raw_key.encode('utf-8')
    return hmac.new(secret_bytes, key_bytes, hashlib.sha256).hexdigest()

def sync_keys():
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    # The keys the user is using in the UI
    test_key = "sk_test_AKBavtDuwcrBsuljdYqJsWMQ_uCyHtx9_DbOGIeF2NQ"
    live_key = "sk_live_AKBavtDuwcrBsuljdYqJsWMQ_uCyHtx9_DbOGIeF2NQ"
    
    test_hash = hash_api_key(test_key, API_AUTH_SECRET)
    live_hash = hash_api_key(live_key, API_AUTH_SECRET)
    
    print(f"Test Key Hash: {test_hash}")
    print(f"Live Key Hash: {live_hash}")
    
    # Find the most recent organization
    org_res = supabase.table("organizations").select("id").order("created_at", desc=True).limit(1).execute()
    
    if not org_res.data:
        print("No organization found to link keys to.")
        return
        
    org_id = org_res.data[0]['id']
    print(f"Linking keys to Organization: {org_id}")
    
    # Clean up any existing entries with these hashes to avoid duplicates
    supabase.table("api_keys").delete().in_("key_hash", [test_hash, live_hash]).execute()
    
    # Ensure test key exists
    supabase.table("api_keys").insert({
        "organization_id": org_id,
        "key_hash": test_hash,
        "prefix": "sk_test",
        "name": "Default Test Key",
        "status": "active"
    }).execute()
    
    # Ensure live key exists
    supabase.table("api_keys").insert({
        "organization_id": org_id,
        "key_hash": live_hash,
        "prefix": "sk_live",
        "name": "Default Live Key",
        "status": "active"
    }).execute()
    
    print("API Keys synced successfully.")

if __name__ == "__main__":
    sync_keys()
