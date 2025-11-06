import React, { useState } from 'react';
import { JOURNEYS } from '../../constants';
import { Journey } from '../../types';
import { soundService } from '../../services/soundService';
import { useAuth } from '../../context/AuthContext';
import { useProgress } from '../../context/ProgressContext';
import OnboardingGuide from '../shared/OnboardingGuide';

interface ApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in-up" style={{ animationDuration: '0.3s' }}>
            <div className="bg-brand-dark-bg p-8 rounded-lg shadow-xl max-w-md w-full border border-brand-frame m-4">
                <h3 className="text-2xl font-cinzel text-brand-gold mb-4">API Key Required</h3>
                <p className="text-gray-300 mb-6">
                    To generate cinematic video intros for your journey, this feature requires a Gemini API key with billing enabled.
                </p>
                <p className="text-gray-400 text-sm mb-6">
                    This is an experimental feature and may incur costs. Please review the{' '}
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-brand-gold underline hover:text-white">
                        billing documentation
                    </a> for details.
                </p>
                <div className="flex justify-end gap-4">
                    <button onClick={onClose} className="text-gray-300 hover:text-white transition px-4 py-2 rounded-md">Cancel</button>
                    <button onClick={onConfirm} className="bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-80 transition">
                        Select API Key
                    </button>
                </div>
            </div>
        </div>
    );
};


interface JourneySelectionViewProps {
  onJourneySelect: (journey: Journey) => void;
  onDirectStart: (journeyId: string) => void;
  error?: string | null;
  journeyWithError?: Journey | null;
  clearError: () => void;
}

const JourneySelectionView: React.FC<JourneySelectionViewProps> = ({ onJourneySelect, onDirectStart, error, journeyWithError, clearError }) => {
  const { user, logout, isFirstTimeUser, dismissGuide } = useAuth();
  const { progress } = useProgress();
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);

  const handleSelectAttempt = async (journey: Journey) => {
    soundService.playUIClick();
    if(error) clearError();
    setSelectedJourney(journey);
    
    // Check if AI Studio API is available (running in AI Studio)
    if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        setIsKeyModalOpen(true);
        return;
      }
    } else {
      // Running locally - check for environment variable
      // If no API key is set, we'll still proceed and let geminiService handle the error
      // This allows the app to work locally when GEMINI_API_KEY is set in .env.local
    }
    
    onJourneySelect(journey);
  };

  const handleConfirmKeySelection = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
    }
    setIsKeyModalOpen(false);
    // Assume success and proceed. The geminiService will handle API errors.
    if (selectedJourney) {
        onJourneySelect(selectedJourney);
    }
  };

  const ErrorBanner = () => {
    if (!error || !journeyWithError) return null;
    return (
        <div className="w-full max-w-5xl bg-red-900/50 border border-red-600 text-red-200 px-4 py-3 rounded-lg relative my-4 flex justify-between items-center animate-fade-in-up">
            <span>{error}</span>
            <div className="flex gap-4">
                <button onClick={() => handleSelectAttempt(journeyWithError)} className="underline font-bold hover:text-white">Try Again</button>
                <button onClick={() => onDirectStart(journeyWithError.id)} className="bg-red-200 text-red-900 font-bold px-3 py-1 rounded-md hover:bg-white">Start without Video</button>
            </div>
        </div>
    );
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-brand-dark-bg p-4">
      {isFirstTimeUser && <OnboardingGuide onClose={dismissGuide} />}
      <ApiKeyModal isOpen={isKeyModalOpen} onClose={() => setIsKeyModalOpen(false)} onConfirm={handleConfirmKeySelection} />
      <header className="w-full max-w-5xl flex justify-between items-center p-4 bg-black/20 backdrop-blur-sm rounded-xl shadow-md my-4 border border-brand-frame">
        <div className="flex items-center gap-4">
          <img src={user?.photoURL} alt={user?.displayName} className="w-12 h-12 rounded-full" />
          <div>
            <h2 className="font-bold text-lg text-gray-200">{user?.displayName}</h2>
            <p className="text-sm text-gray-400">Level {progress.level}</p>
          </div>
        </div>
        <button onClick={logout} className="bg-brand-secondary text-white px-4 py-2 rounded-lg font-bold hover:bg-opacity-80 transition">
          Log Out
        </button>
      </header>
      <ErrorBanner />
      <div className="text-center p-8 max-w-6xl w-full">
        <h1 className="text-5xl font-bold font-cinzel text-brand-gold tracking-wider">Choose Your Journey</h1>
        <p className="text-gray-400 mt-2 italic text-lg">"Where will history remember your name?"</p>
        <div className="relative w-1/2 h-0.5 mx-auto mt-4 mb-2 bg-brand-gold/20 overflow-hidden">
            <div className="absolute h-full w-1/4 bg-brand-gold animate-sparkle rounded-full"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
          {JOURNEYS.map((journey, index) => (
            <div
              key={journey.id}
              className="p-1.5 rounded-2xl transition-all duration-300 group opacity-0 animate-fade-in-up bg-gradient-to-br from-brand-frame to-brand-frame/60 hover:shadow-[0_0_25px_#a17c5b44] hover:!from-brand-frame-highlight hover:!to-brand-frame"
              style={{ animationDelay: `${index * 150}ms` }}
            >
                <button
                    onClick={() => handleSelectAttempt(journey)}
                    className="relative aspect-[4/5] rounded-xl text-white font-bold w-full overflow-hidden shadow-lg"
                >
                    {progress.journeys[journey.id]?.completed && (
                        <div className="absolute top-3 -right-11 z-10">
                            <div className="bg-brand-gold text-brand-dark-bg font-bold py-1 px-12 transform rotate-45 text-xs shadow-md">
                                COMPLETED
                            </div>
                        </div>
                    )}
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-in-out group-hover:scale-110"
                        style={{ backgroundImage: `url(${journey.cardImage})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent transition-all duration-300 group-hover:from-black/80 group-hover:bg-black/30"></div>
                    <div className="absolute inset-0 flex flex-col items-center justify-end p-6 text-center">
                        <div className="transition-transform duration-500 ease-in-out group-hover:scale-105">
                            <h3 className="font-cinzel text-3xl mb-2 tracking-wide">{journey.name}</h3>
                            <p className="text-sm font-sans font-normal text-gray-300 italic">
                            “{journey.description}”
                            </p>
                        </div>
                    </div>
                </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default JourneySelectionView;