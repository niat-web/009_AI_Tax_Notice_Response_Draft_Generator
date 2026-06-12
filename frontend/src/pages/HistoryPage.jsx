import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Clock, Search } from 'lucide-react';

function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    api.getHistory()
      .then(data => {
        setHistory(data);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem' }}><div className="loader"></div></div>;
  }

  return (
    <div className="glass-panel panel fade-in" style={{ height: 'auto', minHeight: 'calc(100vh - 140px)' }}>
      <div className="panel-header">
        <h3><Clock size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} /> Generation History</h3>
      </div>
      
      <div className="panel-body">
        {history.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem' }}>No generations found.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {history.map(item => (
              <div 
                key={item.id} 
                className="data-card" 
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '600', color: 'var(--primary)' }}>{item.notice_type}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                  <span><strong>Client:</strong> {item.client_name}</span>
                  <span><strong>Ref:</strong> {item.notice_ref}</span>
                </div>
                <div style={{ fontWeight: '500', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Issue: {item.issue}
                </div>
                
                {expandedId === item.id ? (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--surface-border)' }}>
                    <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Full Response Draft:</h4>
                    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '0.85rem', color: 'var(--text-primary)', background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: '8px' }}>
                      {item.full_letter_text}
                    </pre>
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic', borderLeft: '2px solid var(--surface-border)', paddingLeft: '8px' }}>
                    "{item.preview}"
                    <div style={{ color: 'var(--primary)', fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: '500' }}>Click to view details &darr;</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default HistoryPage;
