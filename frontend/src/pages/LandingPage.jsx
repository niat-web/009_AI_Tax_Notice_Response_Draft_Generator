import React from 'react';
import { Link } from 'react-router-dom';

function LandingPage() {
  return (
    <div className="fade-in" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 200px)',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#e0e7ff', color: '#3730a3', padding: '0.25rem 1rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1rem' }}>
        <span style={{ display: 'inline-block', width: '16px', height: '16px', background: '#4f46e5', color: 'white', borderRadius: '50%', textAlign: 'center', lineHeight: '16px', fontSize: '10px' }}>P</span>
        P.Suuresh & Associates
      </div>

      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#d1fae5', color: '#047857', padding: '0.25rem 1rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: '500', marginBottom: '2rem' }}>
        ✓ Powered by AI. Legally robust draft generation.
      </div>

      <h1 style={{
        fontSize: 'clamp(2rem, 8vw, 3.5rem)',
        lineHeight: '1.2',
        fontWeight: '800',
        color: 'var(--text-primary)',
        maxWidth: '900px',
        marginBottom: '1.5rem',
        letterSpacing: '-0.02em'
      }}>
        Automate routine tax notice responses in <span style={{ color: 'var(--primary)' }}>under 10 minutes</span>
      </h1>

      <p style={{
        fontSize: 'clamp(1rem, 4vw, 1.15rem)',
        color: 'var(--text-secondary)',
        maxWidth: '750px',
        marginBottom: '3rem',
        lineHeight: '1.6'
      }}>
        An exclusive automated solution for P.Suuresh & Associates. Input the notice type, specific issue, and client facts to instantly generate a professionally structured response letter. Free up senior CA bandwidth and empower junior staff to initiate responses efficiently.
      </p>

      <div style={{ display: 'flex', gap: '2rem', marginBottom: '3rem', fontSize: '0.95rem', color: 'var(--text-secondary)', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div><strong style={{ color: 'var(--text-primary)' }}>2-3 Hours &rarr; 10 Mins</strong> Drafting Time</div>
        <div><strong style={{ color: 'var(--text-primary)' }}>Formal</strong> Legal Structuring</div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link to="/app" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '1rem 2rem', borderRadius: '8px' }}>
          Open Generator Tool
        </Link>
        <Link to="/history" className="btn btn-secondary" style={{ fontSize: '1.1rem', padding: '1rem 2rem', borderRadius: '8px', background: 'white' }}>
          View Draft History &rarr;
        </Link>
      </div>
    </div>
  );
}

export default LandingPage;
