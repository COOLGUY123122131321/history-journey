// components/journey/SceneCard.tsx

import React, { useState, useEffect } from 'react';
import { PersonalJourney, JourneyStep } from '../../types';
import { assetCache } from '../../services/assetCacheService';
import { useAuth } from '../../context/AuthContext';

interface SceneCardProps {
  step: JourneyStep;
  journey: PersonalJourney;
  onComplete: () => void;
  onShowTutor: () => void;
}

const SceneCard: React.FC<SceneCardProps> = ({
  step,
  journey,
  onComplete,
  onShowTutor
}) => {
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSceneAssets();
  }, [step]);

  const loadSceneAssets = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load TTS audio for narrator line if enabled
      if (journey.enableVoiceNarration && step.narratorLine) {
        const ttsUrl = await assetCache.getTTS(
          {
            text: step.narratorLine,
            voice: 'en-US-Neural2-D',
            language: 'en-US'
          },
          user.uid
        );
        setAudioUrl(ttsUrl);
      }

      // Load scene image/video if available
      if (step.imageUrl || step.videoUrl) {
        // Scene assets would be pre-loaded during journey creation
      }

    } catch (error) {
      console.error('Failed to load scene assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAudio = async () => {
    if (!audioUrl) return;

    setIsPlaying(true);
    const audio = new Audio(audioUrl);

    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);

    try {
      await audio.play();
    } catch (error) {
      console.error('Audio playback failed:', error);
      setIsPlaying(false);
    }
  };

  const handleContinue = () => {
    // Stop any playing audio
    if (isPlaying) {
      // Audio would be stopped here
      setIsPlaying(false);
    }
    onComplete();
  };

  if (loading) {
    return (
      <div className="scene-card loading">
        <div className="loading-spinner"></div>
        <p>Loading scene...</p>
      </div>
    );
  }

  return (
    <div className="scene-card">
      <div className="scene-header">
        <div className="scene-type">
          <span className="scene-icon">🎬</span>
          <span className="scene-label">Scene</span>
        </div>
        <div className="scene-actions">
          {journey.enableVoiceNarration && step.narratorLine && (
            <button
              className={`audio-button ${isPlaying ? 'playing' : ''}`}
              onClick={handlePlayAudio}
              disabled={isPlaying}
            >
              {isPlaying ? '🔊 Playing...' : '🔊 Play Audio'}
            </button>
          )}
          <button className="tutor-button" onClick={onShowTutor}>
            💡 Need Help?
          </button>
        </div>
      </div>

      <div className="scene-content">
        {step.imageUrl && (
          <div className="scene-image">
            <img src={step.imageUrl} alt={step.title} />
          </div>
        )}

        {step.videoUrl && (
          <div className="scene-video">
            <video controls>
              <source src={step.videoUrl} type="video/mp4" />
            </video>
          </div>
        )}

        <div className="scene-text">
          <h3 className="scene-title">{step.title}</h3>
          <div className="scene-description">
            {step.content.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          {step.narratorLine && (
            <div className="narrator-line">
              <div className="narrator-icon">🎭</div>
              <blockquote>{step.narratorLine}</blockquote>
            </div>
          )}
        </div>
      </div>

      <div className="scene-footer">
        <div className="scene-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${((journey.steps.findIndex(s => s.id === step.id) + 1) / journey.steps.length) * 100}%`
              }}
            />
          </div>
          <span className="progress-text">
            Step {journey.steps.findIndex(s => s.id === step.id) + 1} of {journey.steps.length}
          </span>
        </div>

        <button className="continue-button" onClick={handleContinue}>
          Continue to Activity →
        </button>
      </div>

      <style jsx>{`
        .scene-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          max-width: 700px;
          margin: 0 auto;
        }

        .scene-card.loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px;
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

        .scene-header {
          background: #f8fafc;
          padding: 16px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #e5e7eb;
        }

        .scene-type {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .scene-icon {
          font-size: 1.2rem;
        }

        .scene-label {
          font-weight: 600;
          color: #374151;
        }

        .scene-actions {
          display: flex;
          gap: 8px;
        }

        .audio-button, .tutor-button {
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
        }

        .audio-button {
          background: #10b981;
          color: white;
        }

        .audio-button:hover:not(:disabled) {
          background: #059669;
        }

        .audio-button.playing {
          background: #6b7280;
          cursor: not-allowed;
        }

        .tutor-button {
          background: #3b82f6;
          color: white;
        }

        .tutor-button:hover {
          background: #2563eb;
        }

        .scene-content {
          padding: 24px;
        }

        .scene-image, .scene-video {
          margin-bottom: 20px;
          border-radius: 8px;
          overflow: hidden;
        }

        .scene-image img {
          width: 100%;
          height: auto;
          display: block;
        }

        .scene-video video {
          width: 100%;
          height: auto;
          display: block;
        }

        .scene-text {
          margin-bottom: 20px;
        }

        .scene-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 12px;
        }

        .scene-description p {
          margin: 0 0 12px 0;
          line-height: 1.6;
          color: #374151;
        }

        .scene-description p:last-child {
          margin-bottom: 0;
        }

        .narrator-line {
          background: #fefce8;
          border-left: 4px solid #f59e0b;
          padding: 16px;
          margin-top: 20px;
          border-radius: 0 8px 8px 0;
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .narrator-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .narrator-line blockquote {
          margin: 0;
          font-style: italic;
          color: #92400e;
          line-height: 1.5;
        }

        .scene-footer {
          background: #f8fafc;
          padding: 20px 24px;
          border-top: 1px solid #e5e7eb;
        }

        .scene-progress {
          margin-bottom: 16px;
        }

        .progress-bar {
          height: 6px;
          background: #e5e7eb;
          border-radius: 3px;
          margin-bottom: 8px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #1d4ed8);
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 0.9rem;
          color: #6b7280;
        }

        .continue-button {
          width: 100%;
          padding: 12px 24px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
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
          .scene-header {
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }

          .scene-actions {
            justify-content: center;
          }

          .scene-content {
            padding: 16px;
          }

          .scene-title {
            font-size: 1.3rem;
          }
        }
      `}</style>
    </div>
  );
};

export default SceneCard;
