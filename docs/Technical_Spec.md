# AML Check API: Technical Specification & Configuration

## 1. System Architecture Overview

This project is an API-as-a-Service product designed to aggregate global and Pan-African compliance watchlists (OFAC, UN, UK HMT, NFIU, CBN, EFCC) and expose a single, fuzzy-searchable REST API for B2B Fintech clients.

### Core Components
1. **Database Layer:** Supabase (PostgreSQL with `pgvector` for fuzzy/similarity search).
2. **Backend API:** Python (FastAPI). Chosen for high performance and automatic interactive documentation (Swagger/OpenAPI).
3. **Data Ingestion Pipeline:** Python scripts managed by a task scheduler (e.g., GitHub Actions or Celery/Redis if scaling).
4. **Authentication & Rate Limiting:** Managed at the API layer (FastAPI Middlewares) backed by Supabase tables.

---

## 2. Database Schema (Supabase)

We need three core tables to operate the API as a service.

### Table 1: `organizations` (The Customers)
*   **`id`**: UUID (Primary Key)
*   **`name`**: String (Company Name)
*   **`created_at`**: Timestamp
*   **`plan_tier`**: Enum ('free', 'pro', 'enterprise')

### Table 2: `api_keys` (Authentication)
*   **`id`**: UUID (Primary Key)
*   **`organization_id`**: UUID (Foreign Key to `organizations.id`)
*   **`key_hash`**: String (Argon2 or bcrypt hash of the API key - NEVER STORE PLAIN TEXT)
*   **`prefix`**: String (e.g., `sk_live_1234...` - Helps users identify the key without exposing it)
*   **`status`**: Enum ('active', 'revoked')
*   **`created_at`**: Timestamp

### Table 3: `sanctions_entities` (The Global Watchlist Data)
*   **`id`**: UUID (Primary Key)
*   **`entity_name`**: String (The actual name: "Jon Doe" or "Bad Company LLC")
*   **`name_embedding`**: Vector (using `pgvector` for fuzzy similarity search)
*   **`entity_type`**: Enum ('individual', 'entity', 'vessel')
*   **`source_list`**: String (e.g., 'US_OFAC', 'NIGERIA_NFIU', 'UN')
*   **`identifiers`**: JSONB (DOB, Passport numbers, Aliases)
*   **`last_updated`**: Timestamp

### Table 4: `audit_logs` (Compliance Requirement)
*   **`id`**: UUID
*   **`organization_id`**: UUID
*   **`endpoint_accessed`**: String
*   **`query_parameters`**: JSONB (Encrypted if storing PII)
*   **`response_status`**: Integer (e.g., 200, 401, 429)
*   **`timestamp`**: Timestamp

---

## 3. Technology Stack Definitions

### Backend API (FastAPI)
*   **Framework:** FastAPI (Python 3.11+)
*   **Server:** Uvicorn (ASGI)
*   **ORM:** Supabase Python Client (or SQLAlchemy if abstracting DB)
*   **Validation:** Pydantic (Strict typing for all incoming JSON requests)
*   **Rate Limiting:** `slowapi` or Redis-backed rate limiter (Bucket algorithm: e.g., 100 req/minute).

### Data Ingestion Pipeline (The Scrapers)
*   **Language:** Python
*   **Libraries:**
    *   `pandas` (For cleaning and merging massive CSV files).
    *   `requests` & `beautifulsoup4` (For scraping non-structured government sites).
    *   `PyPDF2` or `pdfplumber` (Crucial for extracting text from Nigerian CBN/EFCC PDF announcements).
    *   `sentence-transformers` (To generate the vector embeddings for fuzzy searching before pushing to Supabase).
*   **Orchestration:** GitHub Actions (simplest MVP approach) running a cron job every night at 02:00 AM UTC.

---

## 4. Security Measures (Mission Critical)

Because we handle sensitive financial data and API key infrastructure, security must be zero-trust.

1.  **API Key Management:**
    *   When the developer generates a key in the portal, generate a secure random string (e.g., `secrets.token_urlsafe()`).
    *   Show it to the user *once*.
    *   Immediately cryptographic hash the key (using `bcrypt` or `Argon2`) and store *only the hash* in the `api_keys` table.
    *   When an API request comes in, hash the provided header and compare it to the database.
2.  **Transport Security:** Strict HTTP Strict Transport Security (HSTS). All API traffic must flow over TLS 1.2 or 1.3 (HTTPS).
3.  **CORS Policy:** The public API (`/v1/screen`) should accept `*` for Server-to-Server calls, but reject browser client calls unless they are pre-registered domains (to prevent frontend key theft).
4.  **Data Minimization (GDPR/NDPR):** Do not write the exact names searched by clients into plain-text server logs (CloudWatch/Datadog) to prevent leaking PII.

---

## 5. API Design (The MVP Endpoint)

### `POST /v1/screen`
**Headers:**
*   `Authorization: Bearer sk_live_...`
*   `Content-Type: application/json`

**Request Body:**
```json
{
  "search_term": "Osondu Victor Igwilo",
  "type": "individual",
  "fuzziness": 0.8, // Optional threshold
  "country": "NG" // Optional filter
}
```

**Response Body (200 OK):**
```json
{
  "match_found": true,
  "confidence_score": 0.94,
  "results": [
    {
      "entity_name": "Osondu Victor IGWILO",
      "source": "FBI_WANTED / NIGERIA_EFCC",
      "reason": "Wire Fraud, Money Laundering",
      "aliases": ["Victor Igwilo"],
      "source_url": "https://..."
    }
  ],
  "meta": {
    "request_id": "req_12345",
    "timestamp": "2026-03-15T12:00:00Z"
  }
}
```
