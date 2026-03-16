"use client";
import React, { useState } from 'react';
import Navbar from '@/components/dashboard/Navbar';
import { useDashboard } from '@/hooks/useDashboard';
import { 
  Book, 
  Terminal, 
  Key, 
  Globe, 
  Cpu, 
  Code2, 
  Copy, 
  CheckCircle2, 
  AlertTriangle,
  ArrowLeft 
} from 'lucide-react';
import Link from 'next/link';


export default function DocsPage() {
  const { isLive, setIsLive, handleSignOut } = useDashboard();
  const [activeTab, setActiveTab] = useState('python');
  const [copiedSection, setCopiedSection] = useState(null);

  const copyCode = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const sections = [
    {
      id: "auth",
      title: "Authentication",
      icon: <Key size={20} className="text-accent" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-400">All requests must include your Secret API Key in the custom header block.</p>
          <div className="code-block">
            <span className="text-gray-500">Header:</span> 
            <span className="text-white ml-2">x-api-key: sk_live_...</span>
          </div>
          <div className="alert-box">
            <AlertTriangle size={18} className="text-yellow-500" />
            <p>Never share your secret keys in client-side code or public repositories.</p>
          </div>
        </div>
      )
    },
    {
      id: "screening",
      title: "Screening Endpoint",
      icon: <Globe size={20} className="text-accent" />,
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="badge bg-green-500/10 text-green-500 border border-green-500/20">POST</span>
            <code className="text-accent">/v1/screen</code>
          </div>
          <table className="docs-table">
            <thead>
              <tr>
                <th>FIELD</th>
                <th>REQUIRED</th>
                <th>DESCRIPTION</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code className="text-white">search_term</code></td>
                <td><span className="text-red-500">Yes</span></td>
                <td>Name of person or organization</td>
              </tr>
              <tr>
                <td><code className="text-white">entity_type</code></td>
                <td>No</td>
                <td>individual, entity, vessel, aircraft</td>
              </tr>
              <tr>
                <td><code className="text-white">fuzziness</code></td>
                <td>No</td>
                <td>0.0 - 1.0 (Match precision)</td>
              </tr>
            </tbody>
          </table>
        </div>
      )
    }
  ];

  const pythonCode = `import requests
import json

def aml_check(name):
    url = "https://api.amlcheck.pro/v1/screen"
    headers = {
        "x-api-key": "sk_live_v2_f82...",
        "Content-Type": "application/json"
    }
    payload = {
        "search_term": name,
        "fuzziness_threshold": 0.85
    }

    response = requests.post(url, json=payload, headers=headers)
    return response.json()

# Result Analysis
result = aml_check("John Doe")
if result['match_found']:
    print(f"Match Detected! Score: {result['highest_confidence']}")`;

  const jsCode = `const screenEntity = async (name) => {
  const url = "https://api.amlcheck.pro/v1/screen";
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'sk_live_v2_f82...'
    },
    body: JSON.stringify({
      search_term: name,
      entity_type: "individual"
    })
  });

  const data = await response.json();
  return data;
};

// Execute
const result = await screenEntity("John Doe");`;

  return (
    <div style={{ minHeight: '100vh', background: '#050507', color: '#fff' }}>
      <Navbar isLive={isLive} setIsLive={setIsLive} handleSignOut={handleSignOut} />

      <div className="docs-container">
        {/* Sidebar */}
        <aside className="docs-sidebar">
          <div className="sidebar-group">
            <h3>Getting Started</h3>
            <a href="#intro" className="active">Overview</a>
            <a href="#auth">Authentication</a>
            <a href="#quickstart">Quickstart</a>
          </div>
          <div className="sidebar-group">
            <h3>API Reference</h3>
            <a href="#screening">Screening API</a>
            <a href="#usage">Usage Stats</a>
            <a href="#errors">Error Codes</a>
          </div>
        </aside>

        {/* Main Content */}
        <main className="docs-content">
          <Link href="/dashboard" className="back-link">
            <div className="back-icon">
              <ArrowLeft size={14} strokeWidth={3} />
            </div>
            <span>Back to Dashboard</span>
          </Link>


          <header className="docs-header">

            <div className="flex items-center gap-4 mb-4">
              <Book className="text-accent" size={32} />
              <h1 style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-0.02em' }}>API Documentation</h1>
            </div>
            <p style={{ fontSize: '1.1rem', color: '#888', maxWidth: '800px', lineHeight: '1.6' }}>
              Integrate world-class sanctions screening directly into your application. 
              Our REST API allows for high-speed fuzzy matching against over 500+ global watchlists.
            </p>
          </header>

          <section id="intro" className="docs-section">
            <h2 className="section-title">Overview</h2>
            <div className="feature-grid">
              <div className="feature-card">
                <Cpu size={24} className="text-accent" />
                <h4>Vector Search</h4>
                <p>AI-powered semantic matching that catches misspellings and aliases.</p>
              </div>
              <div className="feature-card">
                <Terminal size={24} className="text-secondary" />
                <h4>Developer First</h4>
                <p>Standard REST patterns with JSON responses and detailed audit logs.</p>
              </div>
              <div className="feature-card">
                <Code2 size={24} className="text-primary" />
                <h4>Global Coverage</h4>
                <p>Real-time access to OFAC, UN, EU, and African central bank watchlists.</p>
              </div>
            </div>
          </section>

          <section id="auth" className="docs-section">
            <h2 className="section-title">Authentication</h2>
            <p style={{ color: '#888', marginBottom: '1.5rem' }}>
              Authorize your requests by including your secret API key in the <code className="text-accent">x-api-key</code> header.
            </p>
            <div className="code-container">
              <code>x-api-key: your_secret_key_here</code>
            </div>
          </section>

          <section id="quickstart" className="docs-section">
            <h2 className="section-title">Code Samples</h2>
            <div className="tab-container">
              <div className="tabs">
                <button 
                  className={activeTab === 'python' ? 'tab active' : 'tab'} 
                  onClick={() => setActiveTab('python')}
                >
                  Python
                </button>
                <button 
                  className={activeTab === 'javascript' ? 'tab active' : 'tab'} 
                  onClick={() => setActiveTab('javascript')}
                >
                  Node.js / JS
                </button>
              </div>
              <div className="tab-content">
                <div className="code-header">
                  <span>POST /v1/screen</span>
                  <button onClick={() => copyCode(activeTab === 'python' ? pythonCode : jsCode, 'code')}>
                    {copiedSection === 'code' ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                <pre>
                  {activeTab === 'python' ? pythonCode : jsCode}
                </pre>
              </div>
            </div>
          </section>

          <section id="response" className="docs-section">
            <h2 className="section-title">Response Structure</h2>
            <p style={{ color: '#888', marginBottom: '1.5rem' }}>
              The API returns a standardized JSON object. Even if no matches are found, you will receive a <code className="text-secondary">200 OK</code> with an empty results array.
            </p>
            <div className="tab-container">
              <div className="code-header">JSON PAYLOAD EXAMPLE</div>
              <pre>{`{
  "search_term": "AL-QAEDA",
  "match_found": true,
  "highest_confidence": 1.0,
  "results": [
    {
      "name": "AL-QA'IDA",
      "similarity": 1.0,
      "entity_type": "entity",
      "reason_for_sanction": "Foreign Terrorist Organization",
      "source_url": "https://..."
    }
  ]
}`}</pre>
            </div>
          </section>

          <section id="errors" className="docs-section">
            <h2 className="section-title">Error Codes</h2>
            <table className="docs-table">
              <thead>
                <tr>
                  <th>CODE</th>
                  <th>MEANING</th>
                  <th>DESCRIPTION</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>401</td>
                  <td>Unauthorized</td>
                  <td>Invalid or missing API key</td>
                </tr>
                <tr>
                  <td>402</td>
                  <td>Payment Required</td>
                  <td>Monthly usage quota exceeded</td>
                </tr>
                <tr>
                  <td>403</td>
                  <td>Forbidden</td>
                  <td>Feature not available on your plan</td>
                </tr>
                <tr>
                  <td>500</td>
                  <td>Server Error</td>
                  <td>Internal processing issue</td>
                </tr>
              </tbody>
            </table>
          </section>
        </main>
      </div>

      <style jsx>{`
        .docs-container {
          display: grid;
          grid-template-columns: 280px 1fr;
          max-width: 1600px;
          margin: 0 auto;
          padding: 120px 2rem 5rem 2rem;
          gap: 4rem;
        }
        .docs-sidebar {
          position: sticky;
          top: 120px;
          height: fit-content;
        }
        .sidebar-group {
          margin-bottom: 2.5rem;
        }
        .sidebar-group h3 {
          font-size: 0.75rem;
          text-transform: uppercase;
          color: #444;
          letter-spacing: 0.1em;
          margin-bottom: 1rem;
          font-weight: 800;
        }
        .sidebar-group a {
          display: block;
          color: #888;
          text-decoration: none;
          font-size: 0.9rem;
          margin-bottom: 0.8rem;
          transition: all 0.2s;
          font-weight: 600;
        }
        .sidebar-group a:hover, .sidebar-group a.active {
          color: #fff;
          padding-left: 0.5rem;
          border-left: 2px solid var(--accent);
        }
        .docs-content {
          max-width: 900px;
        }
        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          color: #666;
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 700;
          margin-bottom: 2.5rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .back-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          transition: all 0.3s ease;
        }
        .back-link:hover {
          color: #fff;
        }
        .back-link:hover .back-icon {
          background: var(--primary);
          border-color: var(--primary);
          box-shadow: 0 0 15px var(--primary-glow);
          transform: translateX(-4px);
        }


        .docs-header {
          margin-bottom: 5rem;
          padding-bottom: 3rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .docs-section {
          margin-bottom: 6rem;
        }
        .section-title {
          font-size: 1.75rem;
          font-weight: 800;
          margin-bottom: 2rem;
          color: #fff;
        }
        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }
        .feature-card {
          padding: 2rem;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 20px;
        }
        .feature-card h4 {
          margin: 1rem 0 0.5rem 0;
          font-weight: 800;
        }
        .feature-card p {
          font-size: 0.85rem;
          color: #666;
          line-height: 1.5;
        }
        .code-container {
          background: #0a0a0c;
          padding: 1.5rem;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .tab-container {
          background: #0a0a0c;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.1);
          overflow: hidden;
        }
        .tabs {
          display: flex;
          background: rgba(255,255,255,0.03);
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .tab {
          padding: 1rem 2rem;
          background: transparent;
          border: none;
          color: #444;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .tab.active {
          color: var(--accent);
          background: rgba(16, 185, 129, 0.05);
          box-shadow: inset 0 -2px 0 var(--accent);
        }
        .code-header {
          display: flex;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          font-size: 0.75rem;
          color: #444;
          letter-spacing: 0.05em;
          font-weight: 800;
        }
        pre {
          padding: 1.5rem;
          color: #6fbef3;
          font-size: 0.9rem;
          line-height: 1.7;
          overflow-x: auto;
          font-family: 'JetBrains Mono', monospace;
        }
        .docs-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1rem;
        }
        .docs-table th {
          text-align: left;
          padding: 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          color: #444;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .docs-table td {
          padding: 1.2rem 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          font-size: 0.9rem;
          color: #888;
        }
        .alert-box {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background: rgba(234, 179, 8, 0.05);
          border: 1px solid rgba(234, 179, 8, 0.1);
          border-radius: 10px;
          font-size: 0.85rem;
          color: #ca8a04;
        }
        @media (max-width: 900px) {
          .docs-container { grid-template-columns: 1fr; padding-top: 160px; }
          .docs-sidebar { display: none; }
        }
      `}</style>
    </div>
  );
}
