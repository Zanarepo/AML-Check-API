"use client";
import React from 'react';
import { Database, Search, Filter, Loader2 } from 'lucide-react';

export default function RecentActivity({ 
  history, 
  onSelectLog,
  search,
  setSearch,
  filter,
  setFilter,
  hasMore,
  onLoadMore,
  loading
}) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="activity-card">
      {/* Header with Search & Filters */}
      <div className="activity-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Database size={20} style={{ color: 'var(--secondary)' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Screening History</h2>
        </div>

        <div className="controls-group">
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#444' }} />
            <input 
              type="text" 
              placeholder="Search term..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="control-input"
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Filter size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#444' }} />
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="control-select"
            >
              <option value="all" style={{ background: '#0a0a0c', color: '#fff' }}>All Logs</option>
              <option value="flagged" style={{ background: '#0a0a0c', color: '#fff' }}>Flagged</option>
              <option value="clean" style={{ background: '#0a0a0c', color: '#fff' }}>Clean</option>
            </select>
          </div>
        </div>
      </div>

      {history && history.length > 0 ? (
        <div className="table-wrapper">
          {loading && history.length > 0 && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'var(--accent)', animation: 'pulse 1.5s infinite', zIndex: 10 }}></div>
          )}
          <table style={{ minWidth: '800px', width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ color: '#444', fontSize: '0.65rem', fontWeight: '800', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <th style={{ padding: '1rem 0' }}>TIMESTAMP</th>
                <th style={{ padding: '1rem 0' }}>SEARCH TERM</th>
                <th style={{ padding: '1rem 0' }}>MATCH %</th>
                <th style={{ padding: '1rem 0' }}>RESULT</th>
                <th style={{ padding: '1rem 0' }}>AUDIT STATUS</th>
              </tr>
            </thead>
            <tbody>
              {history.map((log) => {
                const results = log.query_parameters?._results;
                const matchFound = results?.match_found;
                const confidenceVal = results?.highest_confidence ?? results?.confidence_score;
                const confidence = confidenceVal != null ? (confidenceVal * 100).toFixed(1) : null;

                return (
                  <tr
                    key={log.id}
                    onClick={() => onSelectLog(log)}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.02)',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.01)')}
                    onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '1.25rem 0', color: '#666', fontSize: '0.8rem' }}>
                      {formatDate(log.timestamp)}
                    </td>
                    <td style={{ fontWeight: '700', color: '#fff' }}>
                      {log.query_parameters?.search_term || "N/A"}
                    </td>
                    <td>
                      {confidence !== null ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: '800', color: matchFound ? '#ef4444' : '#888' }}>{confidence}%</span>
                        </div>
                      ) : (
                        <span style={{ color: '#444', fontSize: '0.75rem' }}>N/A</span>
                      )}
                    </td>
                    <td>
                      <span style={{
                        background: matchFound ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: matchFound ? '#ef4444' : '#10b981',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '0.65rem',
                        fontWeight: '900',
                        border: `1px solid ${matchFound ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
                      }}>
                        {matchFound ? "FLAGGED" : "CLEAN"}
                      </span>
                    </td>
                    <td style={{ color: '#444', fontSize: '0.8rem' }}>
                      HTTP {log.response_status}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {hasMore && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <button 
                onClick={(e) => { e.stopPropagation(); onLoadMore(); }}
                disabled={loading}
                className="btn btn-outline" 
                style={{ padding: '0.6rem 2rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }}
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {loading ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '5rem 0', color: '#444' }}>
          {loading ? (
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 1.5rem auto', color: 'var(--accent)' }} />
          ) : (
            <>
              <Database size={32} style={{ margin: '0 auto 1.5rem auto', opacity: 0.1 }} />
              <p style={{ fontWeight: '700', fontSize: '1rem', color: '#666' }}>No History Found</p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Try changing your filters or search term.</p>
            </>
          )}
        </div>
      )}

      <style jsx>{`
        .activity-card {
          background: rgba(255,255,255,0.01);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.05);
          margin-top: 2rem;
          padding: 2rem;
          border-radius: 24px;
        }
        .activity-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          gap: 1.5rem;
        }
        .controls-group {
          display: flex;
          gap: 1rem;
          flex: 1;
          justify-content: flex-end;
          min-width: 300px;
        }
        .control-input {
          width: 100%;
          height: 40px;
          background: #0a0a0c;
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 10px;
          padding-left: 2.5rem;
          color: #fff;
          font-size: 0.85rem;
          outline: none;
        }
        .control-select {
          height: 40px;
          background: #0a0a0c;
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 10px;
          padding-left: 2.5rem;
          padding-right: 2rem;
          color: #fff;
          font-size: 0.85rem;
          appearance: none;
          outline: none;
          cursor: pointer;
          font-weight: 600;
        }
        .table-wrapper {
          overflow-x: auto;
          width: 100%;
          position: relative;
        }

        @media (max-width: 768px) {
          .activity-card { padding: 1.2rem; }
          .activity-header { flex-direction: column; align-items: flex-start; }
          .controls-group { width: 100%; min-width: 100%; flex-direction: column; }
          .control-select { width: 100%; }
        }
      `}</style>
    </div>
  );
}
