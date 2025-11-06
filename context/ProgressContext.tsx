import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { Progress, GameState, Resources, Scene, Journey } from '../types';
import { INITIAL_RESOURCES } from '../constants';
import { generateJourneyIntroVideo } from '../services/geminiService';
import { useAuth } from './AuthContext';

interface ProgressContextType {
  progress: Progress;
  gameState: GameState;
  startNewJourney: (journeyId: string) => void;
  updateGameState: (updates: Partial<GameState>) => void;
  applyResourceChanges: (changes: Partial<Resources>) => void;
  endJourney: () => void;
  resetProgress: () => void;
  // Video generation state and functions
  isVideoGenerating: boolean;
  generatedVideoUrl: string | null;
  videoGenerationError: string | null;
  journeyForVideo: Journey | null;
  generateAndStartJourney: (journey: Journey) => void;
  skipVideoAndStartJourney: () => void;
  clearVideoState: () => void;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

const initialProgress: Progress = {
    xp: 0,
    level: 1,
    journeys: {},
};

const initialGameState: GameState = {
    currentJourneyId: null,
    currentScene: null,
    resources: INITIAL_RESOURCES,
    isGameOver: false,
    gameOverReason: '',
};

export const ProgressProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<Progress>(initialProgress);
  const [gameState, setGameState] = useState<GameState>(initialGameState);

  // State for video generation flow
  const [isVideoGenerating, setIsVideoGenerating] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [videoGenerationError, setVideoGenerationError] = useState<string | null>(null);
  const [journeyForVideo, setJourneyForVideo] = useState<Journey | null>(null);

  const startNewJourney = useCallback((journeyId: string) => {
    setGameState({
        currentJourneyId: journeyId,
        currentScene: null, // This will be set by the GameView after fetching
        resources: INITIAL_RESOURCES,
        isGameOver: false,
        gameOverReason: '',
    });
  }, []);

  const generateAndStartJourney = useCallback(async (journey: Journey) => {
    if (!user) {
        setVideoGenerationError("You must be logged in to generate a video intro.");
        return;
    }
    setJourneyForVideo(journey);
    setIsVideoGenerating(true);
    setGeneratedVideoUrl(null);
    setVideoGenerationError(null);

    try {
        const videoUrl = await generateJourneyIntroVideo(journey, user.uid);
        setGeneratedVideoUrl(videoUrl);
    } catch (error: any) {
        console.error("Failed to generate video intro:", error);
        const errorMessage = error?.message || error?.toString() || '';
        
        if (errorMessage === 'API_KEY_INVALID' || errorMessage.includes('API key not valid')) {
            setVideoGenerationError("Your API key appears to be invalid or missing permissions. Please check your GEMINI_API_KEY in .env.local and try again.");
        } else if (errorMessage.includes('CORS') || errorMessage.includes('Storage upload failed')) {
            setVideoGenerationError("Video generation succeeded, but storage upload failed due to CORS configuration. This is normal when running locally. You can start the journey without the video intro.");
        } else {
            setVideoGenerationError("We couldn't create your cinematic intro at this time. Please try again or start the journey directly.");
        }
    } finally {
        setIsVideoGenerating(false);
    }
  }, [user]);
  
  const skipVideoAndStartJourney = useCallback(() => {
    if (journeyForVideo) {
        startNewJourney(journeyForVideo.id);
    }
    // Reset video state
    setJourneyForVideo(null);
    setIsVideoGenerating(false);
    setGeneratedVideoUrl(null);
    setVideoGenerationError(null);
  }, [journeyForVideo, startNewJourney]);

  const clearVideoState = useCallback(() => {
      setVideoGenerationError(null);
      setJourneyForVideo(null);
      setIsVideoGenerating(false);
      setGeneratedVideoUrl(null);
  }, []);
  
  const updateGameState = useCallback((updates: Partial<GameState>) => {
    setGameState(prev => ({ ...prev, ...updates }));
  }, []);

  const applyResourceChanges = useCallback((changes: Partial<Resources>) => {
      setGameState(prev => {
          const newResources = { ...prev.resources };
          for (const key in changes) {
              const resource = key as keyof Resources;
              const currentValue = newResources[resource] || 0;
              const changeValue = changes[resource] || 0;
              // Cap resources at 100, with a floor of 0
              newResources[resource] = Math.max(0, Math.min(100, currentValue + changeValue));
          }
          return { ...prev, resources: newResources };
      });
      // Add XP for making a choice
      setProgress(prev => {
        const newXp = prev.xp + 25;
        const newLevel = Math.floor(newXp / 100) + 1;
        return {...prev, xp: newXp, level: newLevel };
      });
  }, []);

  const endJourney = useCallback(() => {
    if(gameState.currentJourneyId) {
        setProgress(prev => ({
            ...prev,
            journeys: {
                ...prev.journeys,
                [gameState.currentJourneyId!]: {
                    completed: true,
                }
            }
        }));
    }
    setGameState(initialGameState);
  }, [gameState.currentJourneyId]);

  const resetProgress = useCallback(() => {
    setProgress(initialProgress);
    setGameState(initialGameState);
  }, []);

  return (
    <ProgressContext.Provider value={{ 
        progress, 
        gameState, 
        startNewJourney, 
        updateGameState, 
        applyResourceChanges, 
        endJourney, 
        resetProgress,
        isVideoGenerating,
        generatedVideoUrl,
        videoGenerationError,
        journeyForVideo,
        generateAndStartJourney,
        skipVideoAndStartJourney,
        clearVideoState,
    }}>
      {children}
    </ProgressContext.Provider>
  );
};

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};