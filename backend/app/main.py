from fastapi import FastAPI, Depends, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, List
import datetime
import uuid

from app.core.config import get_settings
from app.core.database import get_supabase_client
from app.api.dependencies import verify_api_key_header
from supabase import Client

settings = get_settings()

app = FastAPI(
    title="AML Check API",
    description="Fuzzy Match Sanctions Screening via Global and African Watchlists",
    version="1.0.0",
)

# --- Pydantic Models for the API ---
class ScreeningRequest(BaseModel):
    search_term: str = Field(..., example="Osama Bin Laden", description="The exact name of the individual or entity")
    entity_type: Optional[str] = Field("individual", description="individual, entity, vessel, or aircraft")
    fuzziness_threshold: Optional[float] = Field(0.8, ge=0.0, le=1.0, description="Confidence threshold for a match (0-1)")
    country: Optional[str] = Field(None, example="NG", description="ISO Alpha-2 code")

class OrganizationToken(BaseModel):
    id: str  # The UUID from Supabase
    name: str

# --- Background Task for Audit Logging ---
def log_audit_trail(org_id: str, endpoint: str, query: dict, status: int, db: Client):
    try:
        db.table("audit_logs").insert({
            "organization_id": org_id,
            "endpoint_accessed": endpoint,
            "query_parameters": query, # Be careful with full PII logging in prod, scrub if necessary
            "response_status": status
        }).execute()
    except Exception as e:
        # In a real app, send this to Sentry or Datadog
        print(f"Failed to write audit log: {e}")

from sentence_transformers import SentenceTransformer

# --- Initialize AI Model ---
print("Loading AI Embedding Model (all-MiniLM-L6-v2)...")
model = SentenceTransformer('all-MiniLM-L6-v2')

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
    """
    Search an individual or entity against the unified global API watchlists
    using high-speed AI vector similarity (Fuzzy Matching).
    """
    try:
        # 1. Generate the Embedding for the search term
        embedding = model.encode(request.search_term).tolist()
        
        # 2. Call the Supabase RPC function (match_sanctions)
        # This function performs the cosine similarity search in the DB
        rpc_response = db.rpc('match_sanctions', {
            'query_embedding': embedding,
            'match_threshold': request.fuzziness_threshold,
            'match_count': 5
        }).execute()
        
        results = rpc_response.data if rpc_response.data else []
        match_found = len(results) > 0
        
        # Calculate highest confidence score
        confidence_score = results[0]['similarity'] if match_found else 0.0

        response_data = {
            "match_found": match_found,
            "confidence_score": round(confidence_score, 4),
            "search_term_used": request.search_term,
            "results": results,
            "meta": {
                "organization_id": organization['id'],
                "organization_tier": organization['plan_tier'],
                "request_id": str(uuid.uuid4()),
                "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
            }
        }
        
        # Log successful audit trail
        background_tasks.add_task(
            log_audit_trail, 
            org_id=organization['id'], 
            endpoint="/v1/screen", 
            query=request.dict(), 
            status=200, 
            db=db
        )
        
        return response_data

    except Exception as e:
        print(f"Screening Error: {e}")
        background_tasks.add_task(
            log_audit_trail, 
            org_id=organization['id'], 
            endpoint="/v1/screen", 
            query=request.dict(), 
            status=500, 
            db=db
        )
        return {"error": "Internal Server Error during screening", "match_found": False}
