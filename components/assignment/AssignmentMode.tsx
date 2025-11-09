// components/assignment/AssignmentMode.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ContentAnalysis, PersonalJourney } from '../../types';
import AssignmentSetup from './AssignmentSetup';
import GuidedBuilder from './GuidedBuilder';
import VoicePractice from './VoicePractice';
import Deliverables from './Deliverables';
import { GoogleGenAI } from '@google/genai';

export interface Assignment {
  id: string;
  userId: string;
  title: string;
  goal: 'essay' | 'talk' | 'slides' | 'study-sheet';
  level: 'basic' | 'standard' | 'advanced';
  prompt: string;
  sourceMaterialIds: string[];
  createdAt: Date;
  status: 'setup' | 'planning' | 'writing' | 'practicing' | 'reviewing' | 'complete';
  content: {
    thesis?: string;
    outline?: any;
    draft?: string;
    final?: string;
  };
  metadata: {
    wordCount?: number;
    timeSpent: number;
    revisions: number;
    aiSuggestions: number;
  };
}

interface AssignmentModeProps {
  analysis?: ContentAnalysis;
  journey?: PersonalJourney;
  onComplete?: (assignment: Assignment) => void;
  onCancel?: () => void;
}

const AssignmentMode: React.FC<AssignmentModeProps> = ({
  analysis,
  journey,
  onComplete,
  onCancel
}) => {
  const { user } = useAuth();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [currentStep, setCurrentStep] = useState<'setup' | 'planning' | 'writing' | 'practicing' | 'reviewing' | 'complete'>('setup');

  useEffect(() => {
    if (analysis && !assignment) {
      // Auto-create assignment from analysis if it's an assignment type
      if (analysis.intent === 'assignment' || analysis.intent === 'essay' || analysis.intent === 'presentation') {
        createAssignmentFromAnalysis();
      }
    }
  }, [analysis]);

  const createAssignmentFromAnalysis = async () => {
    if (!user || !analysis) return;

    const newAssignment: Assignment = {
      id: `assignment_${Date.now()}`,
      userId: user.uid,
      title: analysis.title,
      goal: getGoalFromIntent(analysis.intent),
      level: analysis.difficulty as 'basic' | 'standard' | 'advanced',
      prompt: `Based on the material: ${analysis.summary}`,
      sourceMaterialIds: [], // Would be populated from journey
      createdAt: new Date(),
      status: 'setup',
      content: {},
      metadata: {
        timeSpent: 0,
        revisions: 0,
        aiSuggestions: 0,
      },
    };

    setAssignment(newAssignment);
  };

  const getGoalFromIntent = (intent: string): 'essay' | 'talk' | 'slides' | 'study-sheet' => {
    switch (intent) {
      case 'essay': return 'essay';
      case 'presentation': return 'talk';
      default: return 'study-sheet';
    }
  };

  const handleSetupComplete = (setupData: Partial<Assignment>) => {
    if (!assignment) return;

    const updatedAssignment = {
      ...assignment,
      ...setupData,
      status: 'planning' as const,
    };

    setAssignment(updatedAssignment);
    setCurrentStep('planning');
  };

  const handlePlanningComplete = async (outlineData: any) => {
    if (!assignment) return;

    // Generate AI suggestions for thesis and structure
    const aiSuggestions = await generateAISuggestions(assignment, outlineData);

    const updatedAssignment = {
      ...assignment,
      content: {
        ...assignment.content,
        outline: outlineData,
        thesis: aiSuggestions.thesis,
      },
      status: 'writing',
      metadata: {
        ...assignment.metadata,
        aiSuggestions: assignment.metadata.aiSuggestions + 1,
      },
    };

    setAssignment(updatedAssignment);
    setCurrentStep('writing');
  };

  const handleWritingComplete = (draft: string) => {
    if (!assignment) return;

    const updatedAssignment = {
      ...assignment,
      content: {
        ...assignment.content,
        draft,
      },
      status: 'practicing',
      metadata: {
        ...assignment.metadata,
        wordCount: draft.split(' ').length,
        revisions: assignment.metadata.revisions + 1,
      },
    };

    setAssignment(updatedAssignment);
    setCurrentStep('practicing');
  };

  const handlePracticeComplete = () => {
    if (!assignment) return;

    setCurrentStep('reviewing');
  };

  const handleReviewComplete = (finalContent: string) => {
    if (!assignment) return;

    const completedAssignment: Assignment = {
      ...assignment,
      content: {
        ...assignment.content,
        final: finalContent,
      },
      status: 'complete',
    };

    setAssignment(completedAssignment);
    setCurrentStep('complete');

    if (onComplete) {
      onComplete(completedAssignment);
    }
  };

  const generateAISuggestions = async (assignment: Assignment, outline: any) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || '' });
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Generate a thesis statement and writing suggestions for this ${assignment.goal} assignment:

Title: ${assignment.title}
Goal: ${assignment.goal}
Level: ${assignment.level}
Prompt: ${assignment.prompt}

Outline: ${JSON.stringify(outline, null, 2)}

Please provide:
1. A strong thesis statement
2. Key points to cover
3. Writing tips for this level

Return as JSON with keys: thesis, keyPoints, writingTips`;

    try {
      const response = await model.generateContent({
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      return JSON.parse(response.text);
    } catch (error) {
      console.error('AI suggestions error:', error);
      return {
        thesis: 'Please develop a clear thesis statement for your assignment.',
        keyPoints: [],
        writingTips: [],
      };
    }
  };

  const renderCurrentStep = () => {
    if (!assignment) {
      return <AssignmentSetup onComplete={handleSetupComplete} initialData={analysis} />;
    }

    switch (currentStep) {
      case 'setup':
        return <AssignmentSetup onComplete={handleSetupComplete} initialData={analysis} />;
      case 'planning':
        return <GuidedBuilder assignment={assignment} onComplete={handlePlanningComplete} />;
      case 'writing':
        return <GuidedBuilder assignment={assignment} onComplete={handleWritingComplete} isWritingPhase />;
      case 'practicing':
        return <VoicePractice assignment={assignment} onComplete={handlePracticeComplete} />;
      case 'reviewing':
        return <Deliverables assignment={assignment} onComplete={handleReviewComplete} />;
      case 'complete':
        return (
          <div className="assignment-complete">
            <h2>🎉 Assignment Complete!</h2>
            <p>Your {assignment.goal} is ready for submission.</p>
            <div className="completion-stats">
              <div>Words: {assignment.metadata.wordCount || 0}</div>
              <div>Time: {Math.round(assignment.metadata.timeSpent / 60)} min</div>
              <div>Revisions: {assignment.metadata.revisions}</div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="assignment-mode">
      <div className="assignment-header">
        <h1>📝 Assignment Mode</h1>
        <div className="assignment-progress">
          <div className={`step ${currentStep === 'setup' ? 'active' : 'completed'}`}>Setup</div>
          <div className={`step ${currentStep === 'planning' ? 'active' : currentStep === 'writing' || currentStep === 'practicing' || currentStep === 'reviewing' || currentStep === 'complete' ? 'completed' : ''}`}>Plan</div>
          <div className={`step ${currentStep === 'writing' ? 'active' : currentStep === 'practicing' || currentStep === 'reviewing' || currentStep === 'complete' ? 'completed' : ''}`}>Write</div>
          <div className={`step ${currentStep === 'practicing' ? 'active' : currentStep === 'reviewing' || currentStep === 'complete' ? 'completed' : ''}`}>Practice</div>
          <div className={`step ${currentStep === 'reviewing' ? 'active' : currentStep === 'complete' ? 'completed' : ''}`}>Review</div>
        </div>
        {onCancel && (
          <button className="cancel-button" onClick={onCancel}>
            Exit Assignment Mode
          </button>
        )}
      </div>

      <div className="assignment-content">
        {renderCurrentStep()}
      </div>

      <style jsx>{`
        .assignment-mode {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .assignment-header {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .assignment-header h1 {
          margin: 0 0 16px 0;
          color: #1f2937;
        }

        .assignment-progress {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
        }

        .step {
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .step.active {
          background: #3b82f6;
          color: white;
        }

        .step.completed {
          background: #10b981;
          color: white;
        }

        .step:not(.active):not(.completed) {
          background: #e5e7eb;
          color: #6b7280;
        }

        .cancel-button {
          background: #ef4444;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .cancel-button:hover {
          background: #dc2626;
        }

        .assignment-content {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .assignment-complete {
          text-align: center;
          padding: 40px;
        }

        .assignment-complete h2 {
          color: #1f2937;
          margin-bottom: 16px;
        }

        .completion-stats {
          display: flex;
          justify-content: center;
          gap: 24px;
          margin-top: 24px;
        }

        .completion-stats div {
          background: #f0fdf4;
          color: #166534;
          padding: 12px 20px;
          border-radius: 8px;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .assignment-progress {
            flex-wrap: wrap;
          }

          .step {
            flex: 1;
            min-width: 80px;
            text-align: center;
          }

          .completion-stats {
            flex-direction: column;
            gap: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default AssignmentMode;
