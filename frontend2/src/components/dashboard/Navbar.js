"use client";
import Link from 'next/link';
import { LogOut } from 'lucide-react';

export default function Navbar({ isLive, setIsLive, handleSignOut }) {
  return (
    <nav style={{ height: 'auto', minHeight: '72px', py: '10px' }}>
      <div style={{ 
        maxWidth: '1600px', 
        margin: '0 auto', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '0.75rem 2rem',
        width: '100%'
      }}>
        {/* LEFT: Logo & Links */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '2rem' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div className="logo" style={{ fontSize: '1.2rem', whiteSpace: 'nowrap' }}>AML CHECK API</div>
          </Link>
          <Link href="/dashboard/docs" style={{ 
            textDecoration: 'none', 
            fontSize: '0.85rem', 
            color: '#888', 
            fontWeight: '600',
            transition: 'color 0.2s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = '#fff')}
          onMouseOut={(e) => (e.currentTarget.style.color = '#888')}
          >
            Documentation
          </Link>
        </div>

        {/* CENTER: Environment Toggle */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <div style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.05)',
            padding: '4px',
            borderRadius: '10px',
            border: '1px solid var(--card-border)'
          }}>
            <button
              onClick={() => setIsLive(false)}
              className="btn"
              style={{
                padding: '6px 12px',
                fontSize: '0.7rem',
                background: !isLive ? 'var(--primary)' : 'transparent',
                borderRadius: '6px'
              }}
            >
              Test
            </button>
            <button
              onClick={() => setIsLive(true)}
              className="btn"
              style={{
                padding: '6px 12px',
                fontSize: '0.7rem',
                background: isLive ? 'var(--accent)' : 'transparent',
                borderRadius: '6px'
              }}
            >
              Live
            </button>
          </div>
        </div>

        {/* RIGHT: Actions */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            onClick={handleSignOut}
            className="btn btn-outline" 
            style={{ gap: '0.5rem', fontSize: '0.8rem', padding: '0.5rem 1rem' }}
          >
            <LogOut size={14} /> <span className="mobile-hide">Sign Out</span>
          </button>
        </div>
      </div>
      <style jsx>{`
        @media (max-width: 480px) {
          .mobile-hide { display: none; }
        }
      `}</style>
    </nav>
  );
}
