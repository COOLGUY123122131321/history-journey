import React, { useState, useEffect } from 'react';
// FIX: Import User type.
import { MatchingQuestion as MqType, MatchingItem, User } from '../../../types';
import { getHint } from '../../../services/geminiService';
import { ttsService } from '../../../services/ttsService';
import { soundService } from '../../../services/soundService';
import AITutor from '../../shared/ChickTutor';
import AudioControls from '../../shared/AudioControls';
import { stopAudio } from '../../../services/audioService';

const LoadingSpinner = () => (
    <svg className="animate-spin h-6 w-6 text-yellow-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

interface MqProps {
  question: MqType;
  onAnswer: (isCorrect: boolean) => void;
  onContinue: () => void;
  // FIX: Add user prop to the interface.
  user: User;
}

const MatchingQuestion: React.FC<MqProps> = ({ question, onAnswer, onContinue, user }) => {
    const [matches, setMatches] = useState<{ [key: string]: string | null }>({});
    const [selectedPrompt, setSelectedPrompt] = useState<MatchingItem | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [hint, setHint] = useState<string | null>(null);
    const [hintAudio, setHintAudio] = useState<string | null>(null);
    const [isHintLoading, setIsHintLoading] = useState(false);
    const [questionAudio, setQuestionAudio] = useState<string | null>(null);

    useEffect(() => {
        const getAudio = async () => {
            // FIX: Pass user.uid to ttsService.
            const data = await ttsService.requestTts(question.questionText, user.uid);
            setQuestionAudio(data);
        };
        getAudio();

        return () => {
            stopAudio();
        };
    }, [question.questionText, user.uid]);

    const prompts = question.prompts || [];
    const answers = question.answers || [];

    const handlePromptSelect = (prompt: MatchingItem) => {
        if (submitted) return;
        soundService.playUIClick();
        setSelectedPrompt(prompt);
    };

    const handleAnswerSelect = (answer: MatchingItem) => {
        if (submitted || !selectedPrompt) return;
        soundService.playUIClick();
        setMatches(prev => ({ ...prev, [selectedPrompt.id]: answer.id }));
        setSelectedPrompt(null);
    };

    const handleSubmit = () => {
        let correctCount = 0;
        (question.correctPairs || []).forEach(pair => {
            if (matches[pair.promptId] === pair.answerId) {
                correctCount++;
            }
        });
        const correct = correctCount === (question.correctPairs || []).length;
        setIsCorrect(correct);
        setSubmitted(true);
        onAnswer(correct);
    };

    const handleGetHint = async () => {
        soundService.playUIClick();
        setIsHintLoading(true);
        setHint(null);
        setHintAudio(null);
        // FIX: Pass user.uid to getHint.
        const hintText = await getHint(question, user.uid);
        setHint(hintText);
        // FIX: Pass user.uid to ttsService.
        const audio = await ttsService.requestTts(hintText, user.uid);
        setHintAudio(audio);
        setIsHintLoading(false);
    };

    const allMatched = Object.keys(matches).length === prompts.length && prompts.length > 0;

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold flex-grow pr-4">{question.questionText}</h3>
                <AudioControls audioData={questionAudio} />
            </div>
            <div className="flex flex-col md:flex-row gap-4 justify-between">
                {/* Prompts Column */}
                <div className="flex-1 space-y-2">
                    {prompts.map(prompt => (
                        <div key={prompt.id} className="flex items-center gap-2">
                            <button
                                onClick={() => handlePromptSelect(prompt)}
                                disabled={submitted || !!matches[prompt.id]}
                                className={`p-3 rounded-lg border-2 w-full text-left transition ${selectedPrompt?.id === prompt.id ? 'bg-brand-orange text-white' : 'bg-white'} ${matches[prompt.id] ? 'bg-gray-200' : ''}`}
                            >
                                {prompt.text}
                            </button>
                            <span>→</span>
                        </div>
                    ))}
                </div>
                {/* Answers Column */}
                <div className="flex-1 space-y-2">
                    {answers.map(answer => {
                        const matchedPromptId = Object.keys(matches).find(pId => matches[pId] === answer.id);
                        const isMatched = !!matchedPromptId;

                        return (
                            <button
                                key={answer.id}
                                onClick={() => handleAnswerSelect(answer)}
                                disabled={submitted || isMatched || !selectedPrompt}
                                className={`p-3 rounded-lg border-2 w-full text-left transition ${isMatched ? 'bg-gray-200' : 'bg-white hover:bg-gray-100'} disabled:cursor-not-allowed`}
                            >
                                {isMatched ? prompts.find(p => p.id === matchedPromptId)?.text : answer.text}
                            </button>
                        );
                    })}
                </div>
            </div>
            
            {hint && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-start justify-between gap-2">
                        <AITutor message={hint} mood="neutral" size="small"/>
                        <AudioControls audioData={hintAudio} />
                    </div>
                </div>
            )}

            {!submitted ? (
                 <div className="flex items-center gap-4 mt-6">
                    <button
                        onClick={handleSubmit}
                        disabled={!allMatched}
                        className="flex-grow bg-brand-blue text-white font-bold py-3 rounded-lg disabled:bg-gray-400 hover:bg-blue-700 transition"
                    >
                        Submit
                    </button>
                    <button
                        onClick={handleGetHint}
                        disabled={isHintLoading || !!hint}
                        className="flex-shrink-0 bg-brand-yellow text-yellow-800 font-bold rounded-lg disabled:bg-gray-400 hover:bg-yellow-500 transition w-12 h-12 flex items-center justify-center text-2xl"
                        title="Ask for a hint"
                    >
                        {isHintLoading ? <LoadingSpinner /> : '🦉'}
                    </button>
                </div>
            ) : (
                <>
                    <div className={`mt-4 p-4 rounded-lg text-white ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
                        <p className="font-bold">{isCorrect ? "Correct!" : "Not quite."}</p>
                        <p>{question.explanation}</p>
                    </div>
                    <button
                        onClick={onContinue}
                        className="mt-4 w-full bg-brand-primary text-white font-bold py-3 rounded-lg hover:bg-opacity-80 transition"
                    >
                        Continue
                    </button>
                </>
            )}
        </div>
    );
};

export default MatchingQuestion;