// components/shared/AnalysisProgressScreen.tsx

import React from 'react';

interface AnalysisStep {
  id: string;
  label: string;
  icon: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'error';
}

interface AnalysisProgressScreenProps {
  isVisible: boolean;
  currentStep?: string;
  error?: string;
  onCancel?: () => void;
}

const AnalysisProgressScreen: React.FC<AnalysisProgressScreenProps> = ({
  isVisible,
  currentStep = 'ocr',
  error,
  onCancel
}) => {
  if (!isVisible) return null;

  const steps: AnalysisStep[] = [
    {
      id: 'ocr',
      label: 'OCR Processing',
      icon: '👁️',
      description: 'Extracting text from your document',
      status: currentStep === 'ocr' ? 'active' :
              ['topic-mapping', 'concepts', 'quiz-seeds', 'lesson-plan'].includes(currentStep) ? 'completed' : 'pending'
    },
    {
      id: 'topic-mapping',
      label: 'Topic Mapping',
      icon: '🗺️',
      description: 'Identifying main topics and themes',
      status: currentStep === 'topic-mapping' ? 'active' :
              ['concepts', 'quiz-seeds', 'lesson-plan'].includes(currentStep) ? 'completed' :
              currentStep === 'ocr' ? 'pending' : 'pending'
    },
    {
      id: 'concepts',
      label: 'Concepts',
      icon: '💡',
      description: 'Analyzing key concepts and ideas',
      status: currentStep === 'concepts' ? 'active' :
              ['quiz-seeds', 'lesson-plan'].includes(currentStep) ? 'completed' :
              ['ocr', 'topic-mapping'].includes(currentStep) ? 'pending' : 'pending'
    },
    {
      id: 'quiz-seeds',
      label: 'Quiz Seeds',
      icon: '❓',
      description: 'Generating quiz questions and tasks',
      status: currentStep === 'quiz-seeds' ? 'active' :
              currentStep === 'lesson-plan' ? 'completed' :
              ['ocr', 'topic-mapping', 'concepts'].includes(currentStep) ? 'pending' : 'pending'
    },
    {
      id: 'lesson-plan',
      label: 'Lesson Plan',
      icon: '📚',
      description: 'Building your personalized journey',
      status: currentStep === 'lesson-plan' ? 'active' : 'pending'
    }
  ];

  const getStepStatusClass = (status: string) => {
    switch (status) {
      case 'completed': return 'step-completed';
      case 'active': return 'step-active';
      case 'error': return 'step-error';
      default: return 'step-pending';
    }
  };

  return (
    <div className="analysis-progress-overlay">
      <div className="analysis-progress-modal">
        <div className="progress-header">
          <h2>Analyzing Your Material</h2>
          <p>We're building a personalized learning journey just for you</p>
        </div>

        <div className="progress-steps">
          {steps.map((step, index) => (
            <div key={step.id} className={`progress-step ${getStepStatusClass(step.status)}`}>
              <div className="step-connector">
                {index < steps.length - 1 && <div className="connector-line"></div>}
              </div>

              <div className="step-content">
                <div className="step-icon">
                  {step.status === 'completed' ? '✅' :
                   step.status === 'active' ? '⏳' :
                   step.status === 'error' ? '❌' : step.icon}
                </div>

                <div className="step-details">
                  <h3 className="step-title">{step.label}</h3>
                  <p className="step-description">{step.description}</p>
                </div>

                <div className="step-status">
                  {step.status === 'active' && <div className="loading-spinner"></div>}
                  {step.status === 'completed' && <div className="checkmark">✓</div>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="error-message">
            <p>❌ {error}</p>
          </div>
        )}

        <div className="progress-footer">
          {onCancel && (
            <button className="cancel-button" onClick={onCancel}>
              Cancel
            </button>
          )}
          <div className="progress-hint">
            This usually takes 30-60 seconds depending on your material
          </div>
        </div>
      </div>

      <style jsx>{`
        .analysis-progress-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .analysis-progress-modal {
          background: white;
          border-radius: 16px;
          padding: 32px;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .progress-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .progress-header h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 8px;
        }

        .progress-header p {
          color: #6b7280;
          font-size: 0.9rem;
        }

        .progress-steps {
          position: relative;
        }

        .progress-step {
          display: flex;
          align-items: flex-start;
          margin-bottom: 24px;
          position: relative;
        }

        .progress-step:last-child {
          margin-bottom: 0;
        }

        .step-connector {
          position: relative;
          width: 24px;
          margin-right: 16px;
        }

        .connector-line {
          position: absolute;
          left: 11px;
          top: 32px;
          bottom: -24px;
          width: 2px;
          background: #e5e7eb;
        }

        .step-content {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .step-icon {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          flex-shrink: 0;
        }

        .step-details {
          flex: 1;
        }

        .step-title {
          font-size: 0.9rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 4px 0;
        }

        .step-description {
          font-size: 0.8rem;
          color: #6b7280;
          margin: 0;
        }

        .step-status {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #e5e7eb;
          border-top: 2px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .checkmark {
          color: #10b981;
          font-weight: bold;
          font-size: 1.1rem;
        }

        .step-completed .step-title {
          color: #10b981;
        }

        .step-completed .connector-line {
          background: #10b981;
        }

        .step-active .step-title {
          color: #3b82f6;
        }

        .step-active .connector-line {
          background: #3b82f6;
        }

        .step-error .step-title {
          color: #ef4444;
        }

        .step-error .connector-line {
          background: #ef4444;
        }

        .error-message {
          margin-top: 24px;
          padding: 16px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
        }

        .error-message p {
          margin: 0;
          color: #dc2626;
          font-weight: 500;
        }

        .progress-footer {
          margin-top: 32px;
          text-align: center;
        }

        .cancel-button {
          padding: 8px 16px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 16px;
        }

        .cancel-button:hover {
          background: #dc2626;
        }

        .progress-hint {
          font-size: 0.8rem;
          color: #6b7280;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .analysis-progress-modal {
            padding: 24px;
            margin: 16px;
          }

          .step-content {
            gap: 8px;
          }

          .step-title {
            font-size: 0.85rem;
          }

          .step-description {
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AnalysisProgressScreen;
