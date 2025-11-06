
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { soundService } from '../services/soundService';

interface SettingsContextType {
  isSoundMuted: boolean;
  toggleSound: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isSoundMuted, setIsSoundMuted] = useState(false);

    useEffect(() => {
        soundService.setMuted(isSoundMuted);
    }, [isSoundMuted]);

    const toggleSound = () => {
        setIsSoundMuted(prev => {
            soundService.setMuted(!prev); // Immediately update service
            return !prev;
        });
    };

    return (
        <SettingsContext.Provider value={{ isSoundMuted, toggleSound }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
