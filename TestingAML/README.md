# Security Firm Integration Lab 🛡️

This folder contains a standalone product integration demonstration. Instead of a simple "test script", this shows how the **AML Check API** is integrated into a production-grade registration workflow for a security firm (**ShieldGuard**).

## 🧰 How it Works

The product registration portal (`security_onboarding.html`) uses the standard **Bearer Token** authentication pattern used by top-tier payment APIs (like Stripe or Paystack).

### 1. Preparing the Database
Before testing, you need to ensure the sanctions list has data that matches your test queries. Run this script to seed the database with specialized test cases:

```powershell
python seed_test_data.py
```

### 2. Running the Test
1.  **Start the Backend**: Ensure your main project backend is running:
    `uvicorn app.main:app --reload --app-dir backend`
2.  **Open the Portal**: Open `security_onboarding.html` in your web browser.
3.  **Get your API Key**: Go to your [AML Dashboard](http://localhost:3000/dashboard) and copy your `sk_test` key.
4.  **Integration Scenarios**:
    *   **Scenario A (Compliant User)**: Register "John Smith". The portal will show **REGISTRATION APPROVED**.
    *   **Scenario B (Blacklisted User)**: Register **"Carlos the Jackal"**. The portal will instantly block the registration and show the specific compliance logs from our API.

## 🔍 Why this is a "Proper Integration"
*   **Header Auth**: Uses `Authorization: Bearer <sk_key>` exactly like a production app.
*   **Fuzzy Search**: Matches "Carlos Jackal" or "Carlos the Jackal" using the AI Vector logic.
*   **Debug Logs**: The portal includes a real-time integration logger at the bottom so you can see exactly when the API is hit and how the database responds.
