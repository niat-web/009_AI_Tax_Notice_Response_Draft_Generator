import React, { useState } from 'react';
import InputForm from '../components/InputForm';
import OutputDisplay from '../components/OutputDisplay';
import { api } from '../api';

function MainDashboard() {
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentInputs, setCurrentInputs] = useState(null);

  const handleGenerate = async (formData) => {
    setLoading(true);
    setCurrentInputs(formData);
    try {
      const result = await api.generateDraft(formData);
      setDraft(result);
    } catch (error) {
      console.error(error);
      alert('Failed to generate draft. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => {
    if (currentInputs) {
      handleGenerate(currentInputs);
    }
  };

  return (
    <div className="dashboard-grid">
      <InputForm onGenerate={handleGenerate} loading={loading} />
      <OutputDisplay 
        draft={draft} 
        onRegenerate={handleRegenerate} 
        loading={loading}
        currentInputs={currentInputs}
      />
    </div>
  );
}

export default MainDashboard;
