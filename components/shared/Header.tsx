import React, { useState, useEffect, useRef } from 'react';
import { useProgress } from '../../context/ProgressContext';
import { soundService } from '../../services/soundService';
import { Resources } from '../../types';

interface HeaderProps {
    onEndJourney: () => void;
}

// Helper hook to get the previous value of a prop or state
function usePrevious<T>(value: T): T | undefined {
  // FIX: Initialize useRef with undefined to satisfy TypeScript's requirement for an initial value when a generic type is provided.
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}


const HeartIcon: React.FC<{ filled: boolean }> = ({ filled }) => (
    <span className={`text-2xl ${filled ? 'text-red-500' : 'text-gray-300'}`}>❤️</span>
);

const HeartsDisplay: React.FC<{ health: number }> = ({ health }) => {
    const totalHearts = 5;
    const filledHearts = Math.ceil((health / 100) * totalHearts);
    return (
        <div className="flex items-center" title={`Health: ${health}%`}>
            {Array.from({ length: totalHearts }).map((_, i) => (
                <HeartIcon key={i} filled={i < filledHearts} />
            ))}
        </div>
    );
};

const XPBar: React.FC = () => {
    const { progress } = useProgress();
    const xpForNextLevel = 100;
    const currentLevelXp = progress.xp % xpForNextLevel;
    const progressPercent = (currentLevelXp / xpForNextLevel) * 100;
    
    return (
        <div className="w-24">
            <div className="flex justify-between text-xs font-bold text-brand-primary">
                <span>Lvl {progress.level}</span>
                <span>{currentLevelXp}/{xpForNextLevel}</span>
            </div>
            <div className="w-full bg-brand-accent rounded-full h-2 mt-1">
                <div className="bg-brand-secondary h-2 rounded-full" style={{ width: `${progressPercent}%` }}></div>
            </div>
        </div>
    );
}

const Header: React.FC<HeaderProps> = ({ onEndJourney }) => {
  const { gameState } = useProgress();
  const { resources } = gameState;

  const [changedResources, setChangedResources] = useState<Partial<Record<keyof Resources, boolean>>>({});
  const prevResources = usePrevious(resources);

  useEffect(() => {
    if (!prevResources) return;

    const changes: Partial<Record<keyof Resources, boolean>> = {};
    let hasChanges = false;

    (Object.keys(resources) as Array<keyof Resources>).forEach(key => {
        if (resources[key] !== prevResources[key]) {
            changes[key] = true;
            hasChanges = true;
        }
    });

    if (hasChanges) {
        setChangedResources(changes);
        const timer = setTimeout(() => setChangedResources({}), 700); // Corresponds to animation duration
        return () => clearTimeout(timer);
    }
  }, [resources, prevResources]);


  const handleEnd = () => {
    soundService.playUIClick();
    onEndJourney();
  };
  
  const ResourceItem: React.FC<{ icon: React.ReactNode; value: number; label: string }> = ({ icon, value, label }) => (
      <div className="flex items-center gap-2 bg-brand-bg p-2 rounded-lg border border-brand-accent shadow-sm" title={label}>
          <span className="text-2xl">{icon}</span>
          <span className="font-bold text-brand-primary text-lg">{value}</span>
      </div>
  );

  return (
    <header className="bg-white/80 backdrop-blur-sm p-3 rounded-xl shadow-md flex justify-between items-center max-w-3xl mx-auto border border-brand-accent">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className={changedResources.health ? 'animate-pulse-resource' : ''}>
          <HeartsDisplay health={resources.health} />
        </div>
        <div className={changedResources.food ? 'animate-pulse-resource' : ''}>
          <ResourceItem icon={'🍞'} value={resources.food} label="Food" />
        </div>
        <div className={changedResources.money ? 'animate-pulse-resource' : ''}>
          <ResourceItem icon={'💰'} value={resources.money} label="Money" />
        </div>
        <div className={changedResources.influence ? 'animate-pulse-resource' : ''}>
          <ResourceItem icon={'👥'} value={resources.influence} label="Influence" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <XPBar />
        <button onClick={handleEnd} className="bg-brand-secondary text-white px-3 py-2 rounded-lg font-bold hover:bg-opacity-80 transition text-sm">
            End Journey
        </button>
      </div>
    </header>
  );
};

export default Header;
