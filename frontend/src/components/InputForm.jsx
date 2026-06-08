import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Sparkles, FileText, FileSearch, Banknote } from 'lucide-react';

function InputForm({ onGenerate, loading, initialData = null }) {
  const [formData, setFormData] = useState({
    noticeType: '',
    issue: '',
    clientFacts: '',
    strategy: '',
    clientName: '',
    noticeRef: ''
  });
  
  const [templates, setTemplates] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Load templates
    api.getTemplates().then(data => setTemplates(data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  const applyTemplate = (tpl) => {
    setFormData({
      ...formData,
      noticeType: tpl.notice_type,
      issue: tpl.issue,
      clientFacts: tpl.client_facts,
      strategy: tpl.response_strategy
    });
    setErrors({});
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.noticeType) newErrors.noticeType = 'Notice type is required';
    if (!formData.issue) newErrors.issue = 'Specific issue is required';
    if (!formData.clientFacts) newErrors.clientFacts = 'Client facts are required';
    if (!formData.strategy) newErrors.strategy = 'Response strategy is required';
    if (!formData.clientName) newErrors.clientName = 'Client name is required';
    if (!formData.noticeRef) newErrors.noticeRef = 'Notice reference is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onGenerate(formData);
    }
  };

  return (
    <div className="glass-panel panel fade-in">
      <div className="panel-header">
        <h3><FileSearch size={18} style={{ display: 'inline', marginRight: '8px' }} /> Case Details</h3>
      </div>
      <div className="panel-body form-layout">
        <form onSubmit={handleSubmit} className="form-main">
          
          <div className="form-row">
            <div className="form-group" style={{ flex: '1', marginBottom: '0' }}>
              <label className="form-label">Client Name</label>
              <input 
                type="text"
                name="clientName" 
                className="form-select" 
                placeholder="e.g. Acme Corp"
                value={formData.clientName} 
                onChange={handleChange}
              />
              {errors.clientName && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{errors.clientName}</span>}
            </div>
            <div className="form-group" style={{ flex: '1', marginBottom: '0' }}>
              <label className="form-label">Notice Reference No.</label>
              <input 
                type="text"
                name="noticeRef" 
                className="form-select" 
                placeholder="e.g. ITBA/AST/S/143(3)"
                value={formData.noticeRef} 
                onChange={handleChange}
              />
              {errors.noticeRef && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{errors.noticeRef}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notice Type</label>
            <select 
              name="noticeType" 
              className="form-select" 
              value={formData.noticeType} 
              onChange={handleChange}
            >
              <option value="">Select Notice Type</option>
              <option value="Income Tax Scrutiny">Income Tax Scrutiny</option>
              <option value="GST Audit Notice">GST Audit Notice</option>
              <option value="TDS Demand">TDS Demand</option>
              <option value="Advance Tax Demand">Advance Tax Demand</option>
              <option value="Assessment Order">Assessment Order</option>
            </select>
            {errors.noticeType && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{errors.noticeType}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Specific Issue Raised</label>
            <textarea 
              name="issue" 
              className="form-textarea" 
              placeholder="e.g. Mismatch between GSTR-1 and GSTR-3B"
              value={formData.issue}
              onChange={handleChange}
              style={{ minHeight: '80px' }}
            />
            {errors.issue && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{errors.issue}</span>}
            <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {formData.issue.length}/200
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Relevant Client Facts & Amounts</label>
            <textarea 
              name="clientFacts" 
              className="form-textarea" 
              placeholder="Provide context, years involved, and financial figures"
              value={formData.clientFacts}
              onChange={handleChange}
            />
            {errors.clientFacts && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{errors.clientFacts}</span>}
            <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {formData.clientFacts.split(' ').filter(Boolean).length} words
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Desired Response Strategy</label>
            <select 
              name="strategy" 
              className="form-select" 
              value={formData.strategy} 
              onChange={handleChange}
            >
              <option value="">Select Strategy</option>
              <option value="accept with payment">Accept with Payment</option>
              <option value="contest with explanation">Contest with Explanation</option>
              <option value="seek time extension">Seek Time Extension</option>
            </select>
            {errors.strategy && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{errors.strategy}</span>}
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? <div className="loader"></div> : <><Sparkles size={18} /> Generate Draft Letter</>}
          </button>
        </form>

        <div className="presets-sidebar">
          <h4 style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Template Presets</h4>
          <div className="presets-list">
            {templates.map(tpl => (
              <div key={tpl.id} className="preset-item" onClick={() => applyTemplate(tpl)}>
                <div style={{ fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.25rem' }}>{tpl.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{tpl.notice_type}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default InputForm;
