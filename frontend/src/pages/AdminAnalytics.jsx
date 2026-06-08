import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { BarChart3, TrendingUp, Award, FileText, Settings, Trash2, Plus } from 'lucide-react';

function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [templates, setTemplates] = useState([]);
  const [newTemplate, setNewTemplate] = useState({
    title: '',
    noticeType: '',
    issue: '',
    clientFacts: '',
    strategy: ''
  });
  const [addingTemplate, setAddingTemplate] = useState(false);

  const fetchData = async () => {
    try {
      const res = await api.getAnalytics();
      setData(res);
      const tpls = await api.getTemplates();
      setTemplates(tpls);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddTemplate = async (e) => {
    e.preventDefault();
    setAddingTemplate(true);
    try {
      await api.addTemplate(newTemplate);
      setNewTemplate({ title: '', noticeType: '', issue: '', clientFacts: '', strategy: '' });
      const tpls = await api.getTemplates();
      setTemplates(tpls);
    } catch (e) {
      console.error(e);
      alert('Failed to add template');
    } finally {
      setAddingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    try {
      await api.deleteTemplate(id);
      setTemplates(templates.filter(t => t.id !== id));
    } catch (e) {
      console.error(e);
      alert('Failed to delete template');
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem' }}><div className="loader"></div></div>;
  }

  if (!data) return null;

  return (
    <div className="fade-in" style={{ padding: '0 1rem' }}>
      <h2 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <BarChart3 size={28} color="var(--primary)" /> Admin Analytics
      </h2>

      <div className="stats-grid">
        <div className="glass-panel stat-box">
          <div className="stat-label">Total Generations</div>
          <div className="stat-value">{data.totalGenerations}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>All time</div>
        </div>
        
        <div className="glass-panel stat-box">
          <div className="stat-label">Average Quality</div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>
            {data.averageRating} <StarIcon />
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Based on user feedback</div>
        </div>

        <div className="glass-panel stat-box">
          <div className="stat-label">Most Common Notice</div>
          <div className="stat-value" style={{ fontSize: '1.5rem', marginTop: '1rem' }}>
            {data.topNoticeTypes.length > 0 ? data.topNoticeTypes[0].notice_type : 'N/A'}
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="glass-panel panel">
          <div className="panel-header">
            <h3><FileText size={18} style={{ display: 'inline', marginRight: '8px' }} /> Top Notice Types</h3>
          </div>
          <div className="panel-body">
            {data.topNoticeTypes.map((type, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--surface-border)' }}>
                <span>{type.notice_type}</span>
                <span style={{ fontWeight: '600' }}>{type.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel panel">
          <div className="panel-header">
            <h3><TrendingUp size={18} style={{ display: 'inline', marginRight: '8px' }} /> 30-Day Trend</h3>
          </div>
          <div className="panel-body">
            {/* Simple bar chart representation */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', height: '200px', gap: '8px', paddingTop: '20px' }}>
              {data.trend.length > 0 ? data.trend.map((day, idx) => {
                const max = Math.max(...data.trend.map(d => d.generations));
                const height = max > 0 ? (day.generations / max) * 100 : 0;
                return (
                  <div key={idx} style={{ flex: 1, maxWidth: '40px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '100%', height: `${height}%`, background: 'var(--primary)', borderRadius: '4px 4px 0 0', opacity: 0.8 }} title={`${new Date(day.date).toLocaleDateString()}: ${day.generations}`}></div>
                  </div>
                );
              }) : <div style={{ color: 'var(--text-secondary)' }}>No data available</div>}
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel panel" style={{ marginTop: '2rem' }}>
        <div className="panel-header">
          <h3><Settings size={18} style={{ display: 'inline', marginRight: '8px' }} /> Manage Template Presets</h3>
        </div>
        <div className="panel-body" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          
          <div style={{ flex: '1', minWidth: '300px' }}>
            <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Add New Preset</h4>
            <form onSubmit={handleAddTemplate} className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input type="text" className="form-input" placeholder="Preset Title (e.g. Standard TDS)" value={newTemplate.title} onChange={e => setNewTemplate({...newTemplate, title: e.target.value})} required />
              
              <select className="form-select" value={newTemplate.noticeType} onChange={e => setNewTemplate({...newTemplate, noticeType: e.target.value})} required>
                <option value="">Select Notice Type</option>
                <option value="Income Tax Scrutiny">Income Tax Scrutiny</option>
                <option value="GST Audit Notice">GST Audit Notice</option>
                <option value="TDS Demand">TDS Demand</option>
                <option value="Advance Tax Demand">Advance Tax Demand</option>
                <option value="Assessment Order">Assessment Order</option>
              </select>

              <textarea className="form-textarea" style={{ minHeight: '60px' }} placeholder="Specific Issue" value={newTemplate.issue} onChange={e => setNewTemplate({...newTemplate, issue: e.target.value})} required />
              <textarea className="form-textarea" style={{ minHeight: '60px' }} placeholder="Client Facts" value={newTemplate.clientFacts} onChange={e => setNewTemplate({...newTemplate, clientFacts: e.target.value})} required />
              
              <select className="form-select" value={newTemplate.strategy} onChange={e => setNewTemplate({...newTemplate, strategy: e.target.value})} required>
                <option value="">Select Strategy</option>
                <option value="accept with payment">Accept with Payment</option>
                <option value="contest with explanation">Contest with Explanation</option>
                <option value="seek time extension">Seek Time Extension</option>
              </select>

              <button type="submit" className="btn btn-primary" disabled={addingTemplate}>
                {addingTemplate ? 'Adding...' : <><Plus size={16} /> Add Preset</>}
              </button>
            </form>
          </div>

          <div style={{ flex: '1', minWidth: '300px', borderLeft: '1px solid var(--surface-border)', paddingLeft: '2rem' }} className="mobile-no-border">
            <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Existing Presets</h4>
            {templates.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No templates found.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {templates.map(tpl => (
                  <div key={tpl.id} className="preset-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: '600' }}>{tpl.title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{tpl.notice_type} - {tpl.response_strategy}</div>
                    </div>
                    <button className="btn btn-outline" style={{ border: 'none', color: 'var(--danger)', padding: '0.5rem' }} onClick={() => handleDeleteTemplate(tpl.id)} title="Delete Template">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

const StarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="#FCD34D" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'text-bottom' }}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
  </svg>
);

export default AdminAnalytics;
