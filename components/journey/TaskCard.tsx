// components/journey/TaskCard.tsx

import React, { useState, useCallback } from 'react';
import { PersonalJourney, JourneyStep, Question } from '../../types';
import QuestionRenderer from '../lesson/QuestionRenderer';
import { GoogleGenAI } from '@google/genai';

interface TaskCardProps {
  step: JourneyStep;
  journey: PersonalJourney;
  onComplete: (result: any) => void;
  onHintUsed: () => void;
  onAdaptiveRetry: (questionId: string) => void;
  onSpacedPractice: (difficultQuestions: Question[]) => void;
  onShowTutor: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  step,
  journey,
  onComplete,
  onHintUsed,
  onAdaptiveRetry,
  onSpacedPractice,
  onShowTutor
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [startTime] = useState(Date.now());
  const [showHint, setShowHint] = useState(false);
  const [hintText, setHintText] = useState('');

  const questions = step.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex >= questions.length - 1;

  const generateHint = useCallback(async (question: Question) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || '' });
      const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt = `Generate a helpful hint for this question without giving away the answer:

Question: ${question.questionText}
Type: ${question.type}

Provide a brief hint that guides the student toward the answer.`;

      const response = await model.generateContent({
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const result = JSON.parse(response.text);
      return result.hint || 'Think about the key concepts from the material.';
    } catch (error) {
      console.error('Hint generation failed:', error);
      return 'Review the material for clues about this topic.';
    }
  }, []);

  const handleHintClick = async () => {
    if (!currentQuestion) return;

    setHintsUsed(prev => prev + 1);
    onHintUsed();

    if (!showHint) {
      const hint = await generateHint(currentQuestion);
      setHintText(hint);
      setShowHint(true);
    } else {
      setShowHint(false);
    }
  };

  const handleAnswerSubmit = useCallback((answer: any, isCorrect: boolean) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = {
      answer,
      isCorrect,
      timeSpent: Date.now() - startTime,
      hintsUsed: hintsUsed,
    };
    setAnswers(newAnswers);

    // Reset hint state for next question
    setShowHint(false);
    setHintText('');

    if (isCorrect || isLastQuestion) {
      // Move to next question or complete
      if (isLastQuestion) {
        handleTaskComplete(newAnswers);
      } else {
        setCurrentQuestionIndex(prev => prev + 1);
      }
    } else {
      // Adaptive retry - show similar but different question
      handleAdaptiveRetry(currentQuestion.id);
      // For now, just allow them to try again
      // In production, this would generate a new similar question
    }
  }, [answers, currentQuestionIndex, isLastQuestion, hintsUsed, startTime, onAdaptiveRetry]);

  const handleTaskComplete = (finalAnswers: any[]) => {
    const totalTime = Date.now() - startTime;
    const correctAnswers = finalAnswers.filter(a => a.isCorrect).length;
    const accuracy = correctAnswers / finalAnswers.length;
    const totalHintsUsed = finalAnswers.reduce((sum, a) => sum + (a.hintsUsed || 0), 0);

    // Identify difficult questions for spaced practice
    const difficultQuestions = questions.filter((q, index) => {
      const answer = finalAnswers[index];
      return !answer?.isCorrect || (answer?.hintsUsed || 0) > 1;
    });

    if (difficultQuestions.length > 0) {
      onSpacedPractice(difficultQuestions);
    }

    const result = {
      answers: finalAnswers,
      accuracy: [accuracy],
      totalTime,
      hintsUsed: totalHintsUsed,
      firstTry: hintsUsed === 0,
      difficultQuestions,
      confusionTags: [], // Would be generated from wrong answers
    };

    onComplete(result);
  };

  if (!currentQuestion) {
    return (
      <div className="task-card empty">
        <h3>No questions available for this step</h3>
        <button onClick={() => onComplete({})}>Continue</button>
      </div>
    );
  }

  return (
    <div className="task-card">
      <div className="task-header">
        <div className="task-type">
          <span className="task-icon">🎯</span>
          <span className="task-label">Activity</span>
        </div>
        <div className="task-progress">
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
        <div className="task-actions">
          <button className="hint-button" onClick={handleHintClick}>
            💡 {showHint ? 'Hide' : 'Show'} Hint ({hintsUsed} used)
          </button>
          <button className="tutor-button" onClick={onShowTutor}>
            🎓 Ask Tutor
          </button>
        </div>
      </div>

      {showHint && (
        <div className="hint-panel">
          <div className="hint-content">
            <strong>💡 Hint:</strong> {hintText}
          </div>
        </div>
      )}

      <div className="task-content">
        <QuestionRenderer
          question={currentQuestion}
          onAnswer={handleAnswerSubmit}
          showExplanation={false} // We'll show explanation after answer
        />
      </div>

      <div className="task-footer">
        <div className="task-stats">
          <span>Hints used: {hintsUsed}</span>
          <span>Time: {Math.round((Date.now() - startTime) / 1000)}s</span>
        </div>

        {isLastQuestion && (
          <div className="completion-notice">
            🎉 This is the final question!
          </div>
        )}
      </div>

      <style jsx>{`
        .task-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          max-width: 700px;
          margin: 0 auto;
        }

        .task-card.empty {
          text-align: center;
          padding: 40px;
        }

        .task-header {
          background: #f8fafc;
          padding: 16px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #e5e7eb;
          flex-wrap: wrap;
          gap: 12px;
        }

        .task-type {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .task-icon {
          font-size: 1.2rem;
        }

        .task-label {
          font-weight: 600;
          color: #374151;
        }

        .task-progress {
          font-size: 0.9rem;
          color: #6b7280;
          font-weight: 500;
        }

        .task-actions {
          display: flex;
          gap: 8px;
        }

        .hint-button, .tutor-button {
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
        }

        .hint-button {
          background: #f59e0b;
          color: white;
        }

        .hint-button:hover {
          background: #d97706;
        }

        .tutor-button {
          background: #3b82f6;
          color: white;
        }

        .tutor-button:hover {
          background: #2563eb;
        }

        .hint-panel {
          background: #fefce8;
          border-bottom: 1px solid #fde047;
          padding: 16px 24px;
        }

        .hint-content {
          color: #92400e;
          line-height: 1.5;
        }

        .task-content {
          padding: 24px;
        }

        .task-footer {
          background: #f8fafc;
          padding: 16px 24px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        .task-stats {
          display: flex;
          gap: 16px;
          font-size: 0.9rem;
          color: #6b7280;
        }

        .completion-notice {
          background: #dcfce7;
          color: #166534;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.9rem;
        }

        @media (max-width: 768px) {
          .task-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .task-actions {
            justify-content: center;
          }

          .task-footer {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
          }

          .task-stats {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default TaskCard;
