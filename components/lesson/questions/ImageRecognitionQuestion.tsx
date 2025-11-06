import React, { useState, useEffect } from 'react';
// FIX: Import User type.
import { ImageRecognitionQuestion as IrqType, User } from '../../../types';
import Loader from '../../shared/Loader';
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

interface IrqProps {
  question: IrqType;
  onAnswer: (isCorrect: boolean) => void;
  onContinue: () => void;
  // FIX: Add user prop to the interface.
  user: User;
}

const ImageRecognitionQuestion: React.FC<IrqProps> = ({ question, onAnswer, onContinue, user }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
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
  
  const handleSelectOption = (option: string) => {
    if (submitted) return;
    soundService.playUIClick();
    setSelectedOption(option);
  };
  
  const handleSubmit = () => {
    if (selectedOption === null) return;
    const correct = selectedOption === question.correctAnswer;
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

  const getButtonClass = (option: string) => {
    if (!submitted) {
        return selectedOption === option ? 'bg-brand-orange text-white' : 'bg-white hover:bg-gray-100';
    }
    if (option === question.correctAnswer) {
        return 'bg-green-500 text-white';
    }
    if (option === selectedOption && option !== question.correctAnswer) {
        return 'bg-red-500 text-white';
    }
    return 'bg-gray-200 text-gray-500';
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      {question.imageUrl ? (
        <img src={question.imageUrl} alt={question.imagePrompt} className="w-full h-64 object-contain rounded-lg mb-4 bg-gray-100" />
      ) : (
        <div className="w-full h-64 flex items-center justify-center bg-gray-100 rounded-lg mb-4">
            <Loader message="Loading image..." />
        </div>
      )}
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold flex-grow pr-4">{question.questionText}</h3>
        <AudioControls audioData={questionAudio} />
      </div>
      <div className="space-y-3">
        {(question.options || []).map((option) => (
          <button
            key={option}
            onClick={() => handleSelectOption(option)}
            disabled={submitted}
            className={`w-full text-left p-4 rounded-lg border-2 transition ${getButtonClass(option)}`}
          >
            {option}
          </button>
        ))}
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
            disabled={selectedOption === null}
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

export default ImageRecognitionQuestion;