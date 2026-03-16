"use client";
import React, { useState } from 'react';
import { Search, Loader2, ShieldCheck, AlertCircle, Settings2, Sliders } from 'lucide-react';

export default function SearchSection({ onSearch, loading, result }) {
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Advanced Settings
  const [threshold, setThreshold] = useState(0.8);
  const [entityType, setEntityType] = useState("individual");
  const [country, setCountry] = useState("");

  const handleSumbit = (e) => {
    e.preventDefault();
    onSearch(query, {
      threshold,
      type: entityType,
      country: country || null
    });
  };

  return (
    <div className="search-container">
      <div className="search-header">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.4rem' }}>Global Sanctions Screening</h2>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>Screen any person, company, or vessel against global watchlists in real-time.</p>
        </div>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="btn-settings"
        >
          <Settings2 size={16} /> Advanced Settings
        </button>
      </div>

      <form onSubmit={handleSumbit} style={{ position: 'relative' }}>
        <div className="input-group">
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#444' }} />
            <input
              type="text"
              placeholder="Enter Entity Name (e.g. WHALE SHIPPING LTD.)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <button 
            className="btn btn-primary btn-submit" 
            disabled={loading || !query} 
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Analyze Risk"}
          </button>
        </div>

        {/* Dynamic Advanced Controls */}
        {showFilters && (
          <div className="advanced-panel">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label style={labelStyle}>MATCH PRECISION</label>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--accent)' }}>{(threshold * 100).toFixed(0)}%</span>
              </div>
              <input 
                type="range" 
                min="0.5" 
                max="1.0" 
                step="0.05" 
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer' }} 
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '0.6rem', color: '#444' }}>Fuzzy (50%)</span>
                <span style={{ fontSize: '0.6rem', color: '#444' }}>Exact (100%)</span>
              </div>
            </div>

            <div>
              <label style={labelStyle}>ENTITY TYPE</label>
              <select 
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
                style={selectStyle}
              >
                <option value="individual">Individual</option>
                <option value="entity">Organization / Entity</option>
                <option value="vessel">Vessel (Ship)</option>
                <option value="aircraft">Aircraft</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>COUNTRY FILTER (ISO)</label>
              <input 
                type="text" 
                placeholder="e.g. NG, US, GB"
                value={country}
                onChange={(e) => setCountry(e.target.value.toUpperCase().slice(0, 2))}
                style={selectStyle}
              />
            </div>
          </div>
        )}
      </form>

      {result && (
        <div style={{ 
          marginTop: '1.5rem', 
          padding: '1.25rem', 
          borderRadius: '16px', 
          background: result.match_found ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)',
          border: `1px solid ${result.match_found ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {result.match_found ? (
              <AlertCircle size={24} style={{ color: '#ef4444' }} />
            ) : (
              <ShieldCheck size={24} style={{ color: '#10b981' }} />
            )}
            <div>
              <p style={{ fontWeight: '800', margin: 0, color: result.match_found ? '#ef4444' : '#10b981' }}>
                {result.match_found ? `FLAGGED: ${result.highest_confidence * 100}% MATCH DETECTED` : "NO MATCH FOUND - SAFE TO PROCEED"}
              </p>
              <p style={{ fontSize: '0.8rem', color: '#666', margin: 0 }}>
                {result.match_found ? "An entity with a high similarity score has been found in the watchlists." : "Query returned zero high-confidence matches."}
              </p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .search-container {
          background: rgba(255,255,255,0.01);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.05);
          padding: 2rem;
          margin-bottom: 2rem;
          border-radius: 24px;
        }
        .search-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
          gap: 1rem;
        }
        .btn-settings {
          background: #0a0a0c;
          border: 1px solid rgba(255,255,255,0.15);
          padding: 0.5rem 1rem;
          border-radius: 10px;
          color: #888;
          font-size: 0.8rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .input-group {
          display: flex;
          gap: 1rem;
        }
        .search-input {
          padding-left: 3rem;
          width: 100%;
          height: 56px;
          border-radius: 16px;
          font-size: 1rem;
          background: #0a0a0c;
          border: 1px solid rgba(255,255,255,0.15);
          color: #fff;
          outline: none;
        }
        .btn-submit {
          padding: 0 2rem;
          height: 56px;
          border-radius: 16px;
          min-width: 160px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.8rem;
        }
        .advanced-panel {
          background: #0a0a0c; 
          padding: 1.5rem; 
          border-radius: 16px; 
          border: 1px solid rgba(255,255,255,0.15);
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-top: 1rem;
        }

        @media (max-width: 768px) {
          .search-header { flex-direction: column; }
          .btn-settings { width: 100%; justify-content: center; }
          .input-group { flex-direction: column; }
          .btn-submit { width: 100%; }
        }
        @media (max-width: 480px) {
          .search-container { padding: 1.2rem; }
          .advanced-panel { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

const labelStyle = { fontSize: '0.65rem', fontWeight: '800', color: '#666', letterSpacing: '0.05em', marginBottom: '0.5rem', display: 'block' };
const selectStyle = { 
  width: '100%', 
  height: '44px', 
  background: '#0a0a0c', 
  border: '1px solid rgba(255,255,255,0.15)', 
  borderRadius: '10px', 
  color: '#ccc', 
  padding: '0 0.75rem', 
  fontSize: '0.9rem',
  outline: 'none'
};
