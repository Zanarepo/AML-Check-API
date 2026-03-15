import os
import sys
import pandas as pd
import requests
import io
import math

# Add the backend directory to sys path so we can import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import get_supabase_client

# OFAC SDN List CSV URL
OFAC_SDN_URL = "https://www.treasury.gov/ofac/downloads/sdn.csv"

def run_ofac_scraper():
    print("Starting US OFAC SDN Data Ingestion Pipeline...")
    
    # 1. Download the CSV
    print(f"Downloading data from {OFAC_SDN_URL}...")
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    response = requests.get(OFAC_SDN_URL, headers=headers)
    response.raise_for_status()
    print("Download Complete!")
    
    # 2. Parse with pandas
    # OFAC CSV has no header row. The standard columns are:
    columns = [
        "ent_num", "sdn_name", "sdn_type", "program", "title", "call_sign", 
        "vess_type", "tonnage", "grt", "vess_flag", "vess_owner", "remarks"
    ]
    
    df = pd.read_csv(io.StringIO(response.text), names=columns, dtype=str, keep_default_na=False)
    
    total_rows = len(df)
    print(f"Found {total_rows} entities in the OFAC SDN list.")
    
    # 3. Connect to Supabase
    db = get_supabase_client()
    
    # 4. Transform and Insert Data in Chunks
    # We will limit to 1000 records for the MVP test run to avoid overwhelming the database synchronously.
    max_records_to_insert = 1000
    chunk_size = 200
    inserted = 0
    
    print(f"Preparing to insert first {max_records_to_insert} parsed records into Supabase...")
    
    # Optional: Truncate existing OFAC data before fresh insert (useful for daily cron jobs)
    # db.table("sanctions_entities").delete().eq("source_list", "US_OFAC").execute()
    
    for i in range(0, min(total_rows, max_records_to_insert), chunk_size):
        chunk = df.iloc[i:i+chunk_size]
        records = []
        
        for _, row in chunk.iterrows():
            # Determine Entity Type based on OFAC's text
            raw_type = str(row['sdn_type']).lower()
            entity_type = "individual"
            
            if "entity" in raw_type or "-ent-" in raw_type:
                entity_type = "entity"
            elif "vessel" in raw_type:
                entity_type = "vessel"
            elif "aircraft" in raw_type:
                entity_type = "aircraft"
            
            # Clean Name (Sometimes names are 'LASTNAME, Firstname')
            name = str(row['sdn_name']).strip()
            if "," in name:
                parts = [p.strip() for p in name.split(",", 1)]
                if len(parts) == 2:
                    name = f"{parts[1]} {parts[0]}" # Try to convert to First Last
                    
            # Extract Identifiers (For MVP, just throwing extra columns into JSONB)
            identifiers = {}
            if row['remarks']:
                identifiers['remarks'] = row['remarks']
            if row['title']:
                identifiers['title'] = row['title']
                
            record = {
                "entity_name": name,
                "entity_type": entity_type,
                "source_list": "US_OFAC",
                "country_of_origin": None, # OFAC lists this in 'addresses.csv' usually, ignoring for simple MVP
                "reason_for_sanction": str(row['program']),
                "identifiers": identifiers
            }
            records.append(record)
            
        # Insert chunk to database
        try:
             db.table("sanctions_entities").insert(records).execute()
             inserted += len(records)
             print(f"✅ Inserted chunk... ({inserted}/{max_records_to_insert} records)")
        except Exception as e:
             print(f"❌ Error inserting chunk: {e}")
             break
            
    print("\n🚀 OFAC Scraper finished successfully!")
    print(f"Your API now has {inserted} real sanctioned entities loaded into the database!")

if __name__ == "__main__":
    run_ofac_scraper()
