// components/tabs/TutorTab.tsx

import React from 'react';

const TutorTab: React.FC = () => {
  return (
    <div className="tutor-tab">
      <div className="tab-header">
        <h1>Private Tutor</h1>
        <p>Get personalized help with your studies</p>
      </div>

      <div className="tutor-placeholder">
        <div className="tutor-icon">🎓</div>
        <h3>AI Tutor Coming Soon</h3>
        <p>The private tutor will be available here to help explain concepts, practice questions, and assist with assignments.</p>
      </div>

      <style jsx>{`
        .tutor-tab {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .tab-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .tab-header h1 {
          font-size: 2rem;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 8px;
        }

        .tab-header p {
          color: #6b7280;
          font-size: 1.1rem;
        }

        .tutor-placeholder {
          text-align: center;
          padding: 64px 24px;
          background: white;
          border-radius: 12px;
          border: 2px dashed #e5e7eb;
        }

        .tutor-icon {
          font-size: 4rem;
          margin-bottom: 16px;
        }

        .tutor-placeholder h3 {
          font-size: 1.5rem;
          color: #1f2937;
          margin-bottom: 8px;
        }

        .tutor-placeholder p {
          color: #6b7280;
          max-width: 500px;
          margin: 0 auto;
        }
      `}</style>
    </div>
  );
};

export default TutorTab;
