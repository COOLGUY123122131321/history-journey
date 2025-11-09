import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProgressProvider, useProgress } from './context/ProgressContext';
import { SettingsProvider } from './context/SettingsContext';
import { AppNavigationProvider } from './context/AppNavigationContext';
import LoginView from './components/auth/LoginView';
import JourneySelectionView from './components/topic/TopicSelectionView'; // Re-using file path
import GameView from './components/lesson/LessonView'; // Re-using file path
import TabNavigation from './components/shared/TabNavigation';
import QuickActionsBar from './components/shared/QuickActionsBar';
import TabContent from './components/shared/TabContent';
import PrivateTutorPane from './components/shared/PrivateTutorPane';
import './index.css';
import VideoLoader from './components/shared/VideoLoader';
import VideoPlayerView from './components/shared/VideoPlayerView';
import { useState } from 'react';


const AppContent: React.FC = () => {
    const { user } = useAuth();
    const {
        gameState,
        isVideoGenerating,
        generatedVideoUrl,
        journeyForVideo,
        skipVideoAndStartJourney,
    } = useProgress();
    const [tutorVisible, setTutorVisible] = useState(false);

    if (!user) {
        return <LoginView />;
    }

    // Video generation flow takes precedence over main app
    if (isVideoGenerating) {
        return <VideoLoader />;
    }

    if (generatedVideoUrl && journeyForVideo) {
        return <VideoPlayerView videoUrl={generatedVideoUrl} onContinue={skipVideoAndStartJourney} />;
    }

    // If game is active, show game view (full screen overlay)
    if (gameState.currentJourneyId) {
        return <GameView />;
    }

    // Main tabbed interface
    return (
        <div className="app-container">
            <QuickActionsBar onTutorToggle={() => setTutorVisible(!tutorVisible)} />
            <TabNavigation />
            <TabContent />
            <PrivateTutorPane
                isVisible={tutorVisible}
                onToggleVisibility={() => setTutorVisible(!tutorVisible)}
                dockedPosition="right"
            />
        </div>
    );
};


const App: React.FC = () => {
  return (
    <AuthProvider>
        <SettingsProvider>
            <AppNavigationProvider>
                <ProgressProvider>
                    <AppContent />
                </ProgressProvider>
            </AppNavigationProvider>
        </SettingsProvider>
    </AuthProvider>
  );
};

export default App;