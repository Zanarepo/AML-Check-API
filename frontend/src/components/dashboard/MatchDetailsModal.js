"use client";
import React, { useState } from 'react';
import { X, ExternalLink, ShieldAlert, User, MapPin, Globe, Info, Calendar, ChevronRight, Lock } from 'lucide-react';

// Common OFAC sanction program codes mapping
const PROGRAM_CODES = {
  "IRAQ2": "Iraqi Sanctions (Former Regime / Senior Officials)",
  "SDGT": "Specially Designated Global Terrorist",
  "SDNT": "Specially Designated Narcotic Trafficker",
  "SDNTK": "Specially Designated Narcotics Kingpin",
  "RUSSIA-EO14024": "Russia-related Harmful Foreign Activities",
  "SYRIA": "Syrian Sanctions",
  "VENEZUELA-EO13850": "Venezuela-related Sanctions",
  "NKOREA": "North Korea Sanctions",
  "CUBA": "Cuban Assets Control Regulations",
  "BELARUS": "Belarus Sanctions",
  "CAATSA-RUSSIA": "CAATSA - Russia Section 231",
  "GLOMAG": "Global Magnitsky Human Rights Accountability Act",
  "IRAN": "Iranian Transactions and Sanctions Regulations",
  "FTO": "Foreign Terrorist Organization",
  "SDN": "Specially Designated National",
};

/**
 * Translates cryptic regulatory codes into human-readable text.
 * Works even for historical data already saved in the database.
 */
function translateReason(reason) {
  if (!reason) return "No specific reason provided.";

  // If it's already translated (via backend), just return it
  if (reason.length > 50) return reason;

  // Split by common delimiters: space, comma, semicolon, brackets
  const tokens = reason.toUpperCase().split(/[\s,;\[\]\(\)]+/).filter(t => t.length > 0);

  if (tokens.length === 0) return reason;

  const translated = tokens.map(token => {
    // Only translate if we have a match, otherwise keep the token
    return PROGRAM_CODES[token] || token;
  });

  // Unique matches only
  return [...new Set(translated)].join(" | ");
}

export default function MatchDetailsModal({ log, onClose }) {
  if (!log) return null;

  const queryParams = log.query_parameters || {};
  const results = queryParams._results || {};
  const matchFound = results.match_found;

  const allEntities = results.matched_entities || results.results || [];
  const sortedEntities = [...allEntities].sort((a, b) => (b.similarity || 0) - (a.similarity || 0));

  const topEntity = sortedEntities[0];
  const otherEntities = sortedEntities.slice(1);

  const displayConfidence = (score) => (score ? (score * 100).toFixed(1) : "0");
  const searchTerm = queryParams.search_term || "N/A";

  // Check if details are masked (Free Tier)
  const isLocked = topEntity?.reason_for_sanction?.includes("Upgrade to Pro");

  return (
    <div className="modal-overlay-global" style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.92)',
      backdropFilter: 'blur(15px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '1.5rem'
    }} onClick={onClose}>
      <div className="modal-content-global glass-card"
        style={{
          width: '100%',
          maxWidth: '700px',
          maxHeight: '85vh',
          background: '#0a0a0c',
          borderRadius: '28px',
          border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 0 60px rgba(0,0,0,0.8)'
        }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          padding: '1.5rem 2rem',
          background: matchFound ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              padding: '0.6rem',
              background: matchFound ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              borderRadius: '12px'
            }}>
              <ShieldAlert size={22} style={{ color: matchFound ? '#ef4444' : '#10b981' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', margin: 0, fontWeight: '700', letterSpacing: '0.02em' }}>COMPLIANCE INVESTIGATION</h2>
              <p style={{ fontSize: '0.75rem', color: '#666', margin: 0, fontWeight: '500' }}>
                AUDIT ID: {log.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.05)',
            color: '#888',
            padding: '0.5rem',
            borderRadius: '10px',
            cursor: 'pointer'
          }}>
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: '2rem', overflowY: 'auto', flex: 1 }} className="custom-scrollbar">
          <div style={{ marginBottom: '2.5rem' }}>
            <p style={labelStyle}>QUERY ANALYZED</p>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '900', textTransform: 'uppercase', margin: '0.2rem 0 0 0', color: matchFound ? '#fff' : '#10b981' }}>
              {searchTerm}
            </h1>
          </div>

          <div style={{ height: '1px', background: 'linear-gradient(90deg, rgba(255,255,255,0.1), transparent)', marginBottom: '2.5rem' }}></div>

          {matchFound && topEntity ? (
            <div style={{ position: 'relative' }}>
              {/* PRIMARY MATCH SECTION */}
              <div style={{ marginBottom: '3rem', filter: isLocked ? 'blur(4px)' : 'none', pointerEvents: isLocked ? 'none' : 'auto' }}>
                <h3 style={sectionTitleStyle}>
                  <Info size={14} /> PRIMARY WATCHLIST HIT
                </h3>

                <div style={primaryCardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <div>
                      <p style={labelStyle}>OFFICIAL ENTITY NAME</p>
                      <p style={{ fontSize: '1.2rem', fontWeight: '800', margin: '0.3rem 0' }}>{topEntity.entity_name}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={labelStyle}>CONFIDENCE</p>
                      <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#ef4444' }}>{displayConfidence(topEntity.similarity)}%</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div>
                      <p style={labelStyle}>NATIONALITY / REGION</p>
                      <p style={valStyle}><MapPin size={12} /> {topEntity.country_of_origin || "International"}</p>
                    </div>
                    <div>
                      <p style={labelStyle}>REGISTRY SOURCE</p>
                      <p style={valStyle}><Globe size={12} /> {topEntity.source_list?.toUpperCase()}</p>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <p style={labelStyle}>SANCTION REASON</p>
                    <div style={reasonBoxStyle}>
                      {translateReason(topEntity.reason_for_sanction)}
                    </div>
                  </div>

                  {topEntity.source_url && (
                    <a href={topEntity.source_url} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                      Open Official Record <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>

              {/* Locked Upgrade Promo */}
              {isLocked && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '100%',
                  textAlign: 'center',
                  zIndex: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1.5rem'
                }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    padding: '1.5rem',
                    borderRadius: '50%',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex'
                  }}>
                    <Lock size={32} style={{ color: 'var(--accent)' }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Full Investigation Report Locked</h3>
                    <p style={{ fontSize: '0.9rem', color: '#888', maxWidth: '300px', margin: '0 auto', lineHeight: '1.5' }}>
                      Free plan provides match detection only. Upgrade to Pro to see sanction reasons, aliases, and direct sources.
                    </p>
                  </div>
                  <button className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
                    Upgrade to Pro Plan
                  </button>
                </div>
              )}

              {/* SECONDARY MATCHES SECTION (Only if not locked) */}
              {otherEntities.length > 0 && !isLocked && (
                <div>
                  <h3 style={sectionTitleStyle}>
                    <ChevronRight size={14} /> SIMILAR POTENTIAL ENTITIES ({otherEntities.length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {otherEntities.map((entity, idx) => (
                      <div key={idx} style={secondaryCardStyle}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.2rem' }}>{entity.entity_name}</p>
                          <p style={{ fontSize: '0.7rem', color: '#555' }}>
                            {entity.source_list} • {entity.country_of_origin || "Global"}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'rgba(239,68,68,0.7)' }}>{displayConfidence(entity.similarity)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : !matchFound ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
              <div style={{ color: '#10b981', background: 'rgba(16,185,129,0.05)', width: '100px', height: '100px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem auto', border: '1px solid rgba(16,185,129,0.1)' }}>
                <ShieldAlert size={48} />
              </div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.6rem', fontWeight: '800' }}>Safe to Proceed</h2>
              <p style={{ color: '#666', maxWidth: '450px', margin: '0 auto', lineHeight: '1.6', fontSize: '1rem' }}>
                "{searchTerm}" does not match any current individuals or organizations on sanctioned watchlists.
              </p>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1.25rem 2rem',
          background: 'rgba(0,0,0,0.5)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <p style={{ fontSize: '0.7rem', color: '#333', margin: 0 }}>ID: {log.id.toUpperCase()}</p>
          <button onClick={onClose} className="btn-outline" style={{ padding: '0.5rem 1.5rem', fontSize: '0.8rem', borderRadius: '8px' }}>Close</button>
        </div>
      </div>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
      `}</style>
    </div>
  );
}

const labelStyle = { fontSize: '0.6rem', fontWeight: '800', color: '#444', letterSpacing: '0.08em', margin: 0 };
const sectionTitleStyle = { fontSize: '0.7rem', color: '#444', display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', fontWeight: '800' };
const primaryCardStyle = { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '1.75rem' };
const secondaryCardStyle = { background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '12px', padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
const valStyle = { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', margin: 0, fontWeight: '600', color: '#888' };
const reasonBoxStyle = { background: '#000', padding: '1.25rem', borderRadius: '12px', fontSize: '0.9rem', color: '#777', lineHeight: '1.6', borderLeft: '3px solid var(--accent)' };
const linkStyle = { color: '#3498db', textDecoration: 'none', fontSize: '0.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem' };
