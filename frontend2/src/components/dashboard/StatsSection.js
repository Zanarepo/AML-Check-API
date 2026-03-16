"use client";
import { Activity, ShieldCheck, Zap, Info, ChevronDown, ChevronUp, Key } from 'lucide-react';

export default function SummaryStats({ stats, loading, isLive, showKeys, onToggleKeys }) {
  const quota = stats?.limit || (isLive ? 5000 : 1000);
  const planTier = stats?.tier || (isLive ? "PRO" : "FREE");
  const currentRequests = stats?.requests || 0;
  const progress = Math.min((currentRequests / quota) * 100, 100);

  const Skeleton = ({ width = '100px', height = '20px' }) => (
    <div className="skeleton" style={{ width, height, borderRadius: '4px' }}></div>
  );

  return (
    <div className="stats-card">
      {/* Top Row: Meta & Toggles */}
      <div className="stats-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Activity size={18} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff' }}>Usage Overview</span>
          </div>
          <div className="divider" style={{ height: '16px', width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
          {loading ? <Skeleton width="60px" height="24px" /> : (
            <span style={{ 
              fontSize: '0.65rem', 
              background: isLive ? 'rgba(52, 152, 219, 0.1)' : 'rgba(255, 255, 255, 0.05)', 
              color: isLive ? '#3498db' : '#888',
              padding: '4px 12px',
              borderRadius: '20px',
              fontWeight: '800',
              border: `1px solid ${isLive ? 'rgba(52, 152, 219, 0.2)' : 'rgba(255, 255, 255, 0.1)'}`,
            }}>
              {planTier} TIER
            </span>
          )}
        </div>

        <button 
          onClick={onToggleKeys}
          className="btn-toggle"
        >
          <Key size={14} />
          <span>{showKeys ? "Hide API Credentials" : "View API Credentials"}</span>
          {showKeys ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Main Stats Row */}
      <div className="stats-grid">
        {/* Progress Bar Group */}
        <div style={{ flex: 2, minWidth: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', alignItems: 'flex-end' }}>
            <span style={{ color: '#666', fontSize: '0.8rem', fontWeight: '600' }}>MONTHLY VOLUME</span>
            <div style={{ textAlign: 'right' }}>
              {loading ? <Skeleton width="120px" height="28px" /> : (
                <>
                  <span style={{ fontSize: '1.2rem', fontWeight: '900', color: '#fff' }}>{currentRequests.toLocaleString()}</span>
                  <span style={{ fontSize: '0.8rem', color: '#444', marginLeft: '0.4rem' }}>/ {quota.toLocaleString()}</span>
                </>
              )}
            </div>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.02)' }}>
            <div style={{ 
              width: `${loading ? 0 : progress}%`, 
              height: '100%', 
              background: progress > 90 ? 'linear-gradient(90deg, #ef4444, #ff8080)' : 'linear-gradient(90deg, var(--accent), #2ecc71)',
              transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)'
            }}></div>
          </div>
        </div>

        {/* Mini Stats */}
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '100px' }}>
            <div style={{ color: '#444', fontSize: '0.65rem', fontWeight: '800', letterSpacing: '0.05em', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Zap size={10} /> LATENCY
            </div>
            {loading ? <Skeleton width="60px" height="24px" /> : (
              <p style={{ margin: 0, fontWeight: '800', fontSize: '1.1rem', color: '#fff' }}>120<span style={{ fontSize: '0.7rem', color: '#666', marginLeft: '2px' }}>ms</span></p>
            )}
          </div>
          <div className="divider" style={{ height: '30px', width: '1px', background: 'rgba(255,255,255,0.05)', alignSelf: 'center' }}></div>
          <div style={{ flex: 1, minWidth: '100px' }}>
            <div style={{ color: '#444', fontSize: '0.65rem', fontWeight: '800', letterSpacing: '0.05em', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <ShieldCheck size={10} /> HIT RATE
            </div>
            {loading ? <Skeleton width="60px" height="24px" /> : (
              <p style={{ margin: 0, fontWeight: '800', fontSize: '1.1rem', color: '#fff' }}>{stats?.hitRate || "12.5"}<span style={{ fontSize: '0.7rem', color: '#666', marginLeft: '2px' }}>%</span></p>
            )}
          </div>
        </div>
      </div>


      <style jsx>{`
        .stats-card {
          background: rgba(255,255,255,0.01);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.05);
          margin-bottom: 2rem;
          padding: 1.5rem 2rem;
          border-radius: 24px;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .stats-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 2.5rem;
          align-items: center;
        }
        .btn-toggle {
          background: #0a0a0c;
          border: 1px solid rgba(255,255,255,0.15);
          padding: 0.5rem 1rem;
          border-radius: 12px;
          color: #888;
          font-size: 0.8rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-toggle:hover { color: #fff; border-color: rgba(255,255,255,0.3); }

        @media (max-width: 900px) {
          .stats-grid { grid-template-columns: 1fr; gap: 1.5rem; }
        }
        @media (max-width: 600px) {
          .stats-card { padding: 1.2rem; }
          .stats-header { flex-direction: column; align-items: flex-start; }
          .btn-toggle { width: 100%; justify-content: space-between; }
          .divider { display: none; }
        }
      `}</style>
    </div>
  );
}
