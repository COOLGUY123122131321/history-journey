
import React, { useState, useEffect } from 'react';
import { useProgress } from '../../context/ProgressContext';
import { startJourney, advanceStory } from '../../services/geminiService';
import { JOURNEYS } from '../../constants';
import { Choice, Outcome, Question, User } from '../../types';
import Loader from '../shared/Loader';
import Header from '../shared/Header';
import AITutor from '../shared/ChickTutor';
import { soundService } from '../../services/soundService';
import { ttsService } from '../../services/ttsService';
import { stopAudio } from '../../services/audioService';
import AudioControls from '../shared/AudioControls';
import QuestionRenderer from './QuestionRenderer';
import { useAuth } from '../../context/AuthContext';

type GameView = 'scene' | 'outcome' | 'question' | 'gameover';

const GameView: React.FC = () => {
    const { user } = useAuth();
    const { gameState, updateGameState, applyResourceChanges, endJourney } = useProgress();
    const [isLoading, setIsLoading] = useState(true);
    const [isChoosing, setIsChoosing] = useState(false);
    const [outcome, setOutcome] = useState<Outcome | null>(null);
    const [view, setView] = useState<GameView>('scene');
    const [isWelcomeVisible, setIsWelcomeVisible] = useState(false);

    const [scenarioAudio, setScenarioAudio] = useState<string | null>(null);
    const [outcomeAudio, setOutcomeAudio] = useState<string | null>(null);
    const [mentorAudio, setMentorAudio] = useState<string | null>(null);
    const [gameOverAudio, setGameOverAudio] = useState<string | null>(null);
    const [welcomeAudio, setWelcomeAudio] = useState<string | null>(null);

    const journey = JOURNEYS.find(j => j.id === gameState.currentJourneyId);

    // Stop audio when the component unmounts
    useEffect(() => {
        return () => {
            stopAudio();
        };
    }, []);
    
    // Fetch audio for the welcome message when it becomes visible
    useEffect(() => {
        if (isWelcomeVisible && journey && user) {
            const welcomeMessage = `Welcome, traveler, to "${journey.name}"! I am Professor Spark. I'll be your guide on this adventure. Let's make history!`;
            ttsService.requestTts(welcomeMessage, user.uid).then(setWelcomeAudio);
        }
    }, [isWelcomeVisible, journey, user]);


    // Fetch audio for the current scene's scenario text
    useEffect(() => {
        const fetchAudio = async () => {
            if (gameState.currentScene?.scenario && user) {
                setScenarioAudio(null);
                const audio = await ttsService.requestTts(gameState.currentScene.scenario, user.uid);
                setScenarioAudio(audio);
            }
        };
        if (view === 'scene') {
            fetchAudio();
        }
    }, [gameState.currentScene?.scenario, view, user]);


    useEffect(() => {
        if (!journey || !user) {
            endJourney();
            return;
        }
        if (gameState.currentScene) {
            setIsLoading(false);
            return;
        }
        
        const fetchFirstScene = async () => {
            try {
                const firstScene = await startJourney(journey, user.uid);
                updateGameState({ currentScene: firstScene });
                setIsWelcomeVisible(true);
            } catch(e) {
                console.error("Failed to start journey:", e);
                endJourney();
            } finally {
                setIsLoading(false);
            }
        };
        fetchFirstScene();
    }, [journey, gameState.currentScene, updateGameState, endJourney, user]);

    const handleChoice = async (choice: Choice) => {
        if (!journey || !gameState.currentScene || isChoosing || !user) return;
        
        stopAudio();
        soundService.playUIClick();
        setIsChoosing(true);
        setOutcomeAudio(null);
        setMentorAudio(null);
        setGameOverAudio(null);
        try {
            const result = await advanceStory(journey.name, gameState.currentScene, choice, gameState.resources, user.uid);
            
            applyResourceChanges(result.resourceChanges);
            setOutcome(result);

            ttsService.requestTts(result.outcomeText, user.uid).then(setOutcomeAudio);
            ttsService.requestTts(result.mentorInsight, user.uid).then(setMentorAudio);

            if (result.isGameOver || gameState.resources.health <= 0) {
                const reason = result.isGameOver ? result.gameOverReason : "Your health reached zero, your journey ends here.";
                updateGameState({ isGameOver: true, gameOverReason: reason });
                if (reason) {
                    ttsService.requestTts(reason, user.uid).then(setGameOverAudio);
                }
                setView('gameover');
            } else {
                setView('outcome');
            }
        } catch (e) {
            console.error("Failed to advance story:", e);
        } finally {
            setIsChoosing(false);
        }
    };

    const handleProceedToQuestion = () => {
        stopAudio();
        soundService.playUIClick();
        setView('question');
    };
    
    const handleQuestionAnswered = (isCorrect: boolean) => {
        if (!isCorrect) {
            applyResourceChanges({ health: -20, food: -5, money: -5, influence: -5 });
        }
    };

    const handleProceedToNextScene = () => {
        if (!outcome) return;
        stopAudio();
        soundService.playUIClick();
        updateGameState({ currentScene: outcome.nextScene });
        setOutcome(null);
        setView('scene');
    };
    
    const handleEndJourney = () => {
        stopAudio();
        endJourney();
    };

    if (isLoading) {
        return <div className="min-h-screen bg-brand-bg flex items-center justify-center"><Loader message="Your journey is about to begin..." /></div>;
    }
    
    if (!journey || !gameState.currentScene || !user) {
        return <div className="min-h-screen bg-brand-bg flex items-center justify-center">Something went wrong. Please refresh.</div>;
    }
    
    const welcomeMessage = `Welcome, traveler, to "${journey.name}"! I am Professor Spark. I'll be your guide on this adventure. Let's make history!`;

    return (
        <div className="min-h-screen bg-brand-bg p-4 sm:p-6 font-sans">
            <Header onEndJourney={handleEndJourney}/>
            
            {isWelcomeVisible && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in-up">
                    <div className="bg-brand-bg p-8 rounded-lg shadow-xl max-w-lg m-4 border-2 border-brand-frame-highlight">
                        <AITutor 
                            message={welcomeMessage}
                            mood="happy" 
                            size="large" 
                            hidePrefix 
                        />
                        <div className="flex items-center justify-between mt-6">
                             <AudioControls audioData={welcomeAudio} />
                            <button onClick={() => {
                                stopAudio();
                                soundService.playUIClick();
                                setIsWelcomeVisible(false);
                            }} className="bg-brand-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-opacity-80 transition">
                                Begin!
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <main className={`max-w-3xl mx-auto mt-6 transition-filter duration-300 ${isWelcomeVisible ? 'blur-sm pointer-events-none' : ''}`}>
                {view !== 'gameover' ? (
                    <div className="bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-lg shadow-md border border-brand-accent">
                        {view === 'scene' && (
                            <>
                                <div className="flex justify-between items-start gap-4 mb-8">
                                    <p className="text-lg text-brand-text leading-relaxed whitespace-pre-line flex-grow">{gameState.currentScene.scenario}</p>
                                    <div className="flex-shrink-0">
                                        <AudioControls audioData={scenarioAudio} />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {gameState.currentScene.choices.map((choice, index) => (
                                        <button key={index} onClick={() => handleChoice(choice)} disabled={isChoosing} className="w-full text-left p-4 rounded-lg border-2 border-brand-secondary bg-brand-bg text-brand-primary font-bold hover:bg-brand-accent transition disabled:opacity-50 disabled:cursor-wait">
                                            {choice.text}
                                        </button>
                                    ))}
                                </div>
                                {isChoosing && <Loader message="History is being written..." />}
                            </>
                        )}

                        {view === 'outcome' && outcome && (
                            <div className="animate-fade-in-up">
                                <div className="flex justify-between items-start gap-4 mb-6">
                                    <p className="text-lg text-brand-text leading-relaxed italic border-l-4 border-brand-accent pl-4 flex-grow">{outcome.outcomeText}</p>
                                    <div className="flex-shrink-0">
                                        <AudioControls audioData={outcomeAudio} />
                                    </div>
                                </div>

                                <div className="bg-brand-bg p-4 rounded-lg mb-8">
                                <div className="flex items-center justify-between gap-4">
                                        <div className="flex-grow">
                                            <AITutor message={outcome.mentorInsight} mood="wise" size="large" />
                                        </div>
                                        <div className="flex-shrink-0">
                                            <AudioControls audioData={mentorAudio} />
                                        </div>
                                </div>
                                </div>
                                <button onClick={handleProceedToQuestion} className="w-full bg-brand-primary text-white font-bold py-3 rounded-lg hover:bg-opacity-80 transition">
                                    Continue
                                </button>
                            </div>
                        )}
                        
                        {view === 'question' && outcome?.question && (
                            <div className="animate-fade-in-up">
                                <QuestionRenderer 
                                    question={outcome.question}
                                    onAnswer={handleQuestionAnswered}
                                    onContinue={handleProceedToNextScene}
                                    user={user}
                                />
                            </div>
                        )}
                    </div>
                 ) : (
                    <div className="animate-fade-in-up text-center flex flex-col items-center">
                        <div className="bg-brand-bg p-8 rounded-lg shadow-2xl border-4 border-brand-frame max-w-2xl w-full animate-parchment-unroll origin-top overflow-hidden" style={{'--tw-shadow-color': '#433A3F55'} as React.CSSProperties}>
                            <h2 className="text-4xl sm:text-5xl font-cinzel text-brand-primary mb-4 border-b-2 border-brand-accent pb-4">The End of Your Tale</h2>
                            <div className="flex justify-center items-start gap-4 my-6">
                                <p className="text-lg text-brand-text leading-relaxed italic text-left flex-grow">{gameState.gameOverReason}</p>
                                <div className="flex-shrink-0">
                                    <AudioControls audioData={gameOverAudio} />
                                </div>
                            </div>

                            <div className="bg-brand-accent/30 p-4 rounded-md mb-6 border border-brand-accent/50">
                                <h4 className="font-bold text-brand-primary text-xl mb-3">Final Status</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center font-sans">
                                    <div className="flex flex-col items-center"><span className="text-3xl">❤️</span><span className="font-bold text-lg">{gameState.resources.health}</span></div>
                                    <div className="flex flex-col items-center"><span className="text-3xl">🍞</span><span className="font-bold text-lg">{gameState.resources.food}</span></div>
                                    <div className="flex flex-col items-center"><span className="text-3xl">💰</span><span className="font-bold text-lg">{gameState.resources.money}</span></div>
                                    <div className="flex flex-col items-center"><span className="text-3xl">👥</span><span className="font-bold text-lg">{gameState.resources.influence}</span></div>
                                </div>
                            </div>
                            
                            <div className="bg-brand-bg p-4 rounded-lg mb-8">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-grow">
                                        <AITutor message={outcome?.mentorInsight || "Every story has an end, but history offers endless lessons."} mood="wise" size="large" />
                                    </div>
                                    <div className="flex-shrink-0">
                                        <AudioControls audioData={mentorAudio} />
                                    </div>
                                </div>
                            </div>
                            <button onClick={handleEndJourney} className="w-full bg-brand-secondary text-white font-bold py-3 rounded-lg hover:bg-opacity-80 transition">
                                Return to Journeys
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default GameView;