// components/tabs/ExploreTab.tsx

import React from 'react';

const ExploreTab: React.FC = () => {
  return (
    <div className="explore-tab">
      <div className="tab-header">
        <h1>Explore</h1>
        <p>Discover official journeys and search through all content</p>
      </div>

      <div className="explore-placeholder">
        <div className="explore-icon">🔍</div>
        <h3>Explore Content Coming Soon</h3>
        <p>Search through official History Journey tracks, find related materials, and discover new topics to study.</p>
        <div className="search-preview">
          <input
            type="text"
            placeholder="Search topics, materials, or 'Reign of Terror + my worksheet'..."
            className="search-input"
            disabled
          />
        </div>
      </div>

      <style jsx>{`
        .explore-tab {
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

        .explore-placeholder {
          text-align: center;
          padding: 64px 24px;
          background: white;
          border-radius: 12px;
          border: 2px dashed #e5e7eb;
        }

        .explore-icon {
          font-size: 4rem;
          margin-bottom: 16px;
        }

        .explore-placeholder h3 {
          font-size: 1.5rem;
          color: #1f2937;
          margin-bottom: 8px;
        }

        .explore-placeholder p {
          color: #6b7280;
          max-width: 500px;
          margin: 0 auto 24px;
        }

        .search-preview {
          max-width: 400px;
          margin: 0 auto;
        }

        .search-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 1rem;
          background: #f9fafb;
          color: #6b7280;
        }

        .search-input:focus {
          outline: none;
          border-color: #3b82f6;
        }
      `}</style>
    </div>
  );
};

export default ExploreTab;
