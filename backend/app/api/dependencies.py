from fastapi import HTTPException, Security, Depends
from fastapi.security.api_key import APIKeyHeader
from supabase import Client
from app.core.database import get_supabase_client
from app.core.security import hash_api_key

# We expect the client to send the API key in the Authorization header as a Bearer token
API_KEY_NAME = "Authorization"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=True)

async def verify_api_key_header(
    api_key_header: str = Security(api_key_header),
    db: Client = Depends(get_supabase_client)
) -> dict:
    """
    Dependency to run on protected routes.
    Extracts the Bearer token, hashes it, queries Supabase to ensure it exists and is active.
    Returns the organization object if successful, or raises a 401 Unauthorized exception.
    """
    
    # Extract the raw key from "Bearer sk_live_1234..."
    if not api_key_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format. Expected 'Bearer <key>'")
        
    raw_key = api_key_header.replace("Bearer ", "").strip()
    
    if not raw_key:
        raise HTTPException(status_code=401, detail="Missing API Key")

    # 1. Hash the key immediately 
    key_hash = hash_api_key(raw_key)

    try:
        # 2. Query the Supabase `api_keys` table using the SERVICE_ROLE_KEY 
        # to see if this hash exists and is active.
        response = db.table("api_keys").select("organization_id, status").eq("key_hash", key_hash).eq("status", "active").execute()
        
        if not response.data:
            raise HTTPException(status_code=401, detail="Invalid or Revoked API Key")
            
        org_id = response.data[0].get("organization_id")
        
        # 3. Retrieve the Organization details for rate-limiting and audit logging
        org_response = db.table("organizations").select("id, name, plan_tier").eq("id", org_id).execute()
        
        if not org_response.data:
            raise HTTPException(status_code=401, detail="Organization not found for this API Key")
            
        organization = org_response.data[0]
        
        # 4. Return the org. This allows our route to say:
        # result = perform_search(search_term, organization['id'])
        return organization
        
    except HTTPException:
        # Re-raise FastAPIs HTTPExceptions
        raise
    except Exception as e:
        print(f"Auth Error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error during Authentication")
