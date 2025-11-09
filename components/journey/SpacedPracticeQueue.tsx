// components/journey/SpacedPracticeQueue.tsx

import React, { useState, useEffect } from 'react';
import { Question } from '../../types';

interface SpacedPracticeItem {
  question: Question;
  nextReview: Date;
  difficulty: number; // 1-5, higher = harder
  timesReviewed: number;
  lastReviewed: Date | null;
  id: string;
}

interface SpacedPracticeQueueProps {
  userId: string;
}

const SpacedPracticeQueue: React.FC<SpacedPracticeQueueProps> = ({ userId }) => {
  const [queue, setQueue] = useState<SpacedPracticeItem[]>([]);
  const [dueItems, setDueItems] = useState<SpacedPracticeItem[]>([]);
  const [showQueue, setShowQueue] = useState(false);

  useEffect(() => {
    loadSpacedPracticeQueue();
    // Check for due items every minute
    const interval = setInterval(checkDueItems, 60000);
    return () => clearInterval(interval);
  }, [userId]);

  const loadSpacedPracticeQueue = () => {
    // In production, this would load from IndexedDB or Firestore
    // For now, use localStorage as a placeholder
    const saved = localStorage.getItem(`spaced_practice_${userId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const items: SpacedPracticeItem[] = parsed.map((item: any) => ({
          ...item,
          nextReview: new Date(item.nextReview),
          lastReviewed: item.lastReviewed ? new Date(item.lastReviewed) : null,
        }));
        setQueue(items);
        checkDueItems(items);
      } catch (error) {
        console.error('Failed to load spaced practice queue:', error);
      }
    }
  };

  const saveSpacedPracticeQueue = (items: SpacedPracticeItem[]) => {
    localStorage.setItem(`spaced_practice_${userId}`, JSON.stringify(items));
    setQueue(items);
    checkDueItems(items);
  };

  const checkDueItems = (items: SpacedPracticeItem[] = queue) => {
    const now = new Date();
    const due = items.filter(item => item.nextReview <= now);
    setDueItems(due);
  };

  const addToQueue = (question: Question) => {
    const newItem: SpacedPracticeItem = {
      question,
      nextReview: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      difficulty: 3, // Default difficulty
      timesReviewed: 0,
      lastReviewed: null,
      id: `sp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    const updatedQueue = [...queue, newItem];
    saveSpacedPracticeQueue(updatedQueue);
  };

  const reviewItem = (itemId: string, performance: 'easy' | 'good' | 'hard') => {
    const updatedQueue = queue.map(item => {
      if (item.id === itemId) {
        const newDifficulty = calculateNewDifficulty(item.difficulty, performance);
        const nextReviewDate = calculateNextReview(item, performance);

        return {
          ...item,
          difficulty: newDifficulty,
          nextReview: nextReviewDate,
          timesReviewed: item.timesReviewed + 1,
          lastReviewed: new Date(),
        };
      }
      return item;
    });

    saveSpacedPracticeQueue(updatedQueue);
  };

  const calculateNewDifficulty = (currentDifficulty: number, performance: 'easy' | 'good' | 'hard'): number => {
    let adjustment = 0;
    switch (performance) {
      case 'easy':
        adjustment = -0.5;
        break;
      case 'good':
        adjustment = 0;
        break;
      case 'hard':
        adjustment = 0.5;
        break;
    }

    return Math.max(1, Math.min(5, currentDifficulty + adjustment));
  };

  const calculateNextReview = (item: SpacedPracticeItem, performance: 'easy' | 'good' | 'hard'): Date => {
    const baseIntervals = {
      easy: 7 * 24 * 60 * 60 * 1000,   // 7 days
      good: 24 * 60 * 60 * 1000,       // 1 day
      hard: 4 * 60 * 60 * 1000,        // 4 hours
    };

    const interval = baseIntervals[performance];
    const difficultyMultiplier = item.difficulty / 3; // Normalize around 1

    return new Date(Date.now() + (interval * difficultyMultiplier));
  };

  const removeFromQueue = (itemId: string) => {
    const updatedQueue = queue.filter(item => item.id !== itemId);
    saveSpacedPracticeQueue(updatedQueue);
  };

  if (dueItems.length === 0 && !showQueue) {
    return null;
  }

  return (
    <div className="spaced-practice-queue">
      <div className="queue-header">
        <button
          className="queue-toggle"
          onClick={() => setShowQueue(!showQueue)}
        >
          🧠 Spaced Practice {dueItems.length > 0 && `(${dueItems.length} due)`}
          <span className={`toggle-icon ${showQueue ? 'open' : ''}`}>▼</span>
        </button>

        {dueItems.length > 0 && !showQueue && (
          <div className="due-indicator">
            <span className="due-count">{dueItems.length}</span>
            <span>questions ready for review</span>
          </div>
        )}
      </div>

      {showQueue && (
        <div className="queue-content">
          <div className="queue-stats">
            <div className="stat-item">
              <span className="stat-label">Due Now:</span>
              <span className="stat-value">{dueItems.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Queue:</span>
              <span className="stat-value">{queue.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Next Review:</span>
              <span className="stat-value">
                {queue.length > 0 ? formatTimeUntil(queue[0].nextReview) : 'None'}
              </span>
            </div>
          </div>

          <div className="queue-items">
            {queue
              .sort((a, b) => a.nextReview.getTime() - b.nextReview.getTime())
              .map(item => {
                const isDue = item.nextReview <= new Date();
                return (
                  <div key={item.id} className={`queue-item ${isDue ? 'due' : 'upcoming'}`}>
                    <div className="item-info">
                      <div className="item-question">
                        {item.question.questionText.length > 100
                          ? item.question.questionText.substring(0, 100) + '...'
                          : item.question.questionText
                        }
                      </div>
                      <div className="item-meta">
                        <span className={`difficulty difficulty-${Math.round(item.difficulty)}`}>
                          Difficulty: {item.difficulty.toFixed(1)}
                        </span>
                        <span>Reviewed: {item.timesReviewed} times</span>
                        <span className={isDue ? 'due-time' : 'next-time'}>
                          {isDue ? 'Due now' : `Next: ${formatTimeUntil(item.nextReview)}`}
                        </span>
                      </div>
                    </div>

                    {isDue && (
                      <div className="item-actions">
                        <button
                          className="review-button easy"
                          onClick={() => reviewItem(item.id, 'easy')}
                        >
                          Easy
                        </button>
                        <button
                          className="review-button good"
                          onClick={() => reviewItem(item.id, 'good')}
                        >
                          Good
                        </button>
                        <button
                          className="review-button hard"
                          onClick={() => reviewItem(item.id, 'hard')}
                        >
                          Hard
                        </button>
                      </div>
                    )}

                    <button
                      className="remove-button"
                      onClick={() => removeFromQueue(item.id)}
                      title="Remove from queue"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
          </div>

          {queue.length === 0 && (
            <div className="empty-queue">
              <div className="empty-icon">📚</div>
              <p>No questions in spaced practice queue yet.</p>
              <p>Difficult questions will be added here automatically.</p>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .spaced-practice-queue {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          margin-top: 20px;
          overflow: hidden;
        }

        .queue-header {
          padding: 16px 20px;
          background: #f8fafc;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .queue-toggle {
          background: none;
          border: none;
          font-size: 1rem;
          font-weight: 600;
          color: #374151;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .toggle-icon {
          transition: transform 0.2s ease;
          font-size: 0.8rem;
        }

        .toggle-icon.open {
          transform: rotate(180deg);
        }

        .due-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.9rem;
          color: #dc2626;
          font-weight: 500;
        }

        .due-count {
          background: #dc2626;
          color: white;
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .queue-content {
          padding: 20px;
        }

        .queue-stats {
          display: flex;
          gap: 24px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-label {
          font-size: 0.8rem;
          color: #6b7280;
        }

        .stat-value {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1f2937;
        }

        .queue-items {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .queue-item {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          transition: all 0.2s ease;
        }

        .queue-item.due {
          border-color: #dc2626;
          background: #fef2f2;
        }

        .queue-item.upcoming {
          border-color: #d1d5db;
          background: #f9fafb;
        }

        .item-info {
          flex: 1;
        }

        .item-question {
          font-weight: 500;
          color: #1f2937;
          margin-bottom: 8px;
          line-height: 1.4;
        }

        .item-meta {
          display: flex;
          gap: 12px;
          font-size: 0.8rem;
          color: #6b7280;
          flex-wrap: wrap;
        }

        .difficulty {
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 500;
        }

        .difficulty-1 { background: #dcfce7; color: #166534; }
        .difficulty-2 { background: #dbeafe; color: #1e40af; }
        .difficulty-3 { background: #fef3c7; color: #92400e; }
        .difficulty-4 { background: #fed7d7; color: #c53030; }
        .difficulty-5 { background: #feb2b2; color: #9b2c2c; }

        .due-time {
          color: #dc2626;
          font-weight: 600;
        }

        .next-time {
          color: #6b7280;
        }

        .item-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }

        .review-button {
          padding: 6px 12px;
          border: none;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .review-button.easy {
          background: #10b981;
          color: white;
        }

        .review-button.easy:hover {
          background: #059669;
        }

        .review-button.good {
          background: #3b82f6;
          color: white;
        }

        .review-button.good:hover {
          background: #2563eb;
        }

        .review-button.hard {
          background: #ef4444;
          color: white;
        }

        .review-button.hard:hover {
          background: #dc2626;
        }

        .remove-button {
          background: #6b7280;
          color: white;
          border: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .remove-button:hover {
          background: #4b5563;
        }

        .empty-queue {
          text-align: center;
          padding: 40px;
          color: #6b7280;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 16px;
        }

        @media (max-width: 768px) {
          .queue-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .due-indicator {
            justify-content: center;
          }

          .queue-stats {
            justify-content: space-around;
          }

          .queue-item {
            flex-direction: column;
            gap: 12px;
          }

          .item-actions {
            width: 100%;
            justify-content: center;
          }

          .item-meta {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

// Helper function to format time until next review
function formatTimeUntil(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();

  if (diff < 0) return 'Now';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;

  const minutes = Math.floor(diff / (1000 * 60));
  return `${minutes}m`;
}

export default SpacedPracticeQueue;
