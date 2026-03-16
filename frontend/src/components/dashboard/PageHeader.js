"use client";

export default function PageHeader({ isLive }) {
  return (
    <div style={{ 
      marginBottom: '1.5rem', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'baseline', 
      flexWrap: 'wrap',
      gap: '1rem'
    }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '900', letterSpacing: '-0.02em', margin: 0, color: '#fff' }}>Developer Console</h1>
        <p style={{ color: '#444', fontSize: '0.8rem', marginTop: '0.2rem', fontWeight: '600' }}>
          Real-time global sanctions intelligence and risk management.
        </p>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isLive ? '#10b981' : '#3498db', boxShadow: `0 0 10px ${isLive ? '#10b981' : '#3498db'}` }}></div>
        <span style={{ color: isLive ? '#10b981' : '#3498db', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {isLive ? 'Production Environment' : 'Sandbox Environment'}
        </span>
      </div>
    </div>
  );
}
