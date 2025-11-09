// components/shared/TabContent.tsx

import React from 'react';
import { useAppNavigation } from '../../context/AppNavigationContext';
import JourneysTab from '../tabs/JourneysTab';
import ExploreTab from '../tabs/ExploreTab';
import UploadTab from '../tabs/UploadTab';
import TutorTab from '../tabs/TutorTab';
import TodayTab from '../tabs/TodayTab';

const TabContent: React.FC = () => {
  const { navigationState } = useAppNavigation();

  const renderTabContent = () => {
    switch (navigationState.activeTab) {
      case 'journeys':
        return <JourneysTab />;
      case 'explore':
        return <ExploreTab />;
      case 'upload':
        return <UploadTab />;
      case 'tutor':
        return <TutorTab />;
      case 'today':
        return <TodayTab />;
      default:
        return <JourneysTab />;
    }
  };

  return (
    <main className="tab-content">
      {renderTabContent()}
    </main>
  );
};

export default TabContent;
