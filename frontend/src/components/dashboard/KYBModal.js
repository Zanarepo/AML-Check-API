"use client";
import { Check, Loader2, Database } from 'lucide-react';

export default function KYBModal({ 
  kybSubmitted, kybForm, setKybForm, formError, setFormError, 
  isSubmitting, selectedFile, setSelectedFile, fileInputRef, 
  handleSubmitKYB, setShowKYB 
}) {
  return (
    <div style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      background: 'rgba(5, 5, 7, 0.95)', 
      backdropFilter: 'blur(16px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
    }}>
      <div className="glass-card" style={{ 
        maxWidth: '500px', 
        width: '100%', 
        border: '1px solid rgba(16, 185, 129, 0.3)',
        padding: '1.5rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        {kybSubmitted ? (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ 
              width: '60px', height: '60px', borderRadius: '50%', 
              background: 'rgba(16, 185, 129, 0.1)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              margin: '0 auto 1.25rem' 
            }}>
              <Check size={32} style={{ color: 'var(--accent)' }} />
            </div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Verification Pending</h2>
            <p style={{ color: 'var(--muted)', lineHeight: '1.5', fontSize: '0.9rem' }}>
              Your credentials have been uploaded. Review takes within 1 business day.
            </p>
            <button onClick={() => setShowKYB(false)} className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%' }}>Done</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '0.2rem' }}>Business Verification</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Step 1: Company Credentials</p>
              </div>
              <button 
                onClick={() => setShowKYB(false)} 
                style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer', width: '28px', height: '28px', borderRadius: '6px' }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="label">LEGAL ENTITY NAME</label>
                <input 
                  type="text" 
                  className="input-field"
                  placeholder="e.g. Sellytics Global Ltd" 
                  value={kybForm.name}
                  onChange={(e) => {setKybForm({...kybForm, name: e.target.value}); setFormError("");}}
                  style={{ borderColor: formError && !kybForm.name ? '#ef4444' : 'var(--card-border)' }} 
                />
              </div>
              
              <div className="flex-responsive" style={{ gap: '1rem' }}>
                <div style={{ flex: 1, width: '100%' }}>
                  <label className="label">REG. NUMBER (RC)</label>
                  <input 
                    type="text" 
                    className="input-field"
                    placeholder="RC123456" 
                    value={kybForm.rc}
                    onChange={(e) => {setKybForm({...kybForm, rc: e.target.value}); setFormError("");}}
                    style={{ borderColor: formError && !kybForm.rc ? '#ef4444' : 'var(--card-border)' }} 
                  />
                </div>
                <div style={{ flex: 1, width: '100%' }}>
                  <label className="label">HQ COUNTRY</label>
                  <select 
                    className="input-field"
                    value={kybForm.country}
                    onChange={(e) => setKybForm({...kybForm, country: e.target.value})}
                  >
                    <option style={{ background: '#1a1a1e' }}>Nigeria</option>
                    <option style={{ background: '#1a1a1e' }}>Kenya</option>
                    <option style={{ background: '#1a1a1e' }}>Ghana</option>
                    <option style={{ background: '#1a1a1e' }}>United Kingdom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">INDUSTRY SECTOR</label>
                <select 
                  className="input-field"
                  value={kybForm.sector}
                  onChange={(e) => setKybForm({...kybForm, sector: e.target.value})}
                >
                  <option style={{ background: '#1a1a1e' }}>Fintech & Payments</option>
                  <option style={{ background: '#1a1a1e' }}>Digital Banking</option>
                  <option style={{ background: '#1a1a1e' }}>Cryptocurrency</option>
                  <option style={{ background: '#1a1a1e' }}>Logistics & Supply Chain</option>
                </select>
              </div>

              <div>
                <label className="label">UPLOAD CAC / INCORPORATION DOCS</label>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  style={{ display: 'none' }}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <div 
                  onClick={() => fileInputRef.current.click()}
                  style={{ 
                    border: '2px dashed var(--card-border)', 
                    padding: '1.5rem 1rem', 
                    borderRadius: '10px', 
                    textAlign: 'center', 
                    cursor: 'pointer',
                    background: 'rgba(255,255,255,0.02)',
                  }}
                >
                  <Database size={20} style={{ color: selectedFile ? 'var(--accent)' : 'var(--muted)', marginBottom: '0.5rem' }} />
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                    {selectedFile ? `Selected: ${selectedFile.name}` : "Drop PDF here or browse"}
                  </p>
                </div>
              </div>

              {formError && <p style={{ color: '#ef4444', fontSize: '0.75rem', textAlign: 'center' }}>{formError}</p>}

              <button 
                onClick={handleSubmitKYB}
                className="btn btn-primary" 
                disabled={isSubmitting}
                style={{ 
                  width: '100%', 
                  background: 'var(--accent)', 
                  padding: '0.8rem',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  display: 'flex',
                  gap: '0.5rem',
                  opacity: isSubmitting ? 0.7 : 1
                }}
              >
                {isSubmitting ? <><Loader2 size={18} className="animate-spin" /> Submitting...</> : "Submit Verification Request"}
              </button>
            </div>
          </>
        )}
      </div>
      <style jsx>{`
        .label {
          font-size: 0.65rem;
          font-weight: 600;
          color: var(--muted);
          display: block;
          margin-bottom: 0.4rem;
          letter-spacing: 0.05em;
        }
        .input-field {
          width: 100%;
          padding: 0.75rem 0.85rem;
          border-radius: 8px;
          background: rgba(0,0,0,0.2);
          border: 1px solid var(--card-border);
          color: white;
          font-size: 0.85rem;
          outline: none;
        }
      `}</style>
    </div>
  );
}
