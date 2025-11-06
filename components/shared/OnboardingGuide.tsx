import React, { useState } from 'react';
import { soundService } from '../../services/soundService';

const guideSteps = [
  { icon: '📜', title: 'Welcome to History Journey!', text: 'Embark on an interactive adventure through time. Your choices will shape your destiny.' },
  { icon: '🗺️', title: 'Choose Your Path', text: 'Select a historical era to begin. Each journey is a unique story waiting to be told.' },
  { icon: '🤔', title: 'Your Choices Matter', text: 'You\'ll face difficult decisions. Each choice impacts your story and your resources.' },
  { icon: '❤️🍞💰👥', title: 'Survive & Thrive', text: 'Keep an eye on your Health, Food, Money, and Influence. If any drop too low, your journey may end!' },
  { icon: '🦉', title: 'Learn from the Past', text: 'After each outcome, Professor Spark offers historical insights. Answer questions to test your knowledge. Let\'s begin!' }
];

interface OnboardingGuideProps {
  onClose: () => void;
}

const OnboardingGuide: React.FC<OnboardingGuideProps> = ({ onClose }) => {
  const [step, setStep] = useState(0);
  const currentStep = guideSteps[step];
  const isLastStep = step === guideSteps.length - 1;

  const nextStep = () => {
    soundService.playUIClick();
    if (isLastStep) {
      onClose();
    } else {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    soundService.playUIClick();
    if (step > 0) {
      setStep(step - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in-up" style={{ animationDuration: '0.5s' }}>
      <div className="bg-brand-dark-bg p-8 rounded-xl shadow-2xl max-w-md w-full border-2 border-brand-frame-highlight m-4 text-center">
        <div className="text-7xl mb-4">{currentStep.icon}</div>
        <h2 className="text-3xl font-cinzel text-brand-gold mb-3">{currentStep.title}</h2>
        <p className="text-gray-300 mb-8 min-h-[72px]">{currentStep.text}</p>
        
        <div className="flex justify-center gap-3 mb-8">
            {guideSteps.map((_, index) => (
                <div key={index} className={`w-3 h-3 rounded-full transition-colors ${step === index ? 'bg-brand-gold' : 'bg-brand-frame'}`}></div>
            ))}
        </div>

        <div className="flex justify-between items-center">
          <button 
            onClick={prevStep} 
            className={`text-gray-400 hover:text-white transition ${step === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          >
            Back
          </button>
          <button 
            onClick={nextStep}
            className="bg-brand-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-opacity-80 transition-transform transform hover:scale-105 shadow-md"
          >
            {isLastStep ? "Let's Go!" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingGuide;
