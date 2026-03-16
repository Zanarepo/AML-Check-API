import os
import requests
from supabase import create_client, Client
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer

# Load environment from the BASE project folder
load_dotenv(dotenv_path="../.env")

# 1. Setup Supabase
URL = os.environ.get("SUPABASE_URL")
KEY = os.environ.get("SUPABASE_SERVICE_KEY")

if not URL or not KEY:
    print("ERROR: SUPABASE_URL or SUPABASE_SERVICE_KEY not found in ../.env")
    exit(1)

supabase: Client = create_client(URL, KEY)

# 2. Load the exact model used by the main app
print("Loading AI Model (all-MiniLM-L6-v2) to generate embeddings...")
model = SentenceTransformer('all-MiniLM-L6-v2')

def seed_security_test_data():
    """
    Seeds the database with specific names that will trigger matches in our 
    Security Personnel Registration Portal.
    """
    
    test_entities = [
        {
            "name": "CARLOS THE JACKAL",
            "type": "individual",
            "source": "INTERPOL_RED_NOTICE",
            "reason": "Terrorism and multiple murders",
            "country": "VE"
        },
        {
            "name": "PABLO ESCOBAR",
            "type": "individual",
            "source": "US_OFAC",
            "reason": "Narcotics Trafficking / International Kingpin",
            "country": "CO"
        },
        {
            "name": "ABU BAKR AL-BAGHDADI",
            "type": "individual",
            "source": "UN_SECURITY_COUNCIL",
            "reason": "Leader of ISIS / Terrorist financing",
            "country": "IQ"
        }
    ]
    
    print(f"\nSeeding {len(test_entities)} test entities into the database...")
    
    for entity in test_entities:
        # Check if already exists to avoid duplicates
        exists = supabase.table("sanctions_entities").select("id").eq("entity_name", entity['name']).execute()
        
        if exists.data:
            print(f"[-] {entity['name']} already exists in database.")
            continue
            
        print(f"[+] Generating embedding for {entity['name']}...")
        embedding = model.encode(entity['name']).tolist()
        
        data = {
            "entity_name": entity['name'],
            "name_embedding": embedding,
            "entity_type": entity['type'],
            "source_list": entity['source'],
            "reason_for_sanction": entity['reason'],
            "country_of_origin": entity['country'],
            "identifiers": {"test_flag": "security_onboarding_demo"}
        }
        
        res = supabase.table("sanctions_entities").insert(data).execute()
        if res.data:
            print(f"    Success!")
        else:
            print(f"    Failed: {res}")

if __name__ == "__main__":
    seed_security_test_data()
    print("\nDATABASE READY FOR SEURITY FIRM INTEGRATION TEST.")
    print("Try registering 'Carlos the Jackal' in the portal to see the compliance block.")
