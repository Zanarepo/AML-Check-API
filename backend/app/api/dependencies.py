from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client
from app.core.database import get_supabase_client
from app.core.security import hash_api_key

# One shared scheme for Swagger to avoid duplicates
security_scheme = HTTPBearer(scheme_name="APIKeyHeader", description="Enter your sk_test_ or sk_live_ key (or the User JWT for dashboard routes)")

async def verify_api_key_header(
    token: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: Client = Depends(get_supabase_client)
) -> dict:
    """
    Checks for API key in 'Authorization' Bearer token.
    FastAPI handles the 'Bearer ' prefix via HTTPBearer.
    """
    api_key = token.credentials.strip()
    
    if not api_key:
        raise HTTPException(status_code=401, detail="API Key missing in Authorization header.")

    # 1. Hash the key immediately 
    key_hash = hash_api_key(api_key)
    print(f"DEBUG: Input Key: {api_key[:10]}... (Total len: {len(api_key)})")
    print(f"DEBUG: Calculated Hash: {key_hash}")
    
    try:
        # 2. Query the Supabase `api_keys` table using the SERVICE_ROLE_KEY 
        response = db.table("api_keys").select("organization_id, status, key_hash").eq("key_hash", key_hash).eq("status", "active").execute()
        print(f"DEBUG: DB Matches found: {len(response.data)}")
        
        if not response.data:
            # If no match, let's see if ANY keys exist for debugging
            all_keys = db.table("api_keys").select("key_hash").limit(1).execute()
            if all_keys.data:
                print(f"DEBUG: First hash in DB for comparison: {all_keys.data[0]['key_hash']}")
            raise HTTPException(status_code=401, detail="Invalid, Revoked, or Mismatched API Key")
            
        org_id = response.data[0].get("organization_id")
        
        # 3. Retrieve the Organization details joining with the new plan_tiers table
        org_response = db.table("organizations") \
            .select("id, name, is_verified, plan_tiers(name, monthly_limit, features)") \
            .eq("id", org_id) \
            .execute()
        
        if not org_response.data:
            raise HTTPException(status_code=401, detail="Organization not found for this API Key")
            
        raw_org = org_response.data[0]
        
        # Flatten the data for easier use in routes
        organization = {
            "id": raw_org["id"],
            "name": raw_org["name"],
            "is_verified": raw_org["is_verified"],
            "plan_tier": raw_org["plan_tiers"]["name"] if raw_org.get("plan_tiers") else "free",
            "monthly_limit": raw_org["plan_tiers"]["monthly_limit"] if raw_org.get("plan_tiers") else 1000,
            "features": raw_org["plan_tiers"]["features"] if raw_org.get("plan_tiers") else {}
        }

        # 4. Check if a LIVE key is being used on an UNVERIFIED organization
        is_live_key = api_key.startswith("sk_live")
        if is_live_key and not organization.get("is_verified", False):
            raise HTTPException(
                status_code=403, 
                detail="Production Access Denied. Your KYB verification is still pending."
            )
            
        # 5. Return the org. This allows our route to say:
        # result = perform_search(search_term, organization['id'])
        return organization
        
    except HTTPException:
        # Re-raise FastAPIs HTTPExceptions
        raise
    except Exception as e:
        print(f"Auth Error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error during Authentication")

async def verify_user_session(
    token: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: Client = Depends(get_supabase_client)
) -> dict:
    """
    Dependency to verify a Supabase Auth JWT.
    Used for dashboard operations (like rolling keys) where the user is logged in.
    """
    try:
        # verify the JWT with Supabase
        user_res = db.auth.get_user(token.credentials)
        if not user_res or not user_res.user:
            raise HTTPException(status_code=401, detail="Invalid session or expired token")
        
        return user_res.user
    except Exception as e:
        print(f"Session Error: {e}")
        raise HTTPException(status_code=401, detail="Invalid session")

async def verify_user_organization(
    user: dict = Depends(verify_user_session),
    db: Client = Depends(get_supabase_client)
) -> dict:
    """
    Dependency to fetch the organization and plan for a logged-in user.
    Useful for dashboard-driven operations.
    """
    try:
        # 1. Get profiles table to find org_id
        profile_res = db.table("profiles").select("organization_id").eq("id", user.id).single().execute()
        if not profile_res.data:
            # Fallback check if user is admin/owner
            org_res = db.table("organizations").select("id").eq("owner_id", user.id).limit(1).execute()
            if not org_res.data:
                raise HTTPException(status_code=404, detail="No organization associated with this user.")
            org_id = org_res.data[0]['id']
        else:
            org_id = profile_res.data['organization_id']

        # 2. Get Org & Plan
        org_response = db.table("organizations") \
            .select("id, name, is_verified, plan_tiers(name, monthly_limit, features)") \
            .eq("id", org_id) \
            .execute()
        
        if not org_response.data:
            raise HTTPException(status_code=401, detail="Organization not found")
            
        raw_org = org_response.data[0]
        
        # Flatten
        organization = {
            "id": raw_org["id"],
            "name": raw_org["name"],
            "is_verified": raw_org["is_verified"],
            "plan_tier": raw_org["plan_tiers"]["name"] if raw_org.get("plan_tiers") else "free",
            "monthly_limit": raw_org["plan_tiers"]["monthly_limit"] if raw_org.get("plan_tiers") else 1000,
            "features": raw_org["plan_tiers"]["features"] if raw_org.get("plan_tiers") else {}
        }
        return organization
    except Exception as e:
        print(f"Org Fetch Error: {e}")
        raise HTTPException(status_code=401, detail="Could not verify organization session")
