// components/journey/ProgressTracker.tsx

import React from 'react';
import { PersonalJourney } from '../../types';

interface ProgressTrackerProps {
  journey: PersonalJourney;
  currentStepIndex: number;
  totalSteps: number;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  journey,
  currentStepIndex,
  totalSteps
}) => {
  const progressPercentage = ((currentStepIndex + 1) / totalSteps) * 100;
  const completedSteps = currentStepIndex + 1;
  const remainingSteps = totalSteps - completedSteps;

  // Calculate estimated time remaining
  const avgStepTime = journey.estMinutes * 60 / totalSteps; // seconds per step
  const estimatedTimeRemaining = Math.round((remainingSteps * avgStepTime) / 60); // minutes

  return (
    <div className="progress-tracker">
      <div className="progress-info">
        <div className="progress-stats">
          <span className="current-step">{completedSteps}</span>
          <span className="total-steps">of {totalSteps}</span>
          <span className="progress-label">steps completed</span>
        </div>

        <div className="time-estimate">
          {estimatedTimeRemaining > 0 ? (
            <span>~{estimatedTimeRemaining} min remaining</span>
          ) : (
            <span>🎉 Almost done!</span>
          )}
        </div>
      </div>

      <div className="progress-bar-container">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <div className="progress-milestones">
          {Array.from({ length: totalSteps }, (_, index) => (
            <div
              key={index}
              className={`milestone ${index <= currentStepIndex ? 'completed' : index === currentStepIndex + 1 ? 'next' : ''}`}
            >
              {index <= currentStepIndex && <span className="checkmark">✓</span>}
              {index === currentStepIndex + 1 && <span className="next-indicator">→</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="journey-overview">
        <div className="overview-item">
          <span className="overview-label">XP Earned:</span>
          <span className="overview-value">{journey.progress?.xpEarned || 0} XP</span>
        </div>
        <div className="overview-item">
          <span className="overview-label">Estimated Time:</span>
          <span className="overview-value">{journey.estMinutes} min</span>
        </div>
        <div className="overview-item">
          <span className="overview-label">Difficulty:</span>
          <span className="overview-value">{journey.analysis?.difficulty || 'intermediate'}</span>
        </div>
      </div>

      <style jsx>{`
        .progress-tracker {
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-width: 250px;
        }

        .progress-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .progress-stats {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .current-step {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
        }

        .total-steps {
          font-size: 1.1rem;
          color: #6b7280;
        }

        .progress-label {
          font-size: 0.9rem;
          color: #6b7280;
        }

        .time-estimate {
          font-size: 0.9rem;
          color: #6b7280;
          font-weight: 500;
        }

        .progress-bar-container {
          position: relative;
        }

        .progress-bar {
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981, #3b82f6);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .progress-milestones {
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
        }

        .milestone {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid #e5e7eb;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          position: relative;
          z-index: 1;
        }

        .milestone.completed {
          background: #10b981;
          border-color: #10b981;
          color: white;
        }

        .milestone.next {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
          animation: pulse 2s infinite;
        }

        .checkmark {
          font-weight: bold;
        }

        .next-indicator {
          font-weight: bold;
          color: #3b82f6;
        }

        .journey-overview {
          display: flex;
          gap: 16px;
          margin-top: 8px;
        }

        .overview-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .overview-label {
          font-size: 0.8rem;
          color: #6b7280;
        }

        .overview-value {
          font-size: 0.9rem;
          font-weight: 600;
          color: #1f2937;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }

        @media (max-width: 768px) {
          .progress-tracker {
            min-width: unset;
            width: 100%;
          }

          .progress-info {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .journey-overview {
            justify-content: space-around;
            flex-wrap: wrap;
          }

          .overview-item {
            min-width: 80px;
          }
        }
      `}</style>
    </div>
  );
};

export default ProgressTracker;
