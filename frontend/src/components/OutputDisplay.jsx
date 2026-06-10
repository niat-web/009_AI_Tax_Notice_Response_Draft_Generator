import React, { useState, useEffect } from 'react';
import { Copy, Download, Share2, ThumbsUp, ThumbsDown, Star, RefreshCw } from 'lucide-react';
import { 
  EmailShareButton, 
  EmailIcon, 
  WhatsappShareButton, 
  WhatsappIcon, 
  TelegramShareButton, 
  TelegramIcon 
} from 'react-share';
import jsPDF from 'jspdf';
import { api } from '../api';

function OutputDisplay({ draft, onRegenerate, loading, currentInputs }) {
  const [text, setText] = useState('');
  const [rating, setRating] = useState(0);
  const [thumbs, setThumbs] = useState(null);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editSaved, setEditSaved] = useState(false);
  const [showSharePopup, setShowSharePopup] = useState(false);

  useEffect(() => {
    if (draft) {
      setText(draft.full_letter_text);
      setRating(0);
      setThumbs(null);
      setSavedFeedback(false);
      setEditSaved(false);
      setShowSharePopup(false);
    }
  }, [draft]);

  if (loading) {
    return (
      <div className="glass-panel panel fade-in" style={{ justifyContent: 'center', alignItems: 'center', color: 'var(--text-primary)' }}>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="loader" style={{ margin: '0 auto 1.5rem auto', width: '40px', height: '40px', borderWidth: '4px' }}></div>
          <h3 style={{ marginBottom: '0.5rem', color: 'var(--accent)' }}>Drafting Response...</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            Analyzing facts and drafting {currentInputs?.noticeType} response for <strong>{currentInputs?.clientName || 'Client'}</strong>...
          </p>
        </div>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="glass-panel panel fade-in" style={{ justifyContent: 'center', alignItems: 'center', color: 'var(--text-secondary)' }}>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ marginBottom: '1rem', opacity: 0.5 }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
          </div>
          <p>Fill out the form and generate to see the draft here.</p>
        </div>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const handleDownloadTxt = () => {
    const element = document.createElement("a");
    const file = new Blob([text], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Draft_Response_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    const splitText = doc.splitTextToSize(text, 180);
    doc.text(splitText, 15, 20);
    doc.save(`Draft_Response_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleShare = () => {
    setShowSharePopup(!showSharePopup);
  };

  const handleRating = async (val) => {
    setRating(val);
    try {
      await api.submitFeedback({ generation_id: draft.id, rating: val, thumbs_up_down: thumbs });
      setSavedFeedback(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleThumbs = async (isUp) => {
    setThumbs(isUp);
    if (rating > 0) {
      try {
        await api.submitFeedback({ generation_id: draft.id, rating: rating, thumbs_up_down: isUp });
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    try {
      await api.saveEdit(draft.id, text);
      setEditSaved(true);
      setTimeout(() => setEditSaved(false), 3000);
    } catch (e) {
      console.error(e);
      alert('Failed to save edits.');
    } finally {
      setSavingEdit(false);
    }
  };

  const isEdited = draft && text !== draft.full_letter_text;

  return (
    <div className="glass-panel panel fade-in">
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h3>AI Generated Draft</h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
          {draft.prompt_version} • {draft.response_time_ms}ms
        </span>
      </div>
      
      <div className="panel-body" style={{ padding: 0 }}>
        <textarea 
          className="editor-container" 
          value={text} 
          onChange={(e) => setText(e.target.value)}
          style={{ padding: '1.5rem' }}
        />
      </div>

      <div className="editor-actions">
        <div className="actions-group">
          <button className="btn btn-secondary" onClick={handleCopy} title="Copy as TXT">
            <Copy size={16} /> Copy
          </button>
          <button className="btn btn-secondary" onClick={handleDownloadTxt} title="Download .txt">
            <Download size={16} /> .TXT
          </button>
          <button className="btn btn-secondary" onClick={handleDownloadPdf} title="Download .pdf">
            <Download size={16} /> .PDF
          </button>
          
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button className="btn btn-secondary" onClick={handleShare} title="Share">
              <Share2 size={16} /> Share
            </button>
            {showSharePopup && (
              <div className="fade-in" style={{ 
                position: 'absolute', 
                bottom: '120%', 
                left: '50%', 
                transform: 'translateX(-50%)', 
                background: 'var(--surface-color)', 
                border: '1px solid var(--surface-border)', 
                borderRadius: '8px', 
                padding: '0.75rem', 
                display: 'flex', 
                gap: '0.75rem', 
                boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                zIndex: 10
              }}>
                <WhatsappShareButton 
                  url=" " 
                  title={`*Draft Tax Response for ${currentInputs?.clientName || 'Client'}*\n\n${text}`} 
                  separator=""
                  onClick={() => setShowSharePopup(false)}
                >
                  <WhatsappIcon size={36} round />
                </WhatsappShareButton>
                
                <TelegramShareButton 
                  url=" " 
                  title={`Draft Tax Response for ${currentInputs?.clientName || 'Client'}\n\n${text}`}
                  onClick={() => setShowSharePopup(false)}
                >
                  <TelegramIcon size={36} round />
                </TelegramShareButton>

                <EmailShareButton 
                  url=" " 
                  subject={`Draft Response for ${currentInputs?.clientName || 'Notice'}`} 
                  body={text}
                  onClick={() => setShowSharePopup(false)}
                >
                  <EmailIcon size={36} round />
                </EmailShareButton>
              </div>
            )}
          </div>
        </div>

        <div className="actions-group" style={{ alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginRight: '1rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Rate Quality:</span>
            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map(star => (
                <Star 
                  key={star} 
                  size={18} 
                  fill={star <= rating ? "#FCD34D" : "none"} 
                  className={`star ${star > rating ? 'dimmed' : ''}`}
                  onClick={() => handleRating(star)}
                />
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.5rem' }}>
              <ThumbsUp size={16} style={{ cursor: 'pointer', color: thumbs === true ? 'var(--accent)' : 'var(--text-secondary)' }} onClick={() => handleThumbs(true)} />
              <ThumbsDown size={16} style={{ cursor: 'pointer', color: thumbs === false ? 'var(--danger)' : 'var(--text-secondary)' }} onClick={() => handleThumbs(false)} />
            </div>
            {savedFeedback && <span style={{ fontSize: '0.7rem', color: 'var(--accent)', marginLeft: '0.5rem' }}>Saved!</span>}
          </div>

          {isEdited && (
            <button className="btn btn-primary" onClick={handleSaveEdit} disabled={savingEdit}>
              {savingEdit ? 'Saving...' : (editSaved ? 'Saved!' : 'Save Edits')}
            </button>
          )}

          <button className="btn btn-outline" onClick={onRegenerate}>
            <RefreshCw size={16} /> Regenerate
          </button>
        </div>
      </div>
    </div>
  );
}

export default OutputDisplay;
