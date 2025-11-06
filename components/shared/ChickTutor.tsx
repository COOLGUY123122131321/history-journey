import React from 'react';
import { TutorMood } from '../../types';

interface AITutorProps {
  message: string;
  size?: 'small' | 'large';
  mood?: TutorMood;
  hidePrefix?: boolean;
}

const moodEmojis: Record<TutorMood, string> = {
    happy: '😄',
    sad: '😟',
    neutral: '🤔',
    wise: '🦉',
};

const moodAnimations: Record<TutorMood, string> = {
    happy: 'animate-bounce',
    sad: 'animate-pulse',
    neutral: 'animate-pulse',
    wise: 'animate-chick-wise',
};

const AITutor: React.FC<AITutorProps> = ({ message, size = 'large', mood = 'neutral', hidePrefix = false }) => {
    const tutorSize = size === 'small' ? 'text-4xl' : 'text-6xl';
    const textSize = size === 'small' ? 'text-sm' : 'text-md';
  return (
    <div className="flex items-center gap-4">
        <div className={`${tutorSize} ${moodAnimations[mood]}`}>{moodEmojis[mood]}</div>
        <div className={`bg-white p-3 rounded-lg shadow-sm relative ${textSize} flex-1`}>
            <div className="absolute left-0 top-1/2 -translate-x-2 w-4 h-4 bg-white transform rotate-45"></div>
            <p className="text-brand-text font-semibold italic">
                {hidePrefix ? message : `"As Professor Spark would say: ${message}"`}
            </p>
        </div>
    </div>
  );
};

export default AITutor;
