"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Zap, Globe, Cpu } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    }
    checkUser();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0c' }} className="hero-gradient">
      <nav>
        <div className="container nav-content">
          <div className="logo">AML CHECK API</div>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            {isLoggedIn ? (
              <Link href="/dashboard" className="btn btn-primary" style={{ fontSize: '0.85rem' }}>Dashboard</Link>
            ) : (
              <>
                <Link href="/login" className="btn btn-outline" style={{ fontSize: '0.85rem' }}>Login</Link>
                <Link href="/login" className="btn btn-primary" style={{ fontSize: '0.85rem' }}>Get Started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="container" style={{ paddingTop: '150px', textAlign: 'center', paddingBottom: '4rem' }}>
        <h1 className="responsive-h1" style={{ maxWidth: '900px', margin: '0 auto 1.5rem auto', lineHeight: '1.1' }}>
          Unified Compliance for <span style={{ color: 'var(--primary)' }}>African Fintech.</span>
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--muted)', maxWidth: '700px', margin: '0 auto 3rem auto', padding: '0 1rem' }}>
          The only screening API that natively supports OFAC, UN, EFCC, and CBN directives with built-in AI fuzzy matching.
        </p>

        <div className="flex-responsive" style={{ justifyContent: 'center', gap: '1rem', marginBottom: '5rem' }}>
          <Link href={isLoggedIn ? "/dashboard" : "/login"} className="btn btn-primary main-cta">
            {isLoggedIn ? "Go to Dashboard" : "Start Screening Now"}
          </Link>
          <a
            href="http://127.0.0.1:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline main-cta"
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            Read Documentation
          </a>
        </div>

        <style jsx>{`
          .responsive-h1 {
            font-size: 4rem;
          }
          .main-cta {
            padding: 1rem 2.5rem;
            font-size: 1.1rem;
            width: auto;
          }
          @media (max-width: 768px) {
            .responsive-h1 {
              font-size: 2.25rem;
            }
            .main-cta {
              width: 100%;
              max-width: 320px;
              padding: 0.85rem 1.5rem;
              font-size: 1rem;
            }
            main {
              padding-top: 100px !important;
            }
          }
        `}</style>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginTop: '4rem' }}>
          <div className="glass-card">
            <Zap style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
            <h3>5-Minute Integration</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>One REST endpoint for all global and local African sanction lists.</p>
          </div>
          <div className="glass-card">
            <Cpu style={{ color: 'var(--accent)', marginBottom: '1rem' }} />
            <h3>AI Fuzzy Matching</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Typos and aliases won't slip through our neural search engine.</p>
          </div>
          <div className="glass-card">
            <Globe style={{ color: 'var(--secondary)', marginBottom: '1rem' }} />
            <h3>Local Support</h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Native scraping and OCR for CBN PDFs and EFCC wanted lists.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
