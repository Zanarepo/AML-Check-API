"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Shield, Github, Mail, Chrome } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [lastProvider, setLastProvider] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      } else {
        setLoading(false);
      }
    }
    
    // Get last logged in provider from local storage
    const savedProvider = localStorage.getItem('last_login_provider');
    if (savedProvider) setLastProvider(savedProvider);
    
    checkUser();
  }, [router]);

  const handleLogin = async (provider) => {
    setLoading(true);
    localStorage.setItem('last_login_provider', provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });
    if (error) {
      alert(error.message);
      setLoading(false);
    }
  };

  if (loading) return <div className="hero-gradient" style={{ minHeight: '100vh', background: '#0a0a0c' }}></div>;

  return (
    <main className="hero-gradient" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <div style={{ marginBottom: '2rem' }}>
          <div className="animate-float" style={{ display: 'inline-block', padding: '1rem', background: 'var(--primary-glow)', borderRadius: '20px', marginBottom: '1rem' }}>
            <Shield size={42} style={{ color: 'var(--primary)' }} />
          </div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>AML Check API</h1>
          <p style={{ color: 'var(--muted)' }}>The Compliance Engine for African Fintech</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button 
            onClick={() => handleLogin('github')}
            className={`btn ${lastProvider === 'github' ? 'btn-primary' : 'btn-outline'}`} 
            style={{ 
              width: '100%', 
              gap: '0.75rem',
              border: lastProvider === 'github' ? 'none' : '1px solid var(--card-border)',
              position: 'relative'
            }}
          >
            <Github size={20} /> Continue with GitHub
            {lastProvider === 'github' && (
              <span style={{ position: 'absolute', right: '12px', fontSize: '0.65rem', background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '4px' }}>Last used</span>
            )}
          </button>
          
          <button 
            onClick={() => handleLogin('google')}
            className={`btn ${lastProvider === 'google' ? 'btn-primary' : 'btn-outline'}`} 
            style={{ 
              width: '100%', 
              gap: '0.75rem',
              border: lastProvider === 'google' ? 'none' : '1px solid var(--card-border)',
              position: 'relative'
            }}
          >
            <Chrome size={20} /> Continue with Google
            {lastProvider === 'google' && (
              <span style={{ position: 'absolute', right: '12px', fontSize: '0.65rem', background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '4px' }}>Last used</span>
            )}
          </button>
        </div>

        <p style={{ marginTop: '2rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </main>
  );
}
