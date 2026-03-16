"use client";
import { Key, Copy, Check, Shield, RefreshCw, AlertTriangle, ExternalLink } from 'lucide-react';

export default function ApiKeySection({ 
  isLive, isVerified, apiKey, revealedKey, isRolling, 
  copied, copyToClipboard, handleRollKey, setRevealedKey, setShowKYB 
}) {
  const currentKey = revealedKey || (isLive ? (isVerified ? "sk_live_AKBavtDuwcrBsuljdYqJsWMQ_uCyHtx9_DbOGIeF2NQ" : "sk_live_••••••••••••••••") : apiKey);

  return (
    <div className="glass-card" style={{ 
      marginBottom: '2rem', 
      padding: '2rem', 
      borderRadius: '24px', 
      border: '1px solid rgba(255,255,255,0.05)',
      background: 'rgba(255,255,255,0.01)',
      animation: 'slideDown 0.3s ease-out'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
             <Key size={18} style={{ color: isLive ? 'var(--accent)' : 'var(--primary)' }} />
             {isLive ? 'Live Production Keys' : 'Sandbox / Test Keys'}
          </h2>
          <p style={{ color: '#666', fontSize: '0.85rem' }}>These keys allow your applications to communicate with the AML Check API.</p>
        </div>
        {isLive && !isVerified && (
          <button 
            onClick={() => setShowKYB(true)}
            style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              color: '#ef4444', 
              border: '1px solid rgba(239, 68, 68, 0.2)', 
              padding: '0.5rem 1rem', 
              borderRadius: '10px', 
              fontSize: '0.75rem', 
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Verification Required
          </button>
        )}
      </div>

      <div style={{ position: 'relative' }}>
        {/* Verification Overlay for Live */}
        {isLive && !isVerified && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(10,10,12,0.85)',
            backdropFilter: 'blur(4px)',
            zIndex: 5,
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
             <Shield size={24} style={{ color: '#ef4444' }} />
             <p style={{ fontWeight: '700', fontSize: '0.9rem' }}>Live Mode Locked</p>
             <p style={{ fontSize: '0.75rem', color: '#666' }}>Keys will be revealed after KYB approval.</p>
          </div>
        )}

        <div style={{ 
          background: '#000', 
          padding: '1.5rem', 
          borderRadius: '16px', 
          border: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#444', letterSpacing: '0.05em' }}>
               {isLive ? 'PRODUCTION_SECRET_KEY' : 'SANDBOX_SECRET_KEY'}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={copyToClipboard} 
                className="btn btn-primary" 
                style={{ height: '32px', padding: '0 0.75rem', fontSize: '0.75rem', borderRadius: '8px' }}
                disabled={isLive && !isVerified}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? "Copied" : "Copy"}
              </button>
              <button 
                onClick={handleRollKey}
                disabled={isRolling || (isLive && !isVerified)}
                className="btn btn-outline"
                style={{ width: '32px', height: '32px', padding: 0, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <RefreshCw size={12} className={isRolling ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          <code style={{ 
            fontSize: '1rem', 
            color: isLive ? 'var(--accent)' : 'var(--primary)', 
            wordBreak: 'break-all',
            fontFamily: 'monospace',
            opacity: isLive && !isVerified ? 0.3 : 1
          }}>
            {currentKey}
          </code>
        </div>
      </div>

      {revealedKey && (
        <div style={{ 
          marginTop: '1.5rem', 
          padding: '1rem', 
          background: 'rgba(239, 68, 68, 0.05)', 
          border: '1px solid rgba(239, 68, 68, 0.1)', 
          borderRadius: '12px',
          display: 'flex',
          gap: '0.8rem',
          alignItems: 'center'
        }}>
          <AlertTriangle style={{ color: '#ef4444' }} size={16} />
          <p style={{ fontSize: '0.8rem', color: '#ccc', margin: 0, flex: 1 }}>
            <strong>New Key Generated.</strong> Copy it now as it won't be displayed again for security.
          </p>
          <button onClick={() => setRevealedKey(null)} style={{ background: 'none', border: 'none', color: '#666', fontSize: '0.7rem', textDecoration: 'underline', cursor: 'pointer' }}>Dismiss</button>
        </div>
      )}

      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <p style={{ fontSize: '0.75rem', color: '#444', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
           <AlertTriangle size={12} /> Never share keys in public repositories.
        </p>
        <a href="#" style={{ fontSize: '0.75rem', color: 'var(--accent)', textDecoration: 'none', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
           API Documentation <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}
