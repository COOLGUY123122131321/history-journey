// components/tabs/TodayTab.tsx

import React, { useState, useEffect } from 'react';
import { TodayHistoryEvent, TodayHistory } from '../../types';
import { getTodayHistory, completeTodayEvent, createMiniJourneyFromEvent, getSurpriseEvent } from '../../services/todayHistoryService';
import { useAuth } from '../../context/AuthContext';

const TodayTab: React.FC = () => {
  const { user } = useAuth();
  const [todayData, setTodayData] = useState<TodayHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<TodayHistoryEvent | null>(null);
  const [showSurprise, setShowSurprise] = useState(false);
  const [streak, setStreak] = useState(0); // Track streak separately

  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  useEffect(() => {
    if (user) {
      loadTodayHistory();
    }
  }, [user]);

  const loadTodayHistory = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getTodayHistory({
        userId: user.uid,
        currentTopics: [], // This would come from user's current studies
        preferredDifficulty: 'intermediate',
        streakCount: 0,
      });
      setTodayData(data);
    } catch (error) {
      console.error('Failed to load today history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEventComplete = async (event: TodayHistoryEvent) => {
    if (!user) return;

    try {
      const result = await completeTodayEvent(user.uid, event.year, event.title);

      // Update local state
      setTodayData(prev => prev ? {
        ...prev,
        events: prev.events.map(e =>
          e.year === event.year && e.title === event.title
            ? { ...e, isCompleted: true }
            : e
        ),
      } : null);

      setStreak(result.newStreak);

      // Show success message
      alert(`Great! You earned ${result.xpEarned} XP. Current streak: ${result.newStreak} days!`);
    } catch (error) {
      console.error('Failed to complete event:', error);
    }
  };

  const handleCreateMiniJourney = async (event: TodayHistoryEvent) => {
    if (!user) return;

    try {
      const journeyId = await createMiniJourneyFromEvent(event, user.uid);
      alert(`Mini-journey created! Journey ID: ${journeyId}`);
      // In a real app, this would navigate to the journey
    } catch (error) {
      console.error('Failed to create mini-journey:', error);
    }
  };

  const handleSurpriseMe = async () => {
    if (!user) return;

    try {
      setShowSurprise(true);
      const surpriseEvent = await getSurpriseEvent(user.uid);
      setSelectedEvent(surpriseEvent);
    } catch (error) {
      console.error('Failed to get surprise event:', error);
      setShowSurprise(false);
    }
  };

  if (loading) {
    return (
      <div className="today-tab">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading today's history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="today-tab">
      {/* Daily Banner */}
      <div className="daily-banner">
        <div className="banner-content">
          <div className="banner-date">
            <h1>{formattedDate.split(',')[0]}</h1>
            <p>{formattedDate.split(',')[1]}</p>
          </div>
          <div className="banner-title">
            <h2>What happened on this day?</h2>
            <p>Discover historical events that shaped our world</p>
          </div>
          <div className="banner-streak">
            <div className="streak-display">
              <span className="streak-icon">🔥</span>
              <span className="streak-count">{streak}</span>
              <span className="streak-label">day streak</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="today-content">
        {/* Quick Actions */}
        <div className="today-actions">
          <button className="action-button surprise" onClick={handleSurpriseMe}>
            🎲 Surprise Me
          </button>
          <button className="action-button calendar">
            📅 Calendar View
          </button>
        </div>

        {/* Events List */}
        <div className="events-section">
          <h3>Today's Historical Events</h3>
          <div className="events-grid">
            {(showSurprise && selectedEvent ? [selectedEvent] : todayData?.events || []).map((event, index) => (
              <div key={`${event.year}-${event.title}`} className={`event-card ${event.isCompleted ? 'completed' : ''}`}>
                <div className="event-header">
                  <div className="event-year">{event.year}</div>
                  <div className="event-status">
                    {event.isCompleted && <span className="completed-badge">✅ Done</span>}
                  </div>
                </div>

                <div className="event-content">
                  <h4 className="event-title">{event.title}</h4>
                  <p className="event-summary">{event.summary}</p>

                  <div className="event-tags">
                    {event.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="event-tag">{tag}</span>
                    ))}
                  </div>
                </div>

                <div className="event-actions">
                  <button
                    className="action-button learn-more"
                    onClick={() => setSelectedEvent(event)}
                  >
                    📖 Learn More
                  </button>
                  <button
                    className="action-button mini-journey"
                    onClick={() => handleCreateMiniJourney(event)}
                  >
                    🗺️ Mini Journey
                  </button>
                  {!event.isCompleted && (
                    <button
                      className="action-button complete"
                      onClick={() => handleEventComplete(event)}
                    >
                      ✅ Mark Complete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Personalization Note */}
        <div className="personalization-note">
          <p>
            💡 <strong>Personalized for you:</strong> These events are selected based on your current studies.
            Complete them daily to build your history knowledge and maintain your streak!
          </p>
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="event-modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="event-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedEvent.year} - {selectedEvent.title}</h3>
              <button className="close-button" onClick={() => setSelectedEvent(null)}>✕</button>
            </div>

            <div className="modal-content">
              <p className="event-detail-summary">{selectedEvent.summary}</p>

              <div className="event-metadata">
                <div className="tags-section">
                  <h4>Tags:</h4>
                  <div className="tags-list">
                    {selectedEvent.tags.map(tag => (
                      <span key={tag} className="tag-item">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  className="modal-button primary"
                  onClick={() => handleCreateMiniJourney(selectedEvent)}
                >
                  🚀 Start Mini Journey (5-7 min)
                </button>
                <button
                  className="modal-button secondary"
                  onClick={() => {/* Would navigate to explore similar events */}}
                >
                  🔍 Explore Related Events
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .today-tab {
          padding: 0;
          max-width: 1200px;
          margin: 0 auto;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 100px 24px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        .daily-banner {
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          color: white;
          padding: 40px 24px;
          margin-bottom: 32px;
        }

        .banner-content {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 2fr 1fr;
          gap: 24px;
          align-items: center;
        }

        .banner-date h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin: 0;
        }

        .banner-date p {
          font-size: 1.2rem;
          margin: 4px 0 0 0;
          opacity: 0.9;
        }

        .banner-title h2 {
          font-size: 1.8rem;
          font-weight: 600;
          margin: 0 0 8px 0;
        }

        .banner-title p {
          margin: 0;
          opacity: 0.9;
        }

        .banner-streak {
          text-align: right;
        }

        .streak-display {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.2);
          padding: 12px 16px;
          border-radius: 24px;
          backdrop-filter: blur(10px);
        }

        .streak-icon {
          font-size: 1.5rem;
        }

        .streak-count {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .streak-label {
          font-size: 0.9rem;
          opacity: 0.9;
        }

        .today-content {
          padding: 0 24px 32px;
        }

        .today-actions {
          display: flex;
          gap: 12px;
          margin-bottom: 32px;
        }

        .action-button {
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-button.surprise {
          background: #f59e0b;
          color: white;
        }

        .action-button.surprise:hover {
          background: #d97706;
        }

        .action-button.calendar {
          background: #e5e7eb;
          color: #374151;
        }

        .action-button.calendar:hover {
          background: #d1d5db;
        }

        .events-section h3 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 20px;
        }

        .events-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .event-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
          transition: all 0.2s ease;
        }

        .event-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transform: translateY(-2px);
        }

        .event-card.completed {
          background: #f0fdf4;
          border-color: #bbf7d0;
        }

        .event-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .event-year {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
        }

        .completed-badge {
          background: #dcfce7;
          color: #166534;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .event-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 8px 0;
        }

        .event-summary {
          color: #6b7280;
          margin: 0 0 12px 0;
          line-height: 1.5;
        }

        .event-tags {
          display: flex;
          gap: 6px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .event-tag {
          background: #f3f4f6;
          color: #374151;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.8rem;
        }

        .event-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .event-actions .action-button {
          padding: 8px 12px;
          font-size: 0.9rem;
          flex: 1;
          min-width: 120px;
        }

        .personalization-note {
          background: #eff6ff;
          border: 1px solid #dbeafe;
          border-radius: 8px;
          padding: 16px;
          margin-top: 24px;
        }

        .personalization-note p {
          margin: 0;
          color: #1e40af;
        }

        .event-modal-overlay {
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

        .event-modal {
          background: white;
          border-radius: 12px;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-header h3 {
          font-size: 1.25rem;
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
        }

        .modal-content {
          padding: 24px;
        }

        .event-detail-summary {
          font-size: 1rem;
          line-height: 1.6;
          color: #374151;
          margin-bottom: 20px;
        }

        .tags-section h4 {
          font-size: 0.9rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        .tags-list {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .tag-item {
          background: #e5e7eb;
          color: #374151;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.8rem;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .modal-button {
          flex: 1;
          padding: 12px 16px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .modal-button.primary {
          background: #3b82f6;
          color: white;
        }

        .modal-button.primary:hover {
          background: #2563eb;
        }

        .modal-button.secondary {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .modal-button.secondary:hover {
          background: #e5e7eb;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .banner-content {
            grid-template-columns: 1fr;
            text-align: center;
            gap: 16px;
          }

          .banner-streak {
            text-align: center;
          }

          .events-grid {
            grid-template-columns: 1fr;
          }

          .event-actions {
            flex-direction: column;
          }

          .event-actions .action-button {
            min-width: unset;
          }

          .modal-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default TodayTab;
