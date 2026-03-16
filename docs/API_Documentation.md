# AML Check API: Developer Integration Guide

This guide provides the technical specifications required to integrate AML (Anti-Money Laundering) and Sanctions Screening directly into your own product or internal systems.

## 🔗 Overview
The AML Check API allows institutions to automate compliance by programmatically searching global watchlists. This eliminates the need for manual screening via the dashboard and allows for real-time risk assessment during user onboarding or transaction processing.

---

## 🔑 Authentication
All API requests must be authenticated using your **Secret API Key**. 

1. Generate your key in the **Settings** or **API Credentials** section of the Dashboard.
2. Include the key in the HTTP header for every request:

| Header | Value |
| :--- | :--- |
| `x-api-key` | `sk_live_your_secret_key` |
| `Content-Type` | `application/json` |

> [!WARNING]
> Keep your secret keys private. Never share them in client-side code (frontend) or public repositories.

---

## 🚀 Screening Endpoint

### `POST /v1/screen`
This is the primary endpoint for performing entity screening.

**Base URL:** `https://api.amlcheck.pro` (Replace with your actual hosted API domain)

### Request Parameters (JSON)
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `search_term` | `string` | **Yes** | The full name of the individual, organization, or vessel. |
| `entity_type` | `string` | No | Filters results by type: `individual`, `entity`, `vessel`, or `aircraft`. |
| `fuzziness_threshold` | `float` | No | Similarity threshold (0.0 to 1.0). Default is `0.80`. |
| `country` | `string` | No | Optional 2-letter ISO country code (e.g., `NG`, `US`, `GB`). |

---

## 📥 Response Structure

A successful response returns a JSON object containing match status and detailed results.

### Success Response Example (Match Found)
```json
{
  "search_term": "AL-QAEDA",
  "match_found": true,
  "highest_confidence": 1.0,
  "results": [
    {
      "name": "AL-QA'IDA",
      "similarity": 1.0,
      "entity_type": "entity",
      "reason_for_sanction": "Foreign Terrorist Organization | Specially Designated Global Terrorist",
      "source_url": "https://sanctionssearch.ofac.treas.gov/Details.aspx?ID=6000",
      "identifiers": {
        "aliases": ["AL-QAEDA", "THE BASE", "ISLAMIC ARMY"],
        "locations": ["Afghanistan", "Pakistan", "Worldwide"]
      }
    }
  ]
}
```

### Success Response Example (No Match)
```json
{
  "search_term": "John Doe",
  "match_found": false,
  "highest_confidence": 0.457,
  "results": []
}
```

---

## 💻 Code Examples

### Python (using `requests`)
```python
import requests
import json

def screening_check(name):
    api_url = "https://api.amlcheck.pro/v1/screen"
    headers = {
        "x-api-key": "sk_live_your_key_here",
        "Content-Type": "application/json"
    }
    payload = {
        "search_term": name,
        "entity_type": "individual",
        "fuzziness_threshold": 0.85
    }

    try:
        response = requests.post(api_url, data=json.dumps(payload), headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as err:
        return {"error": str(err)}

# Example Usage
result = screening_check("Osama Bin Laden")
if result.get("match_found"):
    print(f"Match Detected! Confidence: {result['highest_confidence']}")
```

### Node.js (using `fetch`)
```javascript
const axios = require('axios');

async function checkSanctions(entityName) {
  const config = {
    method: 'post',
    url: 'https://api.amlcheck.pro/v1/screen',
    headers: { 
      'x-api-key': 'sk_live_your_key_here', 
      'Content-Type': 'application/json'
    },
    data: {
      search_term: entityName,
      entity_type: "individual"
    }
  };

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error("API Error:", error.response?.data || error.message);
  }
}
```

---

## 📊 HTTP Status Codes
| Code | Meaning | Description |
| :--- | :--- | :--- |
| `200` | OK | Success. Match results included in body. |
| `401` | Unauthorized | Missing or invalid API key. |
| `402` | Payment Required | Monthly request quota (credits) exceeded. |
| `403` | Forbidden | Feature requested (e.g. country filter) is not in your current plan. |
| `422` | Unprocessable Entity | Invalid request parameters (e.g. term too short). |
| `500` | Internal Error | Something went wrong on our end. |

---

## 🛠️ Best Practices
1. **Handle Latency:** AI-powered fuzzy match logic typically takes 100ms-300ms. Handle synchronously only if your UI requires it.
2. **Threshold Tuning:** A threshold of `0.80` is standard. Upgrade to `0.90` if false positives occur frequently.
3. **Audit Readiness:** All direct API calls are automatically logged in your Dashboard's **Screening History** for compliance reporting.
