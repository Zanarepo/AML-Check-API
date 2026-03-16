from fastapi import FastAPI, Depends, BackgroundTasks, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
import datetime
import uuid

try:
    from app.core.config import get_settings
    from app.core.database import get_supabase_client
    from app.api.dependencies import verify_api_key_header, verify_user_session, verify_user_organization
    from app.core.security import generate_api_key
except ImportError:
    from core.config import get_settings
    from core.database import get_supabase_client
    from api.dependencies import verify_api_key_header, verify_user_session, verify_user_organization
    from core.security import generate_api_key
from supabase import Client

settings = get_settings()

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="AML Check API",
    description="Fuzzy Match Sanctions Screening via Global and African Watchlists",
    version="1.0.0",
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models for the API ---
class ScreeningRequest(BaseModel):
    search_term: str = Field(..., example="Osama Bin Laden", description="The exact name of the individual or entity")
    entity_type: Optional[str] = Field("individual", description="individual, entity, vessel, or aircraft")
    fuzziness_threshold: Optional[float] = Field(0.8, ge=0.0, le=1.0, description="Confidence threshold for a match (0-1)")
    country: Optional[str] = Field(None, example="NG", description="ISO Alpha-2 code")

# --- Background Task for Audit Logging ---
def log_audit_trail(org_id: str, endpoint: str, query_data: dict, status: int, db: Client):
    try:
        db.table("audit_logs").insert({
            "organization_id": org_id,
            "endpoint_accessed": endpoint,
            "query_parameters": query_data, 
            "response_status": status
        }).execute()
    except Exception as e:
        print(f"Failed to write audit log: {e}")

from sentence_transformers import SentenceTransformer

# --- Initialize AI Model ---
print("Loading AI Embedding Model (all-MiniLM-L6-v2)...")
model = SentenceTransformer('all-MiniLM-L6-v2')

# --- Program Code Translator ---
PROGRAM_CODE_MAPPING = {
    "IRAQ2": "Iraqi Sanctions (Former Regime / Senior Officials)",
    "SDGT": "Specially Designated Global Terrorist",
    "SDNT": "Specially Designated Narcotic Trafficker",
    "SDNTK": "Specially Designated Narcotics Kingpin",
    "RUSSIA-EO14024": "Russia-related Harmful Foreign Activities",
    "SYRIA": "Syrian Sanctions",
    "VENEZUELA-EO13850": "Venezuela-related Sanctions",
    "NKOREA": "North Korea Sanctions",
    "CUBA": "Cuban Assets Control Regulations",
    "BELARUS": "Belarus Sanctions",
    "CAATSA-RUSSIA": "CAATSA - Russia Section 231",
    "GLOMAG": "Global Magnitsky Human Rights Accountability Act",
    "IRAN": "Iranian Transactions and Sanctions Regulations",
    "FTO": "Foreign Terrorist Organization",
    "SDN": "Specially Designated National",
}

def translate_sanction_reason(reason: str) -> str:
    if not reason: return reason
    tokens = reason.replace(',', ' ').split()
    translated = [PROGRAM_CODE_MAPPING.get(t.upper(), t) for t in tokens]
    return " | ".join(translated)

# --- Shared Screening Logic ---
async def perform_screening(request: ScreeningRequest, organization: dict, db: Client):
    features = organization.get('features', {})
    
    # 1. Check Usage Quota
    now = datetime.datetime.utcnow()
    first_day = datetime.datetime(now.year, now.month, 1).isoformat()
    count_res = db.table("audit_logs").select("id", count="exact").eq("organization_id", organization['id']).gte("timestamp", first_day).execute()
    current_usage = count_res.count if count_res.count is not None else 0
    
    if current_usage >= organization.get('monthly_limit', 1000):
        raise HTTPException(status_code=402, detail="Monthly request quota exceeded. Please upgrade your plan.")

    # 2. Check Feature: Country Filtering
    if request.country and not features.get('can_filter_country', False):
        raise HTTPException(status_code=403, detail="Advanced filtering (country) is not available on your current plan. Please upgrade to Pro.")

    # 3. Generate Embedding
    embedding = model.encode(request.search_term).tolist()
    
    # 4. Search DB (Vector Match)
    rpc_response = db.rpc("match_sanctions", {
        "query_embedding": embedding,
        "match_threshold": request.fuzziness_threshold,
        "match_count": 5,
        "filter_country": request.country,
        "filter_type": request.entity_type
    }).execute()
    
    results = rpc_response.data if rpc_response.data else []
    
    # 5. Translate and Scrub
    for r in results:
        if r.get('reason_for_sanction'):
            r['reason_for_sanction'] = translate_sanction_reason(r['reason_for_sanction'])
        
        if not features.get('show_details', False):
            r['reason_for_sanction'] = "Upgrade to Pro to view sanction details"
            r['source_url'] = None
            r['identifiers'] = {}

    match_found = len(results) > 0
    highest_confidence = max([r['similarity'] for r in results]) if results else 0
    
    return {
        "search_term": request.search_term,
        "match_found": match_found,
        "highest_confidence": highest_confidence,
        "results": results
    }

# --- API Routes ---

@app.get("/")
def read_root():
    return {"status": "ok", "message": "AML Check API is running."}

@app.post("/v1/screen", tags=["Screening"])
async def screen_entity(
    request: ScreeningRequest, 
    background_tasks: BackgroundTasks,
    organization: dict = Depends(verify_api_key_header),
    db: Client = Depends(get_supabase_client)
):
    try:
        results = await perform_screening(request, organization, db)
        background_tasks.add_task(log_audit_trail, organization['id'], "/v1/screen", {**request.dict(), "_results": results}, 200, db)
        return results
    except HTTPException: raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/v1/dashboard/screen", tags=["Dashboard"])
async def dashboard_screen(
    request: ScreeningRequest, 
    background_tasks: BackgroundTasks,
    organization: dict = Depends(verify_user_organization),
    db: Client = Depends(get_supabase_client)
):
    try:
        results = await perform_screening(request, organization, db)
        background_tasks.add_task(log_audit_trail, organization['id'], "/v1/dashboard/screen", {**request.dict(), "_results": results}, 200, db)
        return results
    except HTTPException: raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/v1/org/keys/rotate", tags=["Organization"])
async def rotate_api_key(
    is_live: bool = True,
    user: dict = Depends(verify_user_session),
    db: Client = Depends(get_supabase_client)
):
    try:
        profile_res = db.table("profiles").select("organization_id").eq("id", user.id).single().execute()
        org_id = profile_res.data.get("organization_id")
        prefix = "sk_live" if is_live else "sk_test"
        raw_key, key_hash, display_prefix = generate_api_key(prefix=prefix)
        db.table("api_keys").delete().eq("organization_id", org_id).eq("prefix", prefix).execute()
        db.table("api_keys").insert({"organization_id": org_id, "key_hash": key_hash, "prefix": prefix, "name": f"Rotated Key", "status": "active"}).execute()
        return {"raw_key": raw_key, "display_prefix": display_prefix}
    except Exception as e:
        return {"error": str(e)}

@app.get("/v1/org/usage", tags=["Organization"])
async def get_org_usage(
    user: dict = Depends(verify_user_session),
    db: Client = Depends(get_supabase_client)
):
    try:
        profile_res = db.table("profiles").select("organization_id").eq("id", user.id).single().execute()
        org_id = profile_res.data.get("organization_id")
        org_res = db.table("organizations").select("plan_tier_id, plan_tiers(name, monthly_limit, features)").eq("id", org_id).single().execute()
        plan_data = org_res.data.get("plan_tiers", {})
        count_res = db.table("audit_logs").select("id", count="exact").eq("organization_id", org_id).gte("timestamp", datetime.datetime.utcnow().replace(day=1).isoformat()).execute()
        return {
            "monthly_requests": count_res.count or 0,
            "monthly_limit": plan_data.get("monthly_limit", 1000),
            "plan_tier": plan_data.get("name", "Free"),
            "features": plan_data.get("features", {}),
            "hit_rate": 12.5 
        }
    except Exception as e:
        return {"error": str(e)}
