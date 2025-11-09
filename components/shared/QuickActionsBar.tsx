// components/shared/QuickActionsBar.tsx

import React from 'react';
import { useAppNavigation } from '../../context/AppNavigationContext';

interface QuickActionsBarProps {
  className?: string;
  onTutorToggle?: () => void;
}

const QuickActionsBar: React.FC<QuickActionsBarProps> = ({ className = '', onTutorToggle }) => {
  const { navigateToUpload, navigateToTutor, navigateToToday } = useAppNavigation();

  const quickActions = [
    {
      key: 'upload' as const,
      label: 'Upload Material',
      icon: '📤',
      description: 'Add study materials',
      onClick: () => navigateToUpload(),
    },
    {
      key: 'tutor' as const,
      label: 'Ask Tutor',
      icon: '🎓',
      description: 'Get help from AI tutor',
      onClick: onTutorToggle || (() => navigateToTutor()),
    },
    {
      key: 'today' as const,
      label: 'Today in History',
      icon: '📅',
      description: 'Daily history lessons',
      onClick: () => navigateToToday(),
    },
  ];

  return (
    <div className={`quick-actions-bar ${className}`}>
      <div className="actions-container">
        {quickActions.map((action) => (
          <button
            key={action.key}
            className="action-button"
            onClick={action.onClick}
            title={action.description}
          >
            <span className="action-icon">{action.icon}</span>
            <span className="action-label">{action.label}</span>
          </button>
        ))}
      </div>

      <style jsx>{`
        .quick-actions-bar {
          background: rgba(0, 0, 0, 0.2);
          border-bottom: 1px solid rgba(182, 139, 58, 0.3);
          padding: 8px 16px;
          backdrop-filter: blur(10px);
        }

        .actions-container {
          display: flex;
          gap: 12px;
          max-width: 1200px;
          margin: 0 auto;
          justify-content: center;
        }

        .action-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(182, 139, 58, 0.2);
          border: 1px solid rgba(182, 139, 58, 0.3);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
          font-weight: 500;
          color: #e5e7eb;
        }

        .action-button:hover {
          background: rgba(182, 139, 58, 0.3);
          border-color: rgba(182, 139, 58, 0.5);
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(182, 139, 58, 0.3);
        }

        .action-icon {
          font-size: 16px;
        }

        .action-label {
          white-space: nowrap;
        }

        @media (max-width: 768px) {
          .actions-container {
            flex-wrap: wrap;
          }

          .action-button {
            padding: 6px 12px;
            font-size: 13px;
          }

          .action-label {
            display: none;
          }

          .action-button {
            min-width: 44px;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default QuickActionsBar;
