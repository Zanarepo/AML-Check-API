# Product Requirements Document (PRD): Sanctions & Compliance API (KYC/AML)

## 1. Executive Summary
**Product Name:** AML Check API (Working Title)
**Objective:** Provide a fast, reliable, and easy-to-integrate REST API that allows global and Pan-African Fintechs, Crypto exchanges, and Neobanks to screen their users against global terrorist, government sanction lists, and local African watchlists.
**Target Audience:** Software developers and compliance officers at B2B financial tech companies, with a strong focus on the African Fintech ecosystem (e.g., Nigeria, Kenya, South Africa).
**Value Proposition:** Stop spending engineering time parsing messy government XML/CSV files and scraping local African government PDFs. We provide a single, highly available `/screen` endpoint with built-in fuzzy matching to keep you legally compliant and prevent multi-million dollar regulatory fines across global and African jurisdictions.

---

## 2. Core Problem & Solution

### The Problem
*   By law, financial institutions cannot do business with individuals or entities on government sanction lists (e.g., OFAC in the US, HMT in the UK, UN Consolidated List, and local lists like Nigeria's NFIU/CBN directives).
*   These lists update unpredictably.
*   The raw data from governments is incredibly messy (mixes of old XML, massive CSVs, and unstandardized PDF documents that require text extraction).
*   "Exact match" checking is useless. If the government lists "John Doe" and the user signs up as "Jon Doe," the business must flag it. Building this "fuzzy" search involves complex data engineering.

### The Solution (The Product)
A fully managed API that:
1.  **Ingests & Normalizes:** Automatically pulls the latest data daily from the top global and African government sources (OFAC, UN, HMT, NFIU, CBN, EFCC) and turns it into one clean database.
2.  **Fuzzy Searching:** Provides an endpoint where a developer sends JSON `{"name": "Jon Doe", "country": "US"}` and the API returns a probability score of a match.
3.  **Audit Logs:** Keeps a secure history of every search performed to prove legal compliance if the business is audited by regulators.

---

## 3. Product Requirements & Features

### V1 Features (MVP)
*   [ ] **Single Search Endpoint:** `POST /v1/screen`
    *   *Input:* Name (First/Last or Company), Country, Date of Birth (Optional).
    *   *Output:* Match Score (0-100), Matched Entity Details, Source List (e.g., OFAC), Link to Government Source.
*   [ ] **Fuzzy Matching Algorithm:** Must handle misspellings, missing middle names, and phonetic similarities (e.g., Stephen vs. Steven, Mohammed vs. Muhammad).
*   [ ] **Automated Daily Ingestion:** Workers that successfully download, parse, and normalize at least 5 lists (US OFAC, UK HMT, UN, Nigeria NFIU, Nigeria CBN/EFCC including PDF OCR).
*   [ ] **API Key Management:** A basic developer portal to generate test/live API keys.
*   [ ] **Tiered Rate Limiting:** Prevent abuse (e.g., Free tier: 100 req/mo, Pro tier: 10,000 req/mo).

### V2 Features (Future Roadmap)
*   **Webhooks:** Ongoing monitoring. If an existing customer of the Fintech gets *added* to a sanction list 6 months after signing up, the API fires a webhook alert.
*   **PEP (Politically Exposed Persons) Verification:** Expanding the database to include politicians and their close associates (a separate legal requirement for many banks).
*   **Audit Trail Dashboard:** A UI for the client's compliance officer to manually review and mark "False Positives."

---

## 4. Technical Architecture & Data Pipeline

### Architecture Overview
This is fundamentally a **Search and Data Pipeline** company, not a complex web app.

1.  **Data Ingestion Layer (Cron Jobs/Workers):** Runs nightly. Pulls massive XML/CSV files and PDF documents from government servers globally and across Africa.
2.  **Normalization Layer:** Cleans the data (e.g., standardizing date formats, splitting concatenated names, dropping irrelevant columns).
3.  **Search Engine Index:** The cleaned data is pushed into a highly optimized search database built explicitly for fuzzy-text matching.
4.  **API Gateway / Backend:** A fast, stateless backend that receives the customer's request, authenticates the API key, queries the Search Index, formats the response, and logs the transaction.

### Required Data Sources (The MVP Lists)

**Global Sources:**
*   **US OFAC (Office of Foreign Assets Control):** Specifically the SDN (Specially Designated Nationals) List. (XML/CSV formats available).
*   **UN Consolidated List:** United Nations Security Council sanctions.
*   **UK HMT (HM Treasury):** Consolidated List of Financial Sanctions Targets.

**African/Nigerian Sources:**
*   **Nigeria Financial Intelligence Unit (NFIU):** Nigerian Sanctions Updates for terrorism financing, fraud, and money laundering. Mandatory for CBN/EFCC compliance.
*   **Central Bank of Nigeria (CBN) Directives:** Circulars and lists of frozen accounts (Requires PDF OCR/Scraping).
*   **EFCC Wanted List:** Active wanted list for fraud and financial crimes, serving as a critical risk-mitigation tool for Pan-African Neobanks.

---

## 5. Technical Stack Recommendations

The stack must prioritize fast text search and reliable backend task processing.

### 1. The Search Engine (The Core Engine)
*   **Recommendation:** **Elasticsearch** (or OpenSearch) OR **Typesense** / **Meilisearch**.
*   *Why:* A standard PostgreSQL database is terrible at fuzzy text search at scale. Elasticsearch is the industry standard for returning results based on typos and phonetic similarity. If you want a simpler, modern alternative for text search, Meilisearch is excellent.

### 2. Backend API & Routing (The Gateway)
*   **Recommendation:** **Node.js (Express or Fastify)** OR **Python (FastAPI)** OR **Go**.
*   *Why:* If your team knows Node, TypeScript + Fastify is incredibly fast and great for building REST APIs. If you prefer Python, FastAPI acts essentially as a self-documenting API product out of the box (it builds Swagger docs automatically, which developers love).

### 3. Data Ingestion & Workers (The Pipeline)
*   **Recommendation:** **Python** scripts running on a basic orchestrator (like standard Cron, **Celery**, or a managed service like **Render Cron Jobs** / **AWS EventBridge**).
*   *Why:* Python has the best ecosystem (Pandas) for quickly downloading messy CSVs/XMLs from old government servers, cleaning the columns, and pushing the clean JSON to your Search Engine.

### 4. Database (For Users, API Keys, and Audit Logs)
*   **Recommendation:** **PostgreSQL** (Managed via Supabase, Neon, or AWS RDS).
*   *Why:* You need a relational database to store your customers, their Stripe billing info, their encrypted API keys, and exactly how many API calls they've made this month.

### 5. Hosting & Infrastructure
*   **Recommendation:** **Render**, **Railway**, or **Vercel** (for the landing page/dashboard).
*   *Why:* Do not waste time building AWS Kubernetes clusters for an MVP. Use Render or Railway to easily deploy your Python workers, your Node/FastAPI backend, and your Postgres database in one place.

---

## 6. Security & Compliance Must-Haves
*   **API Security:** API keys must be hashed in the database. Never store plain text API keys.
*   **HTTPS Only:** Strict TLS enforcement since you are processing Personally Identifiable Information (PII) like names and dates of birth.
*   **Data Residency/Privacy:** No user search data should be written to logs in plain text or used to train AI to appease GDPR compliance. (You only store the query in an encrypted audit log).

---

## 7. GTM (Go To Market) Strategy
*   **The Hook:** "The Unified Compliance API for Global and Pan-African Fintechs. Stop building OFAC parsers and scraping CBN PDFs. Start screening in 5 minutes."
*   **Documentation First:** The marketing page *is* the API documentation. Use tools like ReadMe or build a beautiful Dark Mode Swagger UI so developers can see the code snippet on the homepage.
*   **Targeting:** Cold email CTOs and "Head of Compliance" at Seed/Series A Fintech startups across Africa (e.g., Paystack, Moniepoint, Kuda) and global Y-Combinator lists. They are building fast and don't want to assign an engineer to watchlist maintenance.
