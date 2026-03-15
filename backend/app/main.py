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
    Search an individual or entity against the unified global API watchlists.
    Requires header: Authorization: Bearer <API_KEY>
    """
    try:
        # Note: In a production pgvector setup without an embedding model directly in PG, 
        # you would need to convert `request.search_term` into a vector embedding here
        # using OpenAI or MiniLM via the `sentence-transformers` library before querying Supabase.
        #
        # pseudo-code:
        # embedding = generate_embedding(request.search_term)
        # response = db.rpc('match_sanctions', {'query_embedding': embedding, 'match_threshold': request.fuzziness_threshold}).execute()
        
        # --- MVP MOCK Response for demonstration ---
        # This simulates Supabase returning a fuzzy match
        mock_hit = False
        
        if "osama" in request.search_term.lower() or "igwilo" in request.search_term.lower():
            mock_hit = True

        response_data = {
            "match_found": mock_hit,
            "confidence_score": 0.94 if mock_hit else 0.0,
            "search_term_used": request.search_term,
            "results": [
                {
                    "entity_name": "Osondu Victor IGWILO",
                    "source": "FBI_WANTED / NIGERIA_EFCC",
                    "reason": "Wire Fraud, Money Laundering",
                    "aliases": ["Victor Igwilo"],
                    "source_url": "https://efcc.gov.ng"
                }
            ] if mock_hit else [],
            "meta": {
                "organization_id": organization['id'],
                "organization_tier": organization['plan_tier'],
                "request_id": str(uuid.uuid4()),
                "timestamp": datetime.datetime.utcnow().isoformat() + "Z"
            }
        }
        
        # Run the audit logging in the background so it doesn't slow down the response time!
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
        background_tasks.add_task(
            log_audit_trail, 
            org_id=organization['id'], 
            endpoint="/v1/screen", 
            query=request.dict(), 
            status=500, 
            db=db
        )
        return {"error": str(e), "match_found": False}
