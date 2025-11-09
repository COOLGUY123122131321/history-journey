// components/tabs/UploadTab.tsx

import React, { useState } from 'react';
import StudyMaterialUpload from '../study/StudyMaterialUpload';

const UploadTab: React.FC = () => {
  const [assignmentMode, setAssignmentMode] = useState(false);

  return (
    <div className="upload-tab">
      <div className="tab-header">
        <h1>Upload Study Material</h1>
        <p>Transform your materials into personalized learning journeys</p>
      </div>

      <div className="upload-hub">
        <div className="upload-buttons-grid">
          <button className="upload-button pdf-button">
            <div className="button-icon">📄</div>
            <div className="button-text">PDF</div>
            <div className="button-desc">Documents, worksheets, articles</div>
          </button>

          <button className="upload-button image-button">
            <div className="button-icon">🖼️</div>
            <div className="button-text">Image</div>
            <div className="button-desc">Photos, screenshots, diagrams</div>
          </button>

          <button className="upload-button text-button">
            <div className="button-icon">📝</div>
            <div className="button-text">Text</div>
            <div className="button-desc">Paste content directly</div>
          </button>

          <button className="upload-button audio-button">
            <div className="button-icon">🎵</div>
            <div className="button-text">Audio</div>
            <div className="button-desc">Recordings, lectures</div>
          </button>
        </div>

        <div className="upload-options">
          <div className="assignment-toggle">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={assignmentMode}
                onChange={(e) => setAssignmentMode(e.target.checked)}
                className="toggle-input"
              />
              <span className="toggle-slider"></span>
              <span className="toggle-text">Assignment Mode</span>
            </label>
            <p className="toggle-description">
              Enable for essays, presentations, or worksheets that need guided help
            </p>
          </div>
        </div>

        <div className="upload-hint">
          <p>💡 We'll analyze and build a journey from your material</p>
        </div>
      </div>

      <div className="upload-content">
        <StudyMaterialUpload />
      </div>

      <style jsx>{`
        .upload-tab {
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

        .upload-hub {
          background: white;
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 32px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .upload-buttons-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .upload-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 32px 24px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          background: transparent;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
        }

        .upload-button:hover {
          border-color: #3b82f6;
          background: #f0f9ff;
          transform: translateY(-2px);
        }

        .button-icon {
          font-size: 3rem;
          margin-bottom: 12px;
        }

        .button-text {
          font-size: 1.2rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .button-desc {
          font-size: 0.9rem;
          color: #6b7280;
        }

        .upload-options {
          border-top: 1px solid #e5e7eb;
          padding-top: 24px;
        }

        .assignment-toggle {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .toggle-label {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          font-weight: 500;
          color: #1f2937;
        }

        .toggle-input {
          display: none;
        }

        .toggle-slider {
          position: relative;
          width: 44px;
          height: 24px;
          background: #e5e7eb;
          border-radius: 12px;
          transition: background 0.2s ease;
        }

        .toggle-slider::before {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          transition: transform 0.2s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }

        .toggle-input:checked + .toggle-slider {
          background: #3b82f6;
        }

        .toggle-input:checked + .toggle-slider::before {
          transform: translateX(20px);
        }

        .toggle-text {
          font-size: 1rem;
        }

        .toggle-description {
          margin: 0;
          font-size: 0.9rem;
          color: #6b7280;
          font-weight: normal;
        }

        .upload-hint {
          text-align: center;
          margin-top: 24px;
          padding: 16px;
          background: #f0f9ff;
          border-radius: 8px;
          border: 1px solid #bae6fd;
        }

        .upload-hint p {
          margin: 0;
          color: #0369a1;
          font-weight: 500;
        }

        .upload-content {
          background: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        @media (max-width: 768px) {
          .upload-buttons-grid {
            grid-template-columns: 1fr 1fr;
          }

          .upload-button {
            padding: 24px 16px;
          }

          .assignment-toggle {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default UploadTab;
