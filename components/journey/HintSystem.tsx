// components/journey/HintSystem.tsx

import React, { useState, useEffect } from 'react';
import { PersonalJourney, JourneyStep } from '../../types';

interface HintSystemProps {
  journey: PersonalJourney;
  currentStep: JourneyStep;
}

interface ContextualHint {
  type: 'progress' | 'struggle' | 'encouragement' | 'tip';
  message: string;
  icon: string;
  priority: number; // 1-5, higher = more important
}

const HintSystem: React.FC<HintSystemProps> = ({ journey, currentStep }) => {
  const [hints, setHints] = useState<ContextualHint[]>([]);
  const [visibleHints, setVisibleHints] = useState<ContextualHint[]>([]);
  const [dismissedHints, setDismissedHints] = useState<Set<string>>(new Set());

  useEffect(() => {
    generateHints();
  }, [journey, currentStep]);

  useEffect(() => {
    // Show only high-priority hints that haven't been dismissed
    const availableHints = hints
      .filter(hint => !dismissedHints.has(hint.message))
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 2); // Show max 2 hints

    setVisibleHints(availableHints);
  }, [hints, dismissedHints]);

  const generateHints = () => {
    const newHints: ContextualHint[] = [];

    // Progress-based hints
    const progressPercent = journey.progress ?
      (journey.progress.completedScenes / journey.progress.totalScenes) * 100 : 0;

    if (progressPercent >= 75) {
      newHints.push({
        type: 'progress',
        message: "You're almost there! Keep up the great work.",
        icon: '🏁',
        priority: 4,
      });
    } else if (progressPercent >= 50) {
      newHints.push({
        type: 'progress',
        message: "Halfway through! You're doing excellent.",
        icon: '🎯',
        priority: 3,
      });
    }

    // Time-based hints
    const timeSpent = journey.progress?.timeSpent || 0;
    const estimatedTime = journey.estMinutes * 60;

    if (timeSpent > estimatedTime * 1.5) {
      newHints.push({
        type: 'tip',
        message: "Taking your time is great for learning. No rush!",
        icon: '⏰',
        priority: 2,
      });
    } else if (timeSpent < estimatedTime * 0.3) {
      newHints.push({
        type: 'encouragement',
        message: "You're moving through quickly! Great focus.",
        icon: '⚡',
        priority: 2,
      });
    }

    // Step-specific hints
    if (currentStep.type === 'task') {
      newHints.push({
        type: 'tip',
        message: "Remember to review the material if you get stuck. The answers are there!",
        icon: '📚',
        priority: 3,
      });
    } else if (currentStep.type === 'quiz') {
      newHints.push({
        type: 'tip',
        message: "Quizzes help reinforce learning. Don't worry about getting everything right!",
        icon: '🧠',
        priority: 3,
      });
    }

    // Difficulty-based hints
    if (journey.analysis?.difficulty === 'advanced') {
      newHints.push({
        type: 'encouragement',
        message: "This advanced content is challenging - that's how you grow!",
        icon: '🌟',
        priority: 4,
      });
    } else if (journey.analysis?.difficulty === 'beginner') {
      newHints.push({
        type: 'encouragement',
        message: "Perfect for building strong foundations!",
        icon: '🌱',
        priority: 2,
      });
    }

    // XP-based hints
    const xpEarned = journey.progress?.xpEarned || 0;
    if (xpEarned >= 100) {
      newHints.push({
        type: 'progress',
        message: `Amazing! You've earned ${xpEarned} XP so far.`,
        icon: '⭐',
        priority: 5,
      });
    }

    setHints(newHints);
  };

  const dismissHint = (hintMessage: string) => {
    setDismissedHints(prev => new Set([...prev, hintMessage]));
  };

  if (visibleHints.length === 0) {
    return null;
  }

  return (
    <div className="hint-system">
      <div className="hints-container">
        {visibleHints.map((hint, index) => (
          <div key={index} className={`hint-card ${hint.type}`}>
            <div className="hint-icon">{hint.icon}</div>
            <div className="hint-content">
              <p className="hint-message">{hint.message}</p>
            </div>
            <button
              className="hint-dismiss"
              onClick={() => dismissHint(hint.message)}
              aria-label="Dismiss hint"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <style jsx>{`
        .hint-system {
          margin-bottom: 20px;
        }

        .hints-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .hint-card {
          background: white;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border-left: 4px solid #3b82f6;
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
          animation: slideIn 0.3s ease-out;
        }

        .hint-card.progress {
          border-left-color: #10b981;
          background: linear-gradient(90deg, #f0fdf4 0%, white 20%);
        }

        .hint-card.encouragement {
          border-left-color: #f59e0b;
          background: linear-gradient(90deg, #fffbeb 0%, white 20%);
        }

        .hint-card.tip {
          border-left-color: #8b5cf6;
          background: linear-gradient(90deg, #faf5ff 0%, white 20%);
        }

        .hint-card.struggle {
          border-left-color: #ef4444;
          background: linear-gradient(90deg, #fef2f2 0%, white 20%);
        }

        .hint-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .hint-content {
          flex: 1;
        }

        .hint-message {
          margin: 0;
          color: #374151;
          font-size: 0.95rem;
          line-height: 1.4;
        }

        .hint-dismiss {
          background: none;
          border: none;
          font-size: 1.2rem;
          color: #9ca3af;
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .hint-dismiss:hover {
          background: #f3f4f6;
          color: #6b7280;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @media (max-width: 768px) {
          .hints-container {
            gap: 8px;
          }

          .hint-card {
            padding: 12px;
            gap: 8px;
          }

          .hint-icon {
            font-size: 1.2rem;
          }

          .hint-message {
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
};

export default HintSystem;
