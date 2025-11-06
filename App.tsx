import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProgressProvider, useProgress } from './context/ProgressContext';
import { SettingsProvider } from './context/SettingsContext';
import LoginView from './components/auth/LoginView';
import JourneySelectionView from './components/topic/TopicSelectionView'; // Re-using file path
import GameView from './components/lesson/LessonView'; // Re-using file path
import './index.css';
import VideoLoader from './components/shared/VideoLoader';
import VideoPlayerView from './components/shared/VideoPlayerView';


const AppContent: React.FC = () => {
    const { user } = useAuth();
    const { 
        gameState, 
        startNewJourney, 
        isVideoGenerating, 
        generatedVideoUrl, 
        videoGenerationError, 
        journeyForVideo,
        generateAndStartJourney,
        skipVideoAndStartJourney,
        clearVideoState,
    } = useProgress();

    if (!user) {
        return <LoginView />;
    }

    // Video generation flow takes precedence over main game state
    if (isVideoGenerating) {
        return <VideoLoader />;
    }
    
    if (generatedVideoUrl && journeyForVideo) {
        return <VideoPlayerView videoUrl={generatedVideoUrl} onContinue={skipVideoAndStartJourney} />;
    }

    // If game is active, show game view
    if (gameState.currentJourneyId) {
        return <GameView />;
    }
    
    // Default view: Journey Selection, which can now also handle video generation errors
    return (
        <JourneySelectionView 
            onJourneySelect={generateAndStartJourney} 
            onDirectStart={startNewJourney}
            error={videoGenerationError}
            journeyWithError={journeyForVideo}
            clearError={clearVideoState}
        />
    );
};


const App: React.FC = () => {
  return (
    <AuthProvider>
        <SettingsProvider>
            <ProgressProvider>
                <AppContent />
            </ProgressProvider>
        </SettingsProvider>
    </AuthProvider>
  );
};

export default App;