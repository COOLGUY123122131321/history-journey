// components/shared/TabNavigation.tsx

import React from 'react';
import { AppTab } from '../../types';
import { useAppNavigation } from '../../context/AppNavigationContext';

interface TabNavigationProps {
  className?: string;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ className = '' }) => {
  const { navigationState, setActiveTab } = useAppNavigation();

  const tabs: { key: AppTab; label: string; icon: string }[] = [
    { key: 'journeys', label: 'Journeys', icon: '🗺️' },
    { key: 'explore', label: 'Explore', icon: '🔍' },
    { key: 'upload', label: 'Upload', icon: '📤' },
    { key: 'tutor', label: 'Tutor', icon: '🎓' },
    { key: 'today', label: 'Today', icon: '📅' },
  ];

  return (
    <nav className={`tab-navigation ${className}`}>
      <div className="tab-container">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`tab-button ${navigationState.activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <style jsx>{`
        .tab-navigation {
          background: rgba(0, 0, 0, 0.2);
          border-bottom: 1px solid rgba(182, 139, 58, 0.3);
          backdrop-filter: blur(10px);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .tab-container {
          display: flex;
          max-width: 1200px;
          margin: 0 auto;
        }

        .tab-button {
          flex: 1;
          padding: 16px 8px;
          border: none;
          background: transparent;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          transition: all 0.2s ease;
          position: relative;
          color: #9ca3af;
        }

        .tab-button:hover {
          background: rgba(182, 139, 58, 0.1);
          color: #e5e7eb;
        }

        .tab-button.active {
          color: #b68b3a;
        }

        .tab-button.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: #b68b3a;
          border-radius: 2px 2px 0 0;
        }

        .tab-icon {
          font-size: 20px;
        }

        .tab-label {
          font-size: 12px;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .tab-button {
            padding: 12px 4px;
          }

          .tab-icon {
            font-size: 18px;
          }

          .tab-label {
            font-size: 11px;
          }
        }
      `}</style>
    </nav>
  );
};

export default TabNavigation;
