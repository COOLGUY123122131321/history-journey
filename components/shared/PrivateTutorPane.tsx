// components/shared/PrivateTutorPane.tsx

import React, { useState, useEffect } from 'react';
import { useAppNavigation } from '../../context/AppNavigationContext';
import { getTutorResponse, generateHint, generateCreativeChallenge, explainWithStory } from '../../services/privateTutorService';

type TutorMode = 'explain' | 'practice' | 'fix-answer' | 'ask-why';

interface TutorMessage {
  id: string;
  role: 'user' | 'tutor';
  content: string;
  timestamp: Date;
  mode?: TutorMode;
}

interface PrivateTutorPaneProps {
  isVisible: boolean;
  onToggleVisibility: () => void;
  dockedPosition?: 'right' | 'bottom';
  materialId?: string;
  currentTopic?: string;
}

const PrivateTutorPane: React.FC<PrivateTutorPaneProps> = ({
  isVisible,
  onToggleVisibility,
  dockedPosition = 'right',
  materialId,
  currentTopic
}) => {
  const [activeMode, setActiveMode] = useState<TutorMode>('explain');
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [personality, setPersonality] = useState('spark');

  // Initialize with a welcome message
  useEffect(() => {
    if (messages.length === 0 && isVisible) {
      const welcomeMessage: TutorMessage = {
        id: 'welcome',
        role: 'tutor',
        content: "Hi! I'm your Private Tutor. I can help you understand concepts, practice questions, fix your answers, or explain why things happened. What would you like help with?",
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isVisible, messages.length]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: TutorMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: inputText,
      timestamp: new Date(),
      mode: activeMode,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      let tutorResponse = '';

      // Different handling based on mode
      switch (activeMode) {
        case 'explain':
          if (inputText.toLowerCase().includes('story') || inputText.toLowerCase().includes('example')) {
            tutorResponse = await explainWithStory(inputText, currentTopic || 'general topic', 'user123');
          } else {
            tutorResponse = await getTutorResponse(inputText, {
              materialId,
              currentTopic,
              difficulty: 'intermediate'
            }, 'user123', personality);
          }
          break;

        case 'practice':
          tutorResponse = await generateCreativeChallenge(currentTopic || 'general topic', 'intermediate', 'user123');
          break;

        case 'fix-answer':
          tutorResponse = await getTutorResponse(
            `Please help me fix this answer: "${inputText}"`,
            { materialId, currentTopic },
            'user123',
            personality
          );
          break;

        case 'ask-why':
          tutorResponse = await getTutorResponse(
            `Why did this happen: ${inputText}`,
            { materialId, currentTopic },
            'user123',
            personality
          );
          break;

        default:
          tutorResponse = await getTutorResponse(inputText, { materialId, currentTopic }, 'user123', personality);
      }

      const tutorMessage: TutorMessage = {
        id: `tutor_${Date.now()}`,
        role: 'tutor',
        content: tutorResponse,
        timestamp: new Date(),
        mode: activeMode,
      };

      setMessages(prev => [...prev, tutorMessage]);
    } catch (error) {
      console.error('Tutor error:', error);
      const errorMessage: TutorMessage = {
        id: `error_${Date.now()}`,
        role: 'tutor',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (action: string) => {
    let question = '';
    switch (action) {
      case 'hint':
        question = 'Give me a hint for what I\'m working on';
        break;
      case 'explain-again':
        question = 'Explain this concept again';
        break;
      case 'example':
        question = 'Give me a real-world example';
        break;
      case 'simpler':
        question = 'Explain this in simpler terms';
        break;
    }

    if (question) {
      setInputText(question);
      // Auto-send after a brief delay
      setTimeout(() => handleSendMessage(), 100);
    }
  };

  const clearConversation = () => {
    setMessages([{
      id: 'welcome',
      role: 'tutor',
      content: "Hi! I'm your Private Tutor. I can help you understand concepts, practice questions, fix your answers, or explain why things happened. What would you like help with?",
      timestamp: new Date(),
    }]);
  };

  const modeOptions = [
    { key: 'explain' as TutorMode, label: 'Explain', icon: '💡', desc: 'Plain or story mode' },
    { key: 'practice' as TutorMode, label: 'Practice', icon: '🎯', desc: 'New questions' },
    { key: 'fix-answer' as TutorMode, label: 'Fix Answer', icon: '🔧', desc: 'Feedback & tips' },
    { key: 'ask-why' as TutorMode, label: 'Ask Why', icon: '🤔', desc: 'Causation & significance' },
  ];

  const personalities = [
    { key: 'spark', name: 'Professor Spark', emoji: '⚡' },
    { key: 'nova', name: 'Dr. Nova', emoji: '🌟' },
    { key: 'sage', name: 'Sage', emoji: '🧙' },
  ];

  if (!isVisible) {
    return (
      <div className="tutor-bubble" onClick={onToggleVisibility}>
        <span>💬</span>
        <span className="bubble-text">Need help?</span>
      </div>
    );
  }

  return (
    <>
      <div className={`tutor-pane-overlay ${dockedPosition}`} onClick={onToggleVisibility} />
      <div className={`tutor-pane ${dockedPosition}`}>
        <div className="tutor-header">
          <div className="tutor-title">
            <span className="tutor-icon">🎓</span>
            <span>Private Tutor</span>
          </div>
          <div className="tutor-controls">
            <select
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              className="personality-select"
            >
              {personalities.map(p => (
                <option key={p.key} value={p.key}>{p.emoji} {p.name}</option>
              ))}
            </select>
            <button className="clear-button" onClick={clearConversation} title="Clear conversation">
              🗑️
            </button>
            <button className="close-button" onClick={onToggleVisibility}>
              ✕
            </button>
          </div>
        </div>

        <div className="tutor-modes">
          {modeOptions.map(mode => (
            <button
              key={mode.key}
              className={`mode-button ${activeMode === mode.key ? 'active' : ''}`}
              onClick={() => setActiveMode(mode.key)}
              title={mode.desc}
            >
              <span className="mode-icon">{mode.icon}</span>
              <span className="mode-label">{mode.label}</span>
            </button>
          ))}
        </div>

        <div className="tutor-messages">
          {messages.map(message => (
            <div key={message.id} className={`message ${message.role}`}>
              <div className="message-content">
                {message.content}
              </div>
              <div className="message-time">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message tutor loading">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="tutor-quick-actions">
          <button onClick={() => handleQuickAction('hint')} className="quick-action-button">
            💡 Hint
          </button>
          <button onClick={() => handleQuickAction('explain-again')} className="quick-action-button">
            🔄 Explain Again
          </button>
          <button onClick={() => handleQuickAction('example')} className="quick-action-button">
            🌍 Example
          </button>
          <button onClick={() => handleQuickAction('simpler')} className="quick-action-button">
            📖 Simpler
          </button>
        </div>

        <div className="tutor-input">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={`Ask me to ${activeMode}...`}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
            className="send-button"
          >
            {isLoading ? '⏳' : '📤'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .tutor-bubble {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: #3b82f6;
          color: white;
          padding: 12px 16px;
          border-radius: 24px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          transition: all 0.2s ease;
        }

        .tutor-bubble:hover {
          transform: scale(1.05);
        }

        .bubble-text {
          font-weight: 500;
        }

        .tutor-pane-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.3);
          z-index: 999;
        }

        .tutor-pane.right {
          position: fixed;
          top: 0;
          right: 0;
          width: 380px;
          height: 100vh;
          background: white;
          box-shadow: -4px 0 12px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          display: flex;
          flex-direction: column;
        }

        .tutor-pane.bottom {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 400px;
          background: white;
          box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          display: flex;
          flex-direction: column;
        }

        .tutor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #e5e7eb;
          background: #f8fafc;
        }

        .tutor-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: #1f2937;
        }

        .tutor-icon {
          font-size: 1.2rem;
        }

        .tutor-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .personality-select {
          padding: 4px 8px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.8rem;
          background: white;
        }

        .clear-button, .close-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: background 0.2s ease;
        }

        .clear-button:hover, .close-button:hover {
          background: #e5e7eb;
        }

        .tutor-modes {
          display: flex;
          border-bottom: 1px solid #e5e7eb;
        }

        .mode-button {
          flex: 1;
          padding: 12px 8px;
          border: none;
          background: transparent;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          transition: all 0.2s ease;
          border-bottom: 3px solid transparent;
        }

        .mode-button:hover {
          background: #f9fafb;
        }

        .mode-button.active {
          background: #eff6ff;
          border-bottom-color: #3b82f6;
          color: #3b82f6;
        }

        .mode-icon {
          font-size: 1.2rem;
        }

        .mode-label {
          font-size: 0.75rem;
          font-weight: 500;
        }

        .tutor-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .message {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .message.user {
          align-items: flex-end;
        }

        .message.tutor {
          align-items: flex-start;
        }

        .message-content {
          max-width: 80%;
          padding: 12px 16px;
          border-radius: 16px;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .message.user .message-content {
          background: #3b82f6;
          color: white;
        }

        .message.tutor .message-content {
          background: #f3f4f6;
          color: #374151;
        }

        .message.loading .message-content {
          background: #f9fafb;
          border: 1px dashed #d1d5db;
        }

        .message-time {
          font-size: 0.7rem;
          color: #9ca3af;
          padding: 0 4px;
        }

        .typing-indicator {
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .typing-indicator span {
          width: 6px;
          height: 6px;
          background: #9ca3af;
          border-radius: 50%;
          animation: typing 1.4s infinite;
        }

        .typing-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }

        .tutor-quick-actions {
          display: flex;
          gap: 8px;
          padding: 12px 16px;
          border-top: 1px solid #e5e7eb;
          background: #f8fafc;
        }

        .quick-action-button {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .quick-action-button:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .tutor-input {
          display: flex;
          gap: 8px;
          padding: 16px;
          border-top: 1px solid #e5e7eb;
          background: white;
        }

        .tutor-input input {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid #d1d5db;
          border-radius: 24px;
          font-size: 0.9rem;
          outline: none;
        }

        .tutor-input input:focus {
          border-color: #3b82f6;
        }

        .send-button {
          width: 44px;
          height: 44px;
          border: none;
          border-radius: 50%;
          background: #3b82f6;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s ease;
        }

        .send-button:hover:not(:disabled) {
          background: #2563eb;
        }

        .send-button:disabled {
          background: #d1d5db;
          cursor: not-allowed;
        }

        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-8px);
          }
        }

        @media (max-width: 768px) {
          .tutor-pane.right {
            width: 100vw;
          }

          .tutor-pane.bottom {
            height: 60vh;
          }

          .tutor-modes {
            overflow-x: auto;
          }

          .tutor-quick-actions {
            flex-wrap: wrap;
          }

          .quick-action-button {
            flex: 1 1 calc(50% - 4px);
            min-width: 80px;
          }
        }
      `}</style>
    </>
  );
};

export default PrivateTutorPane;
