import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(url, key)

def check_keys():
    res = supabase.table("api_keys").select("*").execute()
    print(f"Found {len(res.data)} keys.")
    for k in res.data:
        print(f"Org: {k['organization_id']} | Status: {k['status']} | Prefix: {k['prefix']} | Hash: {k['key_hash'][:10]}...")

if __name__ == "__main__":
    check_keys()
