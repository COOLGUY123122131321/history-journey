// components/journey/JourneyPlayView.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PersonalJourney, JourneyStep, Question } from '../../types';
import { getJourney, saveJourneyProgress } from '../../services/contentMemoryService';
import { assetCache } from '../../services/assetCacheService';
import SceneCard from './SceneCard';
import TaskCard from './TaskCard';
import ProgressTracker from './ProgressTracker';
import HintSystem from './HintSystem';
import SpacedPracticeQueue from './SpacedPracticeQueue';
import AudioControls from '../shared/AudioControls';
import PrivateTutorPane from '../shared/PrivateTutorPane';

interface JourneyPlayViewProps {
  journeyId: string;
  onComplete: () => void;
  onExit: () => void;
}

type PlayState = 'scene' | 'task' | 'review' | 'complete';

const JourneyPlayView: React.FC<JourneyPlayViewProps> = ({
  journeyId,
  onComplete,
  onExit
}) => {
  const { user } = useAuth();
  const [journey, setJourney] = useState<PersonalJourney | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [playState, setPlayState] = useState<PlayState>('scene');
  const [loading, setLoading] = useState(true);
  const [showTutor, setShowTutor] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(Date.now());
  const [hintsUsed, setHintsUsed] = useState(0);
  const [adaptiveRetries, setAdaptiveRetries] = useState<{ [questionId: string]: number }>({});

  // Load journey data
  useEffect(() => {
    if (user && journeyId) {
      loadJourney();
    }
  }, [user, journeyId]);

  const loadJourney = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const journeyData = await getJourney(user.uid, journeyId);
      if (journeyData) {
        setJourney(journeyData);
        // Load progress
        const progress = await getJourneyProgress(user.uid, journeyId);
        if (progress) {
          setCurrentStepIndex(progress.step);
        }
      }
    } catch (error) {
      console.error('Failed to load journey:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentStep = journey?.steps[currentStepIndex];
  const isLastStep = currentStepIndex >= (journey?.steps.length || 0) - 1;

  const handleStepComplete = useCallback(async (result: any) => {
    if (!journey || !user) return;

    // Save progress
    const progress = {
      journeyId,
      userId: user.uid,
      step: currentStepIndex,
      xpEarned: calculateXpForStep(currentStep!, result),
      accuracy: result.accuracy || [1],
      reviewedAt: new Date(),
      timeSpent: (Date.now() - sessionStartTime) / 1000,
      completed: false,
      firstTryAccuracy: result.firstTry ? 1 : 0,
      hintsUsed,
      retries: Object.values(adaptiveRetries).reduce((sum, r) => sum + r, 0),
      confusionTags: result.confusionTags || [],
      completedAt: isLastStep ? new Date() : undefined,
    };

    await saveJourneyProgress(progress);

    if (isLastStep) {
      setPlayState('complete');
      onComplete();
    } else {
      // Move to next step
      setCurrentStepIndex(prev => prev + 1);
      setPlayState('scene');
      setSessionStartTime(Date.now()); // Reset for next step
      setHintsUsed(0);
    }
  }, [journey, user, journeyId, currentStepIndex, isLastStep, sessionStartTime, hintsUsed, adaptiveRetries, onComplete]);

  const calculateXpForStep = (step: JourneyStep, result: any): number => {
    let baseXp = step.xpValue || 10;

    // Bonus for accuracy and speed
    if (result.accuracy && result.accuracy[0] === 1) {
      baseXp += 5; // Perfect accuracy bonus
    }

    if (result.timeBonus) {
      baseXp += 2; // Speed bonus
    }

    // Penalty for hints and retries
    baseXp -= hintsUsed * 2;
    baseXp -= (adaptiveRetries[step.id] || 0) * 1;

    return Math.max(1, baseXp); // Minimum 1 XP
  };

  const handleHintUsed = useCallback(() => {
    setHintsUsed(prev => prev + 1);
  }, []);

  const handleAdaptiveRetry = useCallback((questionId: string) => {
    setAdaptiveRetries(prev => ({
      ...prev,
      [questionId]: (prev[questionId] || 0) + 1,
    }));
  }, []);

  const handleSpacedPractice = useCallback(async (difficultQuestions: Question[]) => {
    // Add difficult questions to spaced practice queue
    // This would integrate with a spaced repetition system
    console.log('Adding to spaced practice:', difficultQuestions);
  }, []);

  const renderCurrentStep = () => {
    if (!currentStep) return null;

    switch (playState) {
      case 'scene':
        return (
          <SceneCard
            step={currentStep}
            journey={journey!}
            onComplete={() => setPlayState('task')}
            onShowTutor={() => setShowTutor(true)}
          />
        );

      case 'task':
        return (
          <TaskCard
            step={currentStep}
            journey={journey!}
            onComplete={handleStepComplete}
            onHintUsed={handleHintUsed}
            onAdaptiveRetry={handleAdaptiveRetry}
            onSpacedPractice={handleSpacedPractice}
            onShowTutor={() => setShowTutor(true)}
          />
        );

      case 'review':
        return (
          <div className="review-step">
            <h3>Review & Reflect</h3>
            <p>What did you learn from this step?</p>
            <button onClick={() => setPlayState('scene')}>
              Continue to Next Step
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="journey-loading">
        <div className="loading-spinner"></div>
        <p>Loading your journey...</p>
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="journey-error">
        <h3>Journey not found</h3>
        <button onClick={onExit}>Return to Journeys</button>
      </div>
    );
  }

  return (
    <div className="journey-play-view">
      {/* Header with progress and controls */}
      <div className="journey-header">
        <div className="journey-info">
          <h2>{journey.title}</h2>
          <p>{journey.description}</p>
        </div>

        <ProgressTracker
          journey={journey}
          currentStepIndex={currentStepIndex}
          totalSteps={journey.steps.length}
        />

        <div className="journey-controls">
          <AudioControls />
          <button
            className="tutor-button"
            onClick={() => setShowTutor(!showTutor)}
          >
            💬 {showTutor ? 'Hide' : 'Ask'} Tutor
          </button>
          <button className="exit-button" onClick={onExit}>
            Exit Journey
          </button>
        </div>
      </div>

      {/* Hint System */}
      <HintSystem journey={journey} currentStep={currentStep!} />

      {/* Main Content */}
      <div className="journey-content">
        {renderCurrentStep()}
      </div>

      {/* Spaced Practice Queue */}
      <SpacedPracticeQueue userId={user!.uid} />

      {/* Private Tutor Pane */}
      <PrivateTutorPane
        isVisible={showTutor}
        onToggleVisibility={() => setShowTutor(!showTutor)}
        dockedPosition="bottom"
        materialId={journey.sourceMaterialId}
        currentTopic={currentStep?.title}
      />

      <style jsx>{`
        .journey-play-view {
          min-height: 100vh;
          background: #f8fafc;
          display: flex;
          flex-direction: column;
        }

        .journey-loading, .journey-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 50vh;
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

        .journey-header {
          background: white;
          border-bottom: 1px solid #e5e7eb;
          padding: 16px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }

        .journey-info h2 {
          margin: 0 0 4px 0;
          color: #1f2937;
          font-size: 1.5rem;
        }

        .journey-info p {
          margin: 0;
          color: #6b7280;
          font-size: 0.9rem;
        }

        .journey-controls {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .tutor-button, .exit-button {
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
        }

        .tutor-button {
          background: #3b82f6;
          color: white;
        }

        .tutor-button:hover {
          background: #2563eb;
        }

        .exit-button {
          background: #ef4444;
          color: white;
        }

        .exit-button:hover {
          background: #dc2626;
        }

        .journey-content {
          flex: 1;
          padding: 24px;
          max-width: 800px;
          margin: 0 auto;
          width: 100%;
        }

        .review-step {
          background: white;
          border-radius: 12px;
          padding: 32px;
          text-align: center;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .review-step h3 {
          color: #1f2937;
          margin-bottom: 16px;
        }

        .review-step button {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .journey-header {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
          }

          .journey-controls {
            justify-content: center;
          }

          .journey-content {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default JourneyPlayView;
