// components/shared/JourneyDraftPreview.tsx

import React, { useState } from 'react';
import { ContentAnalysis, PersonalJourney } from '../../types';

interface JourneyDraftPreviewProps {
  analysis: ContentAnalysis;
  journey?: Partial<PersonalJourney>;
  isVisible: boolean;
  onStartJourney: () => void;
  onEditJourney: () => void;
  onSaveForLater: () => void;
  onClose: () => void;
}

const JourneyDraftPreview: React.FC<JourneyDraftPreviewProps> = ({
  analysis,
  journey,
  isVisible,
  onStartJourney,
  onEditJourney,
  onSaveForLater,
  onClose
}) => {
  const [enableVoiceNarration, setEnableVoiceNarration] = useState(journey?.enableVoiceNarration || false);

  if (!isVisible) return null;

  // Mock data for preview - in real implementation this would come from the journey
  const mockIntroScene = {
    title: "Welcome to Your Learning Journey",
    narrator: "Embark on an exciting adventure through history...",
    imageUrl: "/api/placeholder/400/200"
  };

  const mockMicroLessons = [
    { title: "Key Concepts", content: "Understanding the fundamental ideas..." },
    { title: "Timeline Overview", content: "How events unfolded over time..." },
    { title: "Cause & Effect", content: "What led to these important changes..." }
  ];

  const mockTasks = [
    { type: "Multiple Choice", question: "What was the main cause?" },
    { type: "Drag & Drop Timeline", question: "Arrange events in order" },
    { type: "Short Explanation", question: "Explain like I'm 12..." }
  ];

  const mockQuiz = {
    questionsCount: 7,
    estimatedTime: "5-7 minutes",
    difficulty: analysis.difficulty
  };

  const estimatedXp = 150; // Mock XP value

  return (
    <div className="journey-preview-overlay">
      <div className="journey-preview-modal">
        <div className="preview-header">
          <h2>Journey Draft Preview</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="preview-content">
          {/* Summary Card */}
          <div className="summary-card">
            <h3>{analysis.title}</h3>
            <div className="summary-details">
              <span className="topic-tag">{analysis.topics[0] || 'General'}</span>
              <span className="difficulty-tag">{analysis.difficulty}</span>
              <span className="time-estimate">~{analysis.estimatedTime} min</span>
            </div>
            <p className="summary-text">{analysis.summary}</p>
          </div>

          {/* Journey Preview Deck */}
          <div className="preview-deck">
            {/* Intro Scene */}
            <div className="preview-card intro-card">
              <div className="card-header">
                <h4>🎬 Intro Scene</h4>
              </div>
              <div className="card-content">
                <div className="scene-preview">
                  <div className="scene-image-placeholder">
                    <span>🏛️</span>
                  </div>
                  <div className="scene-text">
                    <p className="narrator-line">{mockIntroScene.narrator}</p>
                    <div className="voice-toggle">
                      <label>
                        <input
                          type="checkbox"
                          checked={enableVoiceNarration}
                          onChange={(e) => setEnableVoiceNarration(e.target.checked)}
                        />
                        Enable Voice Narration
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Micro-lessons */}
            <div className="preview-card lessons-card">
              <div className="card-header">
                <h4>📚 Micro-Lessons (2-4 cards)</h4>
              </div>
              <div className="card-content">
                <div className="lessons-preview">
                  {mockMicroLessons.map((lesson, index) => (
                    <div key={index} className="lesson-item">
                      <span className="lesson-number">{index + 1}</span>
                      <div className="lesson-content">
                        <h5>{lesson.title}</h5>
                        <p>{lesson.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Interactive Tasks */}
            <div className="preview-card tasks-card">
              <div className="card-header">
                <h4>🎯 Interactive Tasks</h4>
              </div>
              <div className="card-content">
                <div className="tasks-preview">
                  {mockTasks.map((task, index) => (
                    <div key={index} className="task-item">
                      <span className="task-icon">
                        {task.type === 'Multiple Choice' ? '🔘' :
                         task.type === 'Drag & Drop Timeline' ? '📅' : '💭'}
                      </span>
                      <div className="task-content">
                        <span className="task-type">{task.type}</span>
                        <p className="task-question">{task.question}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Quiz */}
            <div className="preview-card quiz-card">
              <div className="card-header">
                <h4>🧠 Quick Quiz</h4>
              </div>
              <div className="card-content">
                <div className="quiz-preview">
                  <div className="quiz-stats">
                    <span>{mockQuiz.questionsCount} questions</span>
                    <span>{mockQuiz.estimatedTime}</span>
                    <span className="difficulty">{mockQuiz.difficulty}</span>
                  </div>
                  <p>Adaptive questions based on your performance</p>
                </div>
              </div>
            </div>

            {/* Recap & XP */}
            <div className="preview-card recap-card">
              <div className="card-header">
                <h4>🏆 Recap & XP</h4>
              </div>
              <div className="card-content">
                <div className="recap-preview">
                  <div className="xp-display">
                    <span className="xp-amount">+{estimatedXp} XP</span>
                    <span className="xp-description">Based on accuracy and time</span>
                  </div>
                  <div className="recap-features">
                    <span>📊 Performance summary</span>
                    <span>🎖️ Achievement badges</span>
                    <span>🔄 Review difficult items</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="preview-actions">
            <button className="action-button primary" onClick={onStartJourney}>
              🚀 Start Journey
            </button>
            <button className="action-button secondary" onClick={onEditJourney}>
              ✏️ Edit
            </button>
            <button className="action-button tertiary" onClick={onSaveForLater}>
              💾 Save for Later
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .journey-preview-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .journey-preview-modal {
          background: white;
          border-radius: 16px;
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 32px;
          border-bottom: 1px solid #e5e7eb;
        }

        .preview-header h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6b7280;
          padding: 4px;
          border-radius: 4px;
        }

        .close-button:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .preview-content {
          padding: 0 32px 32px;
        }

        .summary-card {
          background: #f8fafc;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          border: 1px solid #e2e8f0;
        }

        .summary-card h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 12px 0;
        }

        .summary-details {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }

        .topic-tag, .difficulty-tag, .time-estimate {
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .topic-tag {
          background: #dbeafe;
          color: #1e40af;
        }

        .difficulty-tag {
          background: #fef3c7;
          color: #92400e;
        }

        .time-estimate {
          background: #f0fdf4;
          color: #166534;
        }

        .summary-text {
          color: #4b5563;
          margin: 0;
          line-height: 1.5;
        }

        .preview-deck {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 32px;
        }

        .preview-card {
          background: white;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          overflow: hidden;
        }

        .card-header {
          background: #f9fafb;
          padding: 16px 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .card-header h4 {
          font-size: 1rem;
          font-weight: 600;
          color: #374151;
          margin: 0;
        }

        .card-content {
          padding: 20px;
        }

        .scene-preview {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .scene-image-placeholder {
          width: 80px;
          height: 60px;
          background: #f3f4f6;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }

        .scene-text {
          flex: 1;
        }

        .narrator-line {
          font-style: italic;
          color: #4b5563;
          margin: 0 0 12px 0;
        }

        .voice-toggle label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9rem;
          color: #374151;
          cursor: pointer;
        }

        .lessons-preview {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .lesson-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }

        .lesson-number {
          width: 24px;
          height: 24px;
          background: #3b82f6;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: 600;
          flex-shrink: 0;
        }

        .lesson-content h5 {
          font-size: 0.9rem;
          font-weight: 600;
          color: #374151;
          margin: 0 0 4px 0;
        }

        .lesson-content p {
          font-size: 0.8rem;
          color: #6b7280;
          margin: 0;
        }

        .tasks-preview {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .task-item {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .task-icon {
          font-size: 1.2rem;
        }

        .task-type {
          font-size: 0.8rem;
          font-weight: 600;
          color: #374151;
          display: block;
        }

        .task-question {
          font-size: 0.8rem;
          color: #6b7280;
          margin: 2px 0 0 0;
        }

        .quiz-preview {
          text-align: center;
        }

        .quiz-stats {
          display: flex;
          justify-content: center;
          gap: 16px;
          margin-bottom: 8px;
        }

        .quiz-stats span {
          padding: 4px 8px;
          background: #f3f4f6;
          border-radius: 6px;
          font-size: 0.8rem;
          color: #374151;
        }

        .recap-preview {
          text-align: center;
        }

        .xp-display {
          margin-bottom: 16px;
        }

        .xp-amount {
          font-size: 1.5rem;
          font-weight: 700;
          color: #f59e0b;
          display: block;
        }

        .xp-description {
          font-size: 0.8rem;
          color: #6b7280;
        }

        .recap-features {
          display: flex;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .recap-features span {
          font-size: 0.8rem;
          color: #374151;
          background: #f0f9ff;
          padding: 4px 8px;
          border-radius: 6px;
        }

        .preview-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .action-button {
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          font-size: 1rem;
        }

        .action-button.primary {
          background: #3b82f6;
          color: white;
        }

        .action-button.primary:hover {
          background: #2563eb;
        }

        .action-button.secondary {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .action-button.secondary:hover {
          background: #e5e7eb;
        }

        .action-button.tertiary {
          background: #fef3c7;
          color: #92400e;
        }

        .action-button.tertiary:hover {
          background: #fde68a;
        }

        @media (max-width: 768px) {
          .journey-preview-modal {
            margin: 0;
            max-height: 100vh;
            border-radius: 0;
          }

          .preview-header, .preview-content {
            padding-left: 20px;
            padding-right: 20px;
          }

          .summary-details {
            flex-direction: column;
            align-items: flex-start;
          }

          .scene-preview {
            flex-direction: column;
            text-align: center;
          }

          .preview-actions {
            flex-direction: column;
          }

          .action-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default JourneyDraftPreview;
