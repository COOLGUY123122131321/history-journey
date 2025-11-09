// components/tabs/JourneysTab.tsx

import React from 'react';
import { useProgress } from '../../context/ProgressContext';
import { useAppNavigation } from '../../context/AppNavigationContext';
import { JOURNEYS } from '../../constants';
import { Journey } from '../../types';
import { soundService } from '../../services/soundService';

const JourneysTab: React.FC = () => {
  const { journeys, startNewJourney, generateAndStartJourney } = useProgress();
  const { navigateToUpload } = useAppNavigation();

  const handleStartOfficialJourney = async (journey: Journey) => {
    soundService.playUIClick();
    await generateAndStartJourney(journey);
  };

  const handleStartPersonalJourney = (journeyId: string) => {
    startNewJourney(journeyId);
  };

  const personalJourneys = journeys ? Object.entries(journeys) : [];

  return (
    <div className="journeys-tab">
      <div className="tab-header">
        <h1 className="journey-title">CHOOSE YOUR JOURNEY</h1>
        <p className="journey-subtitle">"Where will history remember your name?"</p>
        <div className="journey-divider"></div>
      </div>

      {/* Official Journeys */}
      <div className="journeys-section">
        <h2 className="section-title">Official Journeys</h2>
        <div className="journeys-grid">
          {JOURNEYS.map((journey, index) => (
            <div
              key={journey.id}
              className="journey-card-official"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <button
                onClick={() => handleStartOfficialJourney(journey)}
                className="journey-card-button"
              >
                {journeys?.[journey.id]?.completed && (
                  <div className="completed-badge">COMPLETED</div>
                )}
                <div
                  className="journey-card-image"
                  style={{ backgroundImage: `url(${journey.cardImage})` }}
                />
                <div className="journey-card-overlay"></div>
                <div className="journey-card-content">
                  <h3 className="journey-card-title">{journey.name}</h3>
                  <p className="journey-card-description">"{journey.description}"</p>
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Personal Journeys */}
      {personalJourneys.length > 0 && (
        <div className="journeys-section">
          <h2 className="section-title">My Personal Journeys</h2>
          <div className="personal-journeys-grid">
            {personalJourneys.map(([journeyId, progress]) => (
              <div key={journeyId} className="personal-journey-card">
                <div className="personal-journey-header">
                  <h3>Journey {journeyId.slice(-8)}</h3>
                  <span className={`status ${progress.completed ? 'completed' : 'in-progress'}`}>
                    {progress.completed ? '✅ Completed' : '🔄 In Progress'}
                  </span>
                </div>
                <div className="personal-journey-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${progress.completed ? 100 : 30}%` }}
                    />
                  </div>
                  <span className="progress-text">
                    {progress.completed ? 'Complete' : '30% Complete'}
                  </span>
                </div>
                <button
                  className="continue-button"
                  onClick={() => handleStartPersonalJourney(journeyId)}
                >
                  {progress.completed ? 'Review Journey' : 'Continue Journey'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State for Personal Journeys */}
      {personalJourneys.length === 0 && (
        <div className="empty-state-section">
          <div className="empty-state">
            <div className="empty-icon">🗺️</div>
            <h3>Create Your Own Journey</h3>
            <p>Upload your study materials to create personalized learning journeys</p>
            <button
              className="upload-button"
              onClick={() => navigateToUpload()}
            >
              📤 Upload Material
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .journeys-tab {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
          background: #2C2A29;
          min-height: calc(100vh - 140px);
        }

        .tab-header {
          text-align: center;
          margin-bottom: 48px;
          padding-top: 24px;
        }

        .journey-title {
          font-size: 3rem;
          font-weight: 700;
          font-family: 'Cinzel', serif;
          color: #b68b3a;
          letter-spacing: 0.1em;
          margin-bottom: 8px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .journey-subtitle {
          color: #e5e7eb;
          font-size: 1.2rem;
          font-style: italic;
          margin-bottom: 16px;
        }

        .journey-divider {
          width: 50%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #b68b3a, transparent);
          margin: 0 auto;
          position: relative;
          overflow: hidden;
        }

        .journey-divider::after {
          content: '';
          position: absolute;
          top: 0;
          left: -25%;
          width: 25%;
          height: 100%;
          background: #b68b3a;
          animation: sparkle 2s linear infinite;
        }

        .journeys-section {
          margin-bottom: 48px;
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #b68b3a;
          margin-bottom: 24px;
          font-family: 'Cinzel', serif;
        }

        .journeys-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 32px;
          margin-bottom: 32px;
        }

        .journey-card-official {
          padding: 6px;
          border-radius: 16px;
          transition: all 0.3s ease;
          background: linear-gradient(135deg, #6b4f3a, rgba(107, 79, 58, 0.6));
          opacity: 0;
          animation: fadeInUp 0.6s ease-out forwards;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .journey-card-official:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(161, 124, 91, 0.4);
          background: linear-gradient(135deg, #a17c5b, #6b4f3a);
        }

        .journey-card-button {
          position: relative;
          aspect-ratio: 4/5;
          border-radius: 12px;
          text-align: left;
          overflow: hidden;
          width: 100%;
          border: none;
          cursor: pointer;
          padding: 0;
        }

        .journey-card-image {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          transition: transform 0.5s ease-in-out;
        }

        .journey-card-button:hover .journey-card-image {
          transform: scale(1.1);
        }

        .journey-card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent);
          transition: all 0.3s ease;
        }

        .journey-card-button:hover .journey-card-overlay {
          background: linear-gradient(to top, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.3));
        }

        .journey-card-content {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          padding: 24px;
          text-align: center;
          z-index: 1;
        }

        .journey-card-title {
          font-family: 'Cinzel', serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
          margin-bottom: 8px;
          letter-spacing: 0.05em;
          transition: transform 0.5s ease;
        }

        .journey-card-button:hover .journey-card-title {
          transform: scale(1.05);
        }

        .journey-card-description {
          font-size: 0.9rem;
          color: #d1d5db;
          font-style: italic;
          margin: 0;
        }

        .completed-badge {
          position: absolute;
          top: 12px;
          right: -44px;
          z-index: 10;
          background: #b68b3a;
          color: #2C2A29;
          font-weight: 700;
          padding: 4px 48px;
          transform: rotate(45deg);
          font-size: 0.75rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .personal-journeys-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 24px;
        }

        .personal-journey-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 24px;
          border: 1px solid rgba(182, 139, 58, 0.3);
          backdrop-filter: blur(10px);
        }

        .personal-journey-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .personal-journey-header h3 {
          font-size: 1.2rem;
          font-weight: 600;
          color: #e5e7eb;
        }

        .status {
          font-size: 0.9rem;
          padding: 4px 8px;
          border-radius: 6px;
          font-weight: 500;
        }

        .status.completed {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .status.in-progress {
          background: rgba(59, 130, 246, 0.2);
          color: #60a5fa;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .personal-journey-progress {
          margin-bottom: 16px;
        }

        .progress-bar {
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          margin-bottom: 8px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #b68b3a, #d97706);
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 0.9rem;
          color: #9ca3af;
        }

        .continue-button {
          width: 100%;
          padding: 12px;
          background: #b68b3a;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .continue-button:hover {
          background: #d97706;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(182, 139, 58, 0.4);
        }

        .empty-state-section {
          margin-top: 48px;
        }

        .empty-state {
          text-align: center;
          padding: 64px 24px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          border: 2px dashed rgba(182, 139, 58, 0.3);
          backdrop-filter: blur(10px);
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 16px;
        }

        .empty-state h3 {
          font-size: 1.5rem;
          color: #e5e7eb;
          margin-bottom: 8px;
        }

        .empty-state p {
          color: #9ca3af;
          margin-bottom: 24px;
        }

        .upload-button {
          padding: 12px 24px;
          background: #b68b3a;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .upload-button:hover {
          background: #d97706;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(182, 139, 58, 0.4);
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes sparkle {
          0% {
            left: -25%;
          }
          100% {
            left: 125%;
          }
        }

        @media (max-width: 768px) {
          .journey-title {
            font-size: 2rem;
          }

          .journeys-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .personal-journeys-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default JourneysTab;
