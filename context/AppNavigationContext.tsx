// context/AppNavigationContext.tsx

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AppTab, AppNavigationState } from '../types';

interface AppNavigationContextType {
  navigationState: AppNavigationState;
  setActiveTab: (tab: AppTab) => void;
  setQuickAction: (action: 'upload' | 'tutor' | 'today' | undefined) => void;
  setContextTopic: (topic: string | undefined) => void;
  navigateToUpload: (contextTopic?: string) => void;
  navigateToTutor: (materialId?: string, topic?: string) => void;
  navigateToToday: () => void;
}

const AppNavigationContext = createContext<AppNavigationContextType | undefined>(undefined);

export const useAppNavigation = () => {
  const context = useContext(AppNavigationContext);
  if (!context) {
    throw new Error('useAppNavigation must be used within AppNavigationProvider');
  }
  return context;
};

interface AppNavigationProviderProps {
  children: ReactNode;
}

export const AppNavigationProvider: React.FC<AppNavigationProviderProps> = ({ children }) => {
  const [navigationState, setNavigationState] = useState<AppNavigationState>({
    activeTab: 'journeys',
  });

  const setActiveTab = (tab: AppTab) => {
    setNavigationState(prev => ({
      ...prev,
      activeTab: tab,
      quickAction: undefined, // Clear quick action when switching tabs
    }));
  };

  const setQuickAction = (action: 'upload' | 'tutor' | 'today' | undefined) => {
    setNavigationState(prev => ({
      ...prev,
      quickAction: action,
      // Auto-switch to relevant tab if needed
      activeTab: action === 'upload' ? 'upload' :
                 action === 'tutor' ? 'tutor' :
                 action === 'today' ? 'today' : prev.activeTab,
    }));
  };

  const setContextTopic = (topic: string | undefined) => {
    setNavigationState(prev => ({
      ...prev,
      contextTopic: topic,
    }));
  };

  const navigateToUpload = (contextTopic?: string) => {
    setNavigationState({
      activeTab: 'upload',
      quickAction: 'upload',
      contextTopic,
    });
  };

  const navigateToTutor = (materialId?: string, topic?: string) => {
    setNavigationState({
      activeTab: 'tutor',
      quickAction: 'tutor',
      contextTopic: topic,
    });
  };

  const navigateToToday = () => {
    setNavigationState({
      activeTab: 'today',
      quickAction: 'today',
    });
  };

  const value: AppNavigationContextType = {
    navigationState,
    setActiveTab,
    setQuickAction,
    setContextTopic,
    navigateToUpload,
    navigateToTutor,
    navigateToToday,
  };

  return (
    <AppNavigationContext.Provider value={value}>
      {children}
    </AppNavigationContext.Provider>
  );
};
