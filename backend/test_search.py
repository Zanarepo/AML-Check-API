import asyncio
from app.core.database import get_supabase_client
from app.main import get_model

async def run_test():
    print("Initializing...")
    db = get_supabase_client()
    model = get_model()
    
    term = "Chi Fu CHANG"
    threshold = 0.5
    print(f"Generating embedding for '{term}'...")
    embedding = model.encode(term).tolist()
    
    print("Calling match_sanctions rpc with threshold", threshold)
    try:
        res = db.rpc("match_sanctions", {
            "query_embedding": embedding,
            "match_threshold": threshold,
            "match_count": 5,
            "filter_country": None,
            "filter_type": None
        }).execute()
        
        matches = res.data if res.data else []
        print(f"Total matches returned: {len(matches)}")
        
        for r in matches:
            print(f"- {r.get('entity_name')} | Type: {r.get('entity_type')} | Confidence: {r.get('similarity')}")
            
    except Exception as e:
        print(f"RPC Error: {e}")

if __name__ == "__main__":
    asyncio.run(run_test())
