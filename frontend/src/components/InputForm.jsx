import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Sparkles, FileText, FileSearch, Banknote, UploadCloud, Mic } from 'lucide-react';

function InputForm({ onGenerate, loading, initialData = null }) {
  const [formData, setFormData] = useState({
    noticeType: '',
    issue: '',
    clientFacts: '',
    strategy: '',
    clientName: '',
    noticeRef: '',
    language: 'English'
  });

  const [templates, setTemplates] = useState([]);
  const [errors, setErrors] = useState({});
  const [extracting, setExtracting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const [isListening, setIsListening] = useState(false);
  const [voiceStep, setVoiceStep] = useState(null);

  const voiceQuestions = [
    { field: 'clientName', text: "What is the client's name?" },
    { field: 'noticeRef', text: "What is the notice reference number?" },
    { field: 'noticeType', text: "What type of notice is this? For example: GST Audit Notice, Income Tax Scrutiny, TDS Demand, Advance Tax Demand, or Assessment Order?" },
    { field: 'issue', text: "Can you briefly describe the specific issue raised?" },
    { field: 'clientFacts', text: "What are the relevant facts and amounts?" },
    { field: 'strategy', text: "Finally, what is the desired response strategy? For example: accept with payment, or contest with explanation?" }
  ];

  const startVoiceAssistant = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Your browser does not support Speech Recognition. Please try Google Chrome or Edge.");
      return;
    }
    setIsListening(true);
    askQuestion(0);
  };

  const askQuestion = (stepIndex) => {
    if (stepIndex >= voiceQuestions.length) {
      setIsListening(false);
      setVoiceStep(null);
      speak("All details captured. You can now generate the draft.");
      return;
    }

    setVoiceStep(stepIndex);
    const q = voiceQuestions[stepIndex];
    speak(q.text, () => listenForAnswer(stepIndex));
  };

  const speak = (text, onEndCallback) => {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    if (onEndCallback) {
      utterance.onend = () => {
        // Small delay before listening to avoid echo
        setTimeout(onEndCallback, 300);
      };
    }
    window.speechSynthesis.speak(utterance);
  };

  const listenForAnswer = (stepIndex) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let transcript = event.results[0][0].transcript;

      // Basic normalization for strategy dropdown
      if (voiceQuestions[stepIndex].field === 'strategy') {
        transcript = transcript.toLowerCase();
        if (transcript.includes('accept')) transcript = 'accept with payment';
        else if (transcript.includes('contest')) transcript = 'contest with explanation';
        else if (transcript.includes('time') || transcript.includes('extension')) transcript = 'seek time extension';
      }

      const field = voiceQuestions[stepIndex].field;
      setFormData(prev => ({ ...prev, [field]: transcript }));

      // Move to next question
      setTimeout(() => askQuestion(stepIndex + 1), 500);
    };

    recognition.onerror = (event) => {
      console.error("Speech error:", event.error);
      if (event.error === 'no-speech') {
        speak("I didn't catch that. Please try speaking again.", () => listenForAnswer(stepIndex));
      } else {
        setIsListening(false);
        setVoiceStep(null);

        let errorMsg = "Microphone error. Please try typing instead.";
        if (event.error === 'not-allowed') {
          errorMsg = "Microphone access was denied. Please click the lock icon in your browser's address bar to allow microphone access.";
        } else if (event.error === 'network') {
          errorMsg = "Speech recognition requires an active internet connection. Please check your network.";
        } else if (event.error === 'audio-capture') {
          errorMsg = "No microphone was found on your system. Please ensure a microphone is connected.";
        }

        alert(errorMsg + ` (Error Code: ${event.error})`);
      }
    };

    recognition.start();
  };

  const handleDrag = function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = function (e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = function (e) {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      alert("Please upload a PDF or JPG/PNG image.");
      return;
    }

    setExtracting(true);
    try {
      const extractedData = await api.extractDetails(file);
      setFormData(prev => ({
        ...prev,
        noticeType: extractedData.noticeType || prev.noticeType,
        issue: extractedData.issue || prev.issue,
        clientFacts: extractedData.clientFacts || prev.clientFacts,
        strategy: extractedData.strategy ? extractedData.strategy.toLowerCase() : prev.strategy,
        clientName: extractedData.clientName || prev.clientName,
        noticeRef: extractedData.noticeRef || prev.noticeRef,
        language: prev.language
      }));
      setErrors({});
    } catch (err) {
      console.error("Extraction error", err);
      alert("Failed to extract details from the document.");
    } finally {
      setExtracting(false);
    }
  };

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

          <div
            className={`dropzone ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-upload"
              multiple={false}
              onChange={handleFileChange}
              accept=".pdf, image/jpeg, image/png"
            />
            <label htmlFor="file-upload" className="dropzone-label">
              {extracting ? (
                <div className="extraction-loader">
                  <div className="loader"></div>
                  <p>AI is reading the document and extracting details...</p>
                </div>
              ) : (
                <>
                  <UploadCloud size={32} style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} />
                  <p><strong>Upload Tax Notice (PDF/JPG)</strong></p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Drag & drop or click to browse. AI will auto-fill the form.</p>
                </>
              )}
            </label>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--surface-border)', width: '100px' }} />
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>OR</span>
              <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--surface-border)', width: '100px' }} />
            </div>

            <button
              type="button"
              onClick={() => isListening ? setIsListening(false) : startVoiceAssistant()}
              className="btn"
              style={{
                marginTop: '1rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '30px',
                border: '1px solid ' + (isListening ? 'var(--danger)' : 'var(--primary)'),
                color: isListening ? 'white' : 'var(--primary)',
                background: isListening ? 'var(--danger)' : 'transparent',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                boxShadow: isListening ? '0 0 15px rgba(239, 68, 68, 0.4)' : 'none'
              }}
            >
              <Mic size={18} />
              {isListening
                ? (voiceStep !== null ? voiceQuestions[voiceStep].text : "Stop Listening")
                : "Talk to AI Assistant to Fill the Form"}
            </button>
          </div>

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

          <div className="form-group" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem', background: 'var(--surface-color)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
            <label className="form-label" style={{ marginBottom: 0, fontWeight: '600' }}>Output Language:</label>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="language"
                  value="English"
                  checked={formData.language === 'English'}
                  onChange={handleChange}
                  style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                />
                English
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="language"
                  value="Hindi"
                  checked={formData.language === 'Hindi'}
                  onChange={handleChange}
                  style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                />
                Hindi
              </label>
            </div>
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
