// components/assignment/GuidedBuilder.tsx

import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Assignment } from './AssignmentMode';

interface GuidedBuilderProps {
  assignment: Assignment;
  onComplete: (result: any) => void;
  isWritingPhase?: boolean;
}

const GuidedBuilder: React.FC<GuidedBuilderProps> = ({
  assignment,
  onComplete,
  isWritingPhase = false
}) => {
  const [outline, setOutline] = useState<any>({});
  const [thesis, setThesis] = useState('');
  const [draft, setDraft] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isWritingPhase && !outline.sections) {
      generateOutline();
    }
  }, [isWritingPhase]);

  const generateOutline = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || '' });
      const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt = `Create a detailed outline for a ${assignment.goal} about "${assignment.title}".

Goal: ${assignment.goal}
Level: ${assignment.level}
Prompt: ${assignment.prompt}

Return a JSON outline with:
{
  "introduction": "What to include in the intro",
  "body": ["Main point 1", "Main point 2", "Main point 3"],
  "conclusion": "What to include in the conclusion",
  "keyPoints": ["Specific facts or arguments to cover"],
  "structure": "Brief description of the overall structure"
}

Make it appropriate for ${assignment.level} level.`;

      const response = await model.generateContent({
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const generatedOutline = JSON.parse(response.text);
      setOutline(generatedOutline);

      // Generate thesis suggestions
      const thesisPrompt = `Generate 3 thesis statement options for a ${assignment.level} level ${assignment.goal} about "${assignment.title}".

Return as JSON: { "options": ["Thesis 1", "Thesis 2", "Thesis 3"] }`;

      const thesisResponse = await model.generateContent({
        contents: thesisPrompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const thesisData = JSON.parse(thesisResponse.text);
      setAiSuggestions({ thesisOptions: thesisData.options });

    } catch (error) {
      console.error('Outline generation error:', error);
      setOutline({
        introduction: 'Introduce your topic and thesis',
        body: ['Main point 1', 'Main point 2', 'Main point 3'],
        conclusion: 'Summarize your main points and restate thesis',
        keyPoints: ['Key point to cover'],
        structure: 'Basic essay structure'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOutlineUpdate = (section: string, content: any) => {
    setOutline(prev => ({
      ...prev,
      [section]: content
    }));
  };

  const handleThesisSelect = (selectedThesis: string) => {
    setThesis(selectedThesis);
  };

  const handleDraftUpdate = (content: string) => {
    setDraft(content);
  };

  const handleComplete = () => {
    if (isWritingPhase) {
      if (!draft.trim()) {
        alert('Please write something before continuing');
        return;
      }
      onComplete(draft);
    } else {
      if (!thesis.trim()) {
        alert('Please select a thesis statement');
        return;
      }
      onComplete({ ...outline, thesis });
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Generating your personalized outline...</p>
      </div>
    );
  }

  return (
    <div className="guided-builder">
      {!isWritingPhase ? (
        <div className="planning-phase">
          <h2>🎯 Plan Your {assignment.goal}</h2>

          {/* Thesis Selection */}
          <div className="builder-section">
            <h3>Choose Your Thesis Statement</h3>
            <div className="thesis-options">
              {aiSuggestions.thesisOptions?.map((option: string, index: number) => (
                <div
                  key={index}
                  className={`thesis-option ${thesis === option ? 'selected' : ''}`}
                  onClick={() => handleThesisSelect(option)}
                >
                  <p>{option}</p>
                  <button
                    className="select-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleThesisSelect(option);
                    }}
                  >
                    {thesis === option ? 'Selected' : 'Choose'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Outline Builder */}
          <div className="builder-section">
            <h3>Build Your Outline</h3>

            <div className="outline-section">
              <h4>Introduction</h4>
              <textarea
                value={outline.introduction || ''}
                onChange={(e) => handleOutlineUpdate('introduction', e.target.value)}
                placeholder="What should your introduction include?"
                rows={3}
              />
            </div>

            <div className="outline-section">
              <h4>Main Body</h4>
              {outline.body?.map((point: string, index: number) => (
                <div key={index} className="body-point">
                  <input
                    type="text"
                    value={point}
                    onChange={(e) => {
                      const newBody = [...outline.body];
                      newBody[index] = e.target.value;
                      handleOutlineUpdate('body', newBody);
                    }}
                    placeholder={`Main point ${index + 1}`}
                  />
                </div>
              ))}
              <button
                className="add-point-button"
                onClick={() => {
                  const newBody = [...(outline.body || []), ''];
                  handleOutlineUpdate('body', newBody);
                }}
              >
                + Add Point
              </button>
            </div>

            <div className="outline-section">
              <h4>Conclusion</h4>
              <textarea
                value={outline.conclusion || ''}
                onChange={(e) => handleOutlineUpdate('conclusion', e.target.value)}
                placeholder="What should your conclusion include?"
                rows={3}
              />
            </div>
          </div>

          {/* Key Points */}
          <div className="builder-section">
            <h3>Key Points to Cover</h3>
            <div className="key-points">
              {outline.keyPoints?.map((point: string, index: number) => (
                <div key={index} className="key-point">
                  <span className="point-number">{index + 1}</span>
                  <span className="point-text">{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="writing-phase">
          <h2>✍️ Write Your {assignment.goal}</h2>

          <div className="writing-guidance">
            <div className="guidance-panel">
              <h3>Your Plan</h3>
              <div className="plan-summary">
                <p><strong>Thesis:</strong> {thesis}</p>
                <p><strong>Structure:</strong> {outline.structure}</p>
                <ul>
                  {outline.body?.map((point: string, index: number) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="writing-area">
              <textarea
                value={draft}
                onChange={(e) => handleDraftUpdate(e.target.value)}
                placeholder={`Start writing your ${assignment.goal} here...`}
                className="draft-editor"
              />
              <div className="writing-stats">
                <span>Words: {draft.split(/\s+/).filter(word => word.length > 0).length}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="builder-actions">
        <button className="continue-button" onClick={handleComplete}>
          {isWritingPhase ? 'Continue to Practice →' : 'Start Writing →'}
        </button>
      </div>

      <style jsx>{`
        .guided-builder {
          max-width: 1000px;
          margin: 0 auto;
        }

        .loading-state {
          text-align: center;
          padding: 40px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }

        .planning-phase h2, .writing-phase h2 {
          color: #1f2937;
          margin-bottom: 24px;
        }

        .builder-section {
          background: #f8fafc;
          border-radius: 8px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .builder-section h3 {
          color: #1f2937;
          margin-bottom: 16px;
          font-size: 1.1rem;
        }

        .thesis-options {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .thesis-option {
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .thesis-option:hover {
          border-color: #3b82f6;
          background: #f0f9ff;
        }

        .thesis-option.selected {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .thesis-option p {
          margin: 0;
          flex: 1;
          color: #374151;
        }

        .select-button {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .outline-section {
          margin-bottom: 20px;
        }

        .outline-section h4 {
          color: #374151;
          margin-bottom: 8px;
          font-size: 1rem;
        }

        .outline-section textarea, .outline-section input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-family: inherit;
        }

        .body-point {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
          align-items: center;
        }

        .body-point input {
          flex: 1;
        }

        .add-point-button {
          background: #10b981;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .key-points {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .key-point {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          background: white;
          border-radius: 4px;
        }

        .point-number {
          background: #3b82f6;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .writing-guidance {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 24px;
        }

        .guidance-panel {
          background: #f8fafc;
          border-radius: 8px;
          padding: 20px;
        }

        .plan-summary {
          font-size: 0.9rem;
        }

        .plan-summary ul {
          margin: 8px 0;
          padding-left: 20px;
        }

        .writing-area {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .draft-editor {
          flex: 1;
          min-height: 400px;
          padding: 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-family: inherit;
          font-size: 1rem;
          line-height: 1.6;
          resize: vertical;
        }

        .writing-stats {
          text-align: right;
          color: #6b7280;
          font-size: 0.9rem;
        }

        .builder-actions {
          text-align: center;
          margin-top: 32px;
        }

        .continue-button {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 16px 32px;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .continue-button:hover {
          background: #2563eb;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .writing-guidance {
            grid-template-columns: 1fr;
          }

          .guidance-panel {
            order: 2;
          }

          .writing-area {
            order: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default GuidedBuilder;
