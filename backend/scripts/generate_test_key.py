import sys
import os

# Add the backend directory to the sys paths to allow importing from app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.security import generate_api_key
from app.core.database import get_supabase_client

def create_test_organization_and_key():
    db = get_supabase_client()
    
    # 1. Create a dummy organization
    print("Creating Test Organization...")
    org_response = db.table("organizations").insert({
        "name": "Acme Fintech Nigeria",
        "plan_tier": "free"
    }).execute()
    
    org_id = org_response.data[0]['id']
    print(f"✅ Organization Created! ID: {org_id}")
    
    # 2. Generate the Secure API Key
    print("\nGenerating Secure API Key...")
    raw_key, key_hash, display_prefix = generate_api_key(prefix="sk_test")
    
    # 3. Store the hash in Supabase
    key_response = db.table("api_keys").insert({
        "organization_id": org_id,
        "key_hash": key_hash,
        "prefix": display_prefix,
        "name": "Initial Test Key",
        "status": "active"
    }).execute()
    
    print(f"✅ API Key Hash Stored in Database securely.")
    
    print("\n" + "="*50)
    print("🚨 SAVE THIS KEY NOW. IT WILL NEVER BE SHOWN AGAIN 🚨")
    print(f"API Key: Bearer {raw_key}")
    print("="*50 + "\n")
    print('You can test the API by running: curl -X POST "http://127.0.0.1:8000/v1/screen" -H "Authorization: Bearer <API_KEY>" -H "Content-Type: application/json" -d \'{"search_term": "Victor Igwilo"}\'')

if __name__ == "__main__":
    create_test_organization_and_key()
