// components/assignment/Deliverables.tsx

import React, { useState } from 'react';
import { Assignment } from './AssignmentMode';

interface DeliverablesProps {
  assignment: Assignment;
  onComplete: (finalContent: string) => void;
}

const Deliverables: React.FC<DeliverablesProps> = ({ assignment, onComplete }) => {
  const [finalContent, setFinalContent] = useState(assignment.content.final || assignment.content.draft || '');
  const [reflection, setReflection] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const reflectionPrompts = [
    "What did you learn about this topic that you didn't know before?",
    "What was the most challenging part of creating this assignment?",
    "How has your understanding of the subject changed?",
  ];

  const handleExport = async (format: 'text' | 'docx' | 'print') => {
    setIsExporting(true);

    try {
      const content = `
${assignment.title}

${finalContent}

---

Assignment Details:
- Goal: ${assignment.goal}
- Level: ${assignment.level}
- Created: ${new Date(assignment.createdAt).toLocaleDateString()}

Reflection:
${reflection}
      `;

      switch (format) {
        case 'text':
          // Copy to clipboard
          await navigator.clipboard.writeText(content);
          alert('Content copied to clipboard!');
          break;

        case 'docx':
          // In a real implementation, this would generate a .docx file
          // For now, we'll download as .txt
          const blob = new Blob([content], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${assignment.title.replace(/\s+/g, '_')}.txt`;
          a.click();
          URL.revokeObjectURL(url);
          break;

        case 'print':
          // Open print dialog
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(`
              <html>
                <head>
                  <title>${assignment.title}</title>
                  <style>
                    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
                    h1 { color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
                    .reflection { background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 20px; }
                  </style>
                </head>
                <body>
                  <h1>${assignment.title}</h1>
                  <div>${finalContent.replace(/\n/g, '<br>')}</div>
                  ${reflection ? `
                    <div class="reflection">
                      <h3>Reflection</h3>
                      <p>${reflection.replace(/\n/g, '<br>')}</p>
                    </div>
                  ` : ''}
                </body>
              </html>
            `);
            printWindow.document.close();
            printWindow.print();
          }
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareToDrive = async () => {
    // In a real implementation, this would integrate with Google Drive API
    alert('Google Drive integration would be implemented here. For now, please use the export options above.');
  };

  const handleComplete = () => {
    if (!finalContent.trim()) {
      alert('Please add your final content');
      return;
    }

    // Update assignment with final content and reflection
    const finalAssignment: Assignment = {
      ...assignment,
      content: {
        ...assignment.content,
        final: finalContent,
      },
      metadata: {
        ...assignment.metadata,
        timeSpent: assignment.metadata.timeSpent + 5, // Add time for final review
      },
    };

    onComplete(finalContent);
  };

  return (
    <div className="deliverables">
      <h2>📄 Final Review & Export</h2>

      <div className="final-content-section">
        <h3>Final Content</h3>
        <textarea
          value={finalContent}
          onChange={(e) => setFinalContent(e.target.value)}
          placeholder="Make any final edits to your assignment..."
          className="final-content-editor"
        />
        <div className="content-stats">
          <span>Words: {finalContent.split(/\s+/).filter(word => word.length > 0).length}</span>
          <span>Characters: {finalContent.length}</span>
        </div>
      </div>

      <div className="reflection-section">
        <h3>📝 What I Learned (Optional)</h3>
        <p className="reflection-intro">
          Reflecting on your learning helps reinforce understanding and can be valuable for your teacher.
          Choose one or more prompts to answer:
        </p>

        <div className="reflection-prompts">
          {reflectionPrompts.map((prompt, index) => (
            <div key={index} className="prompt-item">
              <p className="prompt-text">💭 {prompt}</p>
            </div>
          ))}
        </div>

        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="Share your thoughts and reflections here..."
          rows={6}
          className="reflection-editor"
        />
      </div>

      <div className="export-section">
        <h3>📤 Export Options</h3>
        <div className="export-buttons">
          <button
            className="export-button"
            onClick={() => handleExport('text')}
            disabled={isExporting}
          >
            📋 Copy Text
          </button>

          <button
            className="export-button"
            onClick={() => handleExport('docx')}
            disabled={isExporting}
          >
            📄 Download .txt
          </button>

          <button
            className="export-button"
            onClick={() => handleExport('print')}
            disabled={isExporting}
          >
            🖨️ Print Friendly
          </button>

          <button
            className="export-button drive-button"
            onClick={handleShareToDrive}
            disabled={isExporting}
          >
            ☁️ Google Drive
          </button>
        </div>

        <div className="academic-integrity">
          <div className="integrity-notice">
            <h4>🛡️ Academic Integrity</h4>
            <p>
              This assignment was created with AI assistance. All content has been reviewed and edited by you.
              Use your own words and understanding when submitting to maintain academic integrity.
            </p>
          </div>
        </div>
      </div>

      <div className="assignment-summary">
        <h3>📊 Assignment Summary</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">Goal:</span>
            <span className="summary-value">{assignment.goal}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Level:</span>
            <span className="summary-value">{assignment.level}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Time Spent:</span>
            <span className="summary-value">{Math.round(assignment.metadata.timeSpent / 60)} min</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Revisions:</span>
            <span className="summary-value">{assignment.metadata.revisions}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">AI Suggestions:</span>
            <span className="summary-value">{assignment.metadata.aiSuggestions}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Word Count:</span>
            <span className="summary-value">{finalContent.split(/\s+/).filter(word => word.length > 0).length}</span>
          </div>
        </div>
      </div>

      <div className="final-actions">
        <button className="complete-button" onClick={handleComplete}>
          🎉 Complete Assignment
        </button>
      </div>

      <style jsx>{`
        .deliverables {
          max-width: 900px;
          margin: 0 auto;
        }

        .deliverables h2 {
          color: #1f2937;
          margin-bottom: 24px;
          text-align: center;
        }

        .deliverables h3 {
          color: #374151;
          margin-bottom: 16px;
          font-size: 1.1rem;
        }

        .final-content-section, .reflection-section, .export-section, .assignment-summary {
          background: #f8fafc;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .final-content-editor, .reflection-editor {
          width: 100%;
          min-height: 200px;
          padding: 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-family: inherit;
          font-size: 1rem;
          line-height: 1.6;
          resize: vertical;
        }

        .content-stats {
          display: flex;
          gap: 20px;
          margin-top: 8px;
          color: #6b7280;
          font-size: 0.9rem;
        }

        .reflection-intro {
          color: #6b7280;
          margin-bottom: 16px;
          font-size: 0.95rem;
        }

        .reflection-prompts {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }

        .prompt-item {
          background: white;
          border-radius: 6px;
          padding: 12px;
          border-left: 3px solid #3b82f6;
        }

        .prompt-text {
          margin: 0;
          color: #374151;
          font-size: 0.9rem;
        }

        .export-buttons {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }

        .export-button {
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .export-button:hover:not(:disabled) {
          border-color: #3b82f6;
          background: #f0f9ff;
        }

        .export-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .export-button.drive-button {
          border-color: #34a853;
        }

        .export-button.drive-button:hover:not(:disabled) {
          border-color: #34a853;
          background: #f0f9ff;
        }

        .academic-integrity {
          background: #fefce8;
          border-radius: 8px;
          padding: 16px;
          border: 1px solid #fde047;
        }

        .integrity-notice h4 {
          color: #92400e;
          margin: 0 0 8px 0;
        }

        .integrity-notice p {
          color: #92400e;
          margin: 0;
          font-size: 0.9rem;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: white;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        }

        .summary-label {
          color: #6b7280;
          font-weight: 500;
        }

        .summary-value {
          color: #1f2937;
          font-weight: 600;
        }

        .final-actions {
          text-align: center;
          margin-top: 32px;
        }

        .complete-button {
          background: #10b981;
          color: white;
          border: none;
          padding: 16px 32px;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .complete-button:hover {
          background: #059669;
        }

        @media (max-width: 768px) {
          .export-buttons {
            grid-template-columns: 1fr;
          }

          .summary-grid {
            grid-template-columns: 1fr;
          }

          .summary-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }
        }
      `}</style>
    </div>
  );
};

export default Deliverables;
