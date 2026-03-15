import os
import sys
from sentence_transformers import SentenceTransformer
import torch

# Add the backend directory to sys path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import get_supabase_client

# We use a lightweight but powerful transformer model
MODEL_NAME = 'all-MiniLM-L6-v2'

def generate_embeddings_for_db():
    print(f"Loading AI Model: {MODEL_NAME}...")
    model = SentenceTransformer(MODEL_NAME)
    
    db = get_supabase_client()
    
    print("Fetching entities without embeddings from Supabase...")
    # Get rows where name_embedding is null
    response = db.table("sanctions_entities").select("id, entity_name").is_("name_embedding", "null").limit(500).execute()
    
    entities = response.data
    
    if not entities:
        print("✅ All entities already have embeddings. Nothing to do!")
        return

    print(f"Generating embeddings for {len(entities)} entities...")
    
    # 1. Extract names
    names = [e['entity_name'] for e in entities]
    
    # 2. Generate embeddings in bulk
    embeddings = model.encode(names).tolist()
    
    # 3. Update Supabase
    print("Syncing embeddings back to Database...")
    success_count = 0
    for i, entity in enumerate(entities):
        try:
            db.table("sanctions_entities").update({
                "name_embedding": embeddings[i]
            }).eq("id", entity['id']).execute()
            success_count += 1
        except Exception as e:
            print(f"Error updating entity {entity['id']}: {e}")
            
    print(f"✅ Successfully generated and synced {success_count} embeddings!")

if __name__ == "__main__":
    generate_embeddings_for_db()
