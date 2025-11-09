// components/assignment/AssignmentSetup.tsx

import React, { useState, useEffect } from 'react';
import { ContentAnalysis } from '../../types';

interface AssignmentSetupProps {
  onComplete: (data: any) => void;
  initialData?: ContentAnalysis;
}

const AssignmentSetup: React.FC<AssignmentSetupProps> = ({ onComplete, initialData }) => {
  const [goal, setGoal] = useState<'essay' | 'talk' | 'slides' | 'study-sheet'>('essay');
  const [level, setLevel] = useState<'basic' | 'standard' | 'advanced'>('standard');
  const [prompt, setPrompt] = useState('');
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setPrompt(`Based on the material: ${initialData.summary}`);

      // Auto-detect goal from intent
      switch (initialData.intent) {
        case 'essay':
          setGoal('essay');
          break;
        case 'presentation':
          setGoal('talk');
          break;
        default:
          setGoal('study-sheet');
      }

      // Set level from difficulty
      setLevel(initialData.difficulty as 'basic' | 'standard' | 'advanced');
    }
  }, [initialData]);

  const goalOptions = [
    {
      key: 'essay' as const,
      label: 'Essay',
      icon: '📝',
      description: 'Written assignment with thesis and supporting arguments',
    },
    {
      key: 'talk' as const,
      label: 'Presentation/Talk',
      icon: '🎤',
      description: 'Oral presentation with visual aids',
    },
    {
      key: 'slides' as const,
      label: 'Slides',
      icon: '📊',
      description: 'PowerPoint or slide presentation',
    },
    {
      key: 'study-sheet' as const,
      label: 'Study Sheet',
      icon: '📋',
      description: 'Organized notes and key points',
    },
  ];

  const levelOptions = [
    {
      key: 'basic' as const,
      label: 'Basic',
      description: 'Simple explanations, key facts, straightforward structure',
    },
    {
      key: 'standard' as const,
      label: 'Standard',
      description: 'Balanced analysis, multiple perspectives, clear structure',
    },
    {
      key: 'advanced' as const,
      label: 'Advanced',
      description: 'Deep analysis, complex arguments, sophisticated structure',
    },
  ];

  const handleSubmit = () => {
    if (!title.trim() || !prompt.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    onComplete({
      title,
      goal,
      level,
      prompt,
    });
  };

  return (
    <div className="assignment-setup">
      <div className="setup-section">
        <h2>🎯 What are you creating?</h2>
        <div className="goal-options">
          {goalOptions.map(option => (
            <div
              key={option.key}
              className={`goal-option ${goal === option.key ? 'selected' : ''}`}
              onClick={() => setGoal(option.key)}
            >
              <div className="goal-icon">{option.icon}</div>
              <div className="goal-content">
                <h3>{option.label}</h3>
                <p>{option.description}</p>
              </div>
              <div className="goal-radio">
                <div className={`radio ${goal === option.key ? 'checked' : ''}`}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="setup-section">
        <h2>📊 What's your level?</h2>
        <div className="level-options">
          {levelOptions.map(option => (
            <div
              key={option.key}
              className={`level-option ${level === option.key ? 'selected' : ''}`}
              onClick={() => setLevel(option.key)}
            >
              <h3>{option.label}</h3>
              <p>{option.description}</p>
              <div className={`level-radio ${level === option.key ? 'checked' : ''}`}></div>
            </div>
          ))}
        </div>
      </div>

      <div className="setup-section">
        <h2>📝 Assignment Details</h2>
        <div className="form-group">
          <label htmlFor="title">Assignment Title *</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter your assignment title"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="prompt">Assignment Prompt/Instructions *</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Paste your assignment prompt or describe what you need to create"
            rows={4}
            className="form-textarea"
          />
        </div>
      </div>

      <div className="setup-actions">
        <button className="continue-button" onClick={handleSubmit}>
          Continue to Planning →
        </button>
      </div>

      <style jsx>{`
        .assignment-setup {
          max-width: 800px;
          margin: 0 auto;
        }

        .setup-section {
          margin-bottom: 32px;
        }

        .setup-section h2 {
          color: #1f2937;
          margin-bottom: 20px;
          font-size: 1.25rem;
        }

        .goal-options {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }

        .goal-option {
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .goal-option:hover {
          border-color: #3b82f6;
          background: #f0f9ff;
        }

        .goal-option.selected {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .goal-icon {
          font-size: 2rem;
          flex-shrink: 0;
        }

        .goal-content h3 {
          margin: 0 0 4px 0;
          color: #1f2937;
          font-size: 1.1rem;
        }

        .goal-content p {
          margin: 0;
          color: #6b7280;
          font-size: 0.9rem;
        }

        .goal-radio {
          margin-left: auto;
        }

        .radio {
          width: 20px;
          height: 20px;
          border: 2px solid #d1d5db;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .radio.checked {
          border-color: #3b82f6;
          background: #3b82f6;
        }

        .radio.checked::after {
          content: '';
          display: block;
          width: 6px;
          height: 6px;
          background: white;
          border-radius: 50%;
          margin: 5px;
        }

        .level-options {
          display: flex;
          gap: 16px;
        }

        .level-option {
          flex: 1;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .level-option:hover {
          border-color: #3b82f6;
          background: #f0f9ff;
        }

        .level-option.selected {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .level-option h3 {
          margin: 0 0 4px 0;
          color: #1f2937;
        }

        .level-option p {
          margin: 0;
          color: #6b7280;
          font-size: 0.9rem;
        }

        .level-radio {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 16px;
          height: 16px;
          border: 2px solid #d1d5db;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .level-radio.checked {
          border-color: #3b82f6;
          background: #3b82f6;
        }

        .level-radio.checked::after {
          content: '';
          display: block;
          width: 4px;
          height: 4px;
          background: white;
          border-radius: 50%;
          margin: 4px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          color: #374151;
          font-weight: 500;
        }

        .form-input, .form-textarea {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s ease;
        }

        .form-input:focus, .form-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-textarea {
          resize: vertical;
          min-height: 100px;
        }

        .setup-actions {
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

        @media (max-width: 768px) {
          .goal-options {
            grid-template-columns: 1fr;
          }

          .level-options {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default AssignmentSetup;
