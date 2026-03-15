import os
import sys

# Add the backend directory to sys path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from scripts.scrape_ofac import run_ofac_scraper
from scripts.scrape_african import run_african_scrapers
from scripts.scrape_cbn_pdf import run_cbn_ocr_pipeline
from scripts.generate_embeddings import generate_embeddings_for_db

def run_full_pipeline():
    print("=== STARTING FULL AML DATA REFRESH PIPELINE ===")
    
    # 1. Scrape Global Data (OFAC)
    try:
        run_ofac_scraper()
    except Exception as e:
        print(f"Error in OFAC scraper: {e}")

    # 2. Scrape African/Nigerian Data (EFCC/NFIU)
    try:
        run_african_scrapers()
    except Exception as e:
        print(f"Error in African scraper: {e}")

    # 3. Process PDF search for CBN
    try:
        run_cbn_ocr_pipeline()
    except Exception as e:
        print(f"Error in CBN PDF pipeline: {e}")

    # 4. Generate AI Embeddings for all new data
    try:
        generate_embeddings_for_db()
    except Exception as e:
        print(f"Error in embedding generation: {e}")

    print("=== FULL PIPELINE COMPLETED SUCCESSFULLY ===")

if __name__ == "__main__":
    run_full_pipeline()
