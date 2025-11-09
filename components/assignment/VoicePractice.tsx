// components/assignment/VoicePractice.tsx

import React, { useState, useRef, useEffect } from 'react';
import { Assignment } from './AssignmentMode';
import { assetCache } from '../../services/assetCacheService';

interface VoicePracticeProps {
  assignment: Assignment;
  onComplete: () => void;
}

interface FeedbackItem {
  aspect: string;
  score: number; // 1-5
  comment: string;
  suggestion: string;
}

const VoicePractice: React.FC<VoicePracticeProps> = ({ assignment, onComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [practiceText, setPracticeText] = useState('');
  const [showResults, setShowResults] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // Generate practice text based on assignment
    generatePracticeText();
  }, [assignment]);

  const generatePracticeText = async () => {
    const text = assignment.content.draft ||
                assignment.content.final ||
                `Practice presenting your ${assignment.goal} about ${assignment.title}.`;

    // Take first 200 words for practice
    const words = text.split(' ').slice(0, 200);
    setPracticeText(words.join(' ') + (words.length >= 200 ? '...' : ''));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(blob);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Recording failed:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const analyzeRecording = async () => {
    if (!audioBlob) return;

    setIsAnalyzing(true);
    try {
      // In a real implementation, this would send audio to speech analysis API
      // For now, we'll simulate analysis with mock feedback

      const mockFeedback: FeedbackItem[] = [
        {
          aspect: 'Pace',
          score: 4,
          comment: 'Good steady pace that\'s easy to follow',
          suggestion: 'Try varying your pace slightly for emphasis on key points'
        },
        {
          aspect: 'Clarity',
          score: 3,
          comment: 'Generally clear, but some words were mumbled',
          suggestion: 'Practice enunciating key terms and proper nouns'
        },
        {
          aspect: 'Confidence',
          score: 4,
          comment: 'Strong, confident delivery throughout',
          suggestion: 'Consider adding more pauses for emphasis'
        },
        {
          aspect: 'Content Coverage',
          score: 5,
          comment: 'Covered all main points effectively',
          suggestion: 'Excellent coverage of the material'
        }
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      setFeedback(mockFeedback);
      setShowResults(true);
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getAverageScore = () => {
    if (feedback.length === 0) return 0;
    return Math.round(feedback.reduce((sum, item) => sum + item.score, 0) / feedback.length);
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return '#10b981';
    if (score >= 3) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="voice-practice">
      <h2>🎤 Practice Your Presentation</h2>

      {!showResults ? (
        <div className="practice-session">
          <div className="practice-text">
            <h3>Read this excerpt aloud:</h3>
            <div className="text-content">
              {practiceText}
            </div>
          </div>

          <div className="recording-controls">
            {!audioBlob ? (
              <div className="record-section">
                <button
                  className={`record-button ${isRecording ? 'recording' : ''}`}
                  onClick={isRecording ? stopRecording : startRecording}
                >
                  {isRecording ? (
                    <>
                      <div className="recording-indicator"></div>
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <span className="record-icon">🎙️</span>
                      Start Recording
                    </>
                  )}
                </button>
                <p className="recording-tip">
                  {isRecording
                    ? 'Speak clearly and at a natural pace'
                    : 'Click to start recording your practice presentation'
                  }
                </p>
              </div>
            ) : (
              <div className="playback-section">
                <audio controls>
                  <source src={URL.createObjectURL(audioBlob)} type="audio/wav" />
                </audio>
                <div className="playback-actions">
                  <button
                    className="analyze-button"
                    onClick={analyzeRecording}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Get Feedback'}
                  </button>
                  <button
                    className="retake-button"
                    onClick={() => {
                      setAudioBlob(null);
                      setFeedback([]);
                    }}
                  >
                    Record Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="results-section">
          <div className="overall-score">
            <h3>Overall Performance</h3>
            <div className="score-display">
              <div
                className="score-circle"
                style={{ borderColor: getScoreColor(getAverageScore()) }}
              >
                <span className="score-number">{getAverageScore()}</span>
                <span className="score-label">/5</span>
              </div>
              <p className="score-description">
                {getAverageScore() >= 4 ? 'Excellent presentation!' :
                 getAverageScore() >= 3 ? 'Good job with room for improvement' :
                 'Keep practicing - you\'ll get there!'}
              </p>
            </div>
          </div>

          <div className="detailed-feedback">
            <h3>Detailed Feedback</h3>
            <div className="feedback-list">
              {feedback.map((item, index) => (
                <div key={index} className="feedback-item">
                  <div className="feedback-header">
                    <h4>{item.aspect}</h4>
                    <div className="score-stars">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`star ${i < item.score ? 'filled' : ''}`}
                          style={{ color: i < item.score ? getScoreColor(item.score) : '#e5e7eb' }}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="feedback-comment">{item.comment}</p>
                  <p className="feedback-suggestion">
                    <strong>Suggestion:</strong> {item.suggestion}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="practice-tips">
            <h3>💡 Presentation Tips</h3>
            <ul>
              <li>Speak slowly and clearly - it's better to be understood than fast</li>
              <li>Pause briefly after important points to let them sink in</li>
              <li>Use your voice to emphasize key ideas and transitions</li>
              <li>Practice in front of a mirror to check your body language</li>
              <li>Time yourself to ensure you stay within the allotted time</li>
            </ul>
          </div>
        </div>
      )}

      <div className="practice-actions">
        {showResults && (
          <button className="continue-button" onClick={onComplete}>
            Continue to Final Review →
          </button>
        )}
      </div>

      <style jsx>{`
        .voice-practice {
          max-width: 800px;
          margin: 0 auto;
        }

        .voice-practice h2 {
          color: #1f2937;
          margin-bottom: 24px;
          text-align: center;
        }

        .practice-session {
          background: #f8fafc;
          border-radius: 12px;
          padding: 24px;
        }

        .practice-text h3 {
          color: #374151;
          margin-bottom: 16px;
        }

        .text-content {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          font-size: 1.1rem;
          line-height: 1.6;
          color: #374151;
          margin-bottom: 24px;
          max-height: 300px;
          overflow-y: auto;
        }

        .recording-controls {
          text-align: center;
        }

        .record-button {
          background: #ef4444;
          color: white;
          border: none;
          padding: 16px 32px;
          border-radius: 50px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        .record-button:hover:not(.recording) {
          background: #dc2626;
          transform: translateY(-2px);
        }

        .record-button.recording {
          background: #dc2626;
          animation: pulse 1s infinite;
        }

        .recording-indicator {
          width: 12px;
          height: 12px;
          background: #ef4444;
          border-radius: 50%;
          animation: blink 1s infinite;
        }

        .record-icon {
          font-size: 1.2rem;
        }

        .recording-tip {
          margin-top: 12px;
          color: #6b7280;
          font-size: 0.9rem;
        }

        .playback-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .playback-section audio {
          width: 100%;
          max-width: 400px;
        }

        .playback-actions {
          display: flex;
          gap: 12px;
        }

        .analyze-button, .retake-button {
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
        }

        .analyze-button {
          background: #3b82f6;
          color: white;
        }

        .analyze-button:hover:not(:disabled) {
          background: #2563eb;
        }

        .analyze-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .retake-button {
          background: #6b7280;
          color: white;
        }

        .retake-button:hover {
          background: #4b5563;
        }

        .results-section {
          background: white;
          border-radius: 12px;
          padding: 24px;
        }

        .overall-score {
          text-align: center;
          margin-bottom: 32px;
        }

        .overall-score h3 {
          color: #374151;
          margin-bottom: 16px;
        }

        .score-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .score-circle {
          width: 80px;
          height: 80px;
          border: 6px solid;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .score-number {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
        }

        .score-label {
          font-size: 0.9rem;
          color: #6b7280;
        }

        .score-description {
          color: #6b7280;
          font-style: italic;
          max-width: 300px;
        }

        .detailed-feedback h3 {
          color: #374151;
          margin-bottom: 16px;
        }

        .feedback-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
        }

        .feedback-item {
          background: #f8fafc;
          border-radius: 8px;
          padding: 16px;
          border-left: 4px solid #3b82f6;
        }

        .feedback-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .feedback-header h4 {
          margin: 0;
          color: #374151;
        }

        .score-stars {
          display: flex;
          gap: 2px;
        }

        .star {
          font-size: 1.2rem;
        }

        .feedback-comment {
          color: #374151;
          margin: 8px 0;
        }

        .feedback-suggestion {
          color: #059669;
          margin: 8px 0 0 0;
          font-size: 0.9rem;
        }

        .practice-tips h3 {
          color: #374151;
          margin-bottom: 12px;
        }

        .practice-tips ul {
          color: #6b7280;
          padding-left: 20px;
        }

        .practice-tips li {
          margin-bottom: 8px;
        }

        .practice-actions {
          text-align: center;
          margin-top: 24px;
        }

        .continue-button {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 16px 32px;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .continue-button:hover {
          background: #2563eb;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.3; }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        @media (max-width: 768px) {
          .playback-actions {
            flex-direction: column;
            width: 100%;
          }

          .analyze-button, .retake-button {
            width: 100%;
          }

          .score-stars {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
};

export default VoicePractice;
