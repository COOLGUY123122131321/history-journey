import React from 'react';
import { Question, QuestionType, User } from '../../types';
import { soundService } from '../../services/soundService';
import MultipleChoiceQuestion from './questions/MultipleChoiceQuestion';
import TrueFalseQuestion from './questions/TrueFalseQuestion';
import MatchingQuestion from './questions/MatchingQuestion';
import OrderingQuestion from './questions/OrderingQuestion';
import ImageRecognitionQuestion from './questions/ImageRecognitionQuestion';
import FillInTheBlankQuestion from './questions/FillInTheBlankQuestion';
import CauseAndEffectQuestion from './questions/CauseAndEffectQuestion';
import ShortExplanationQuestion from './questions/ShortExplanationQuestion';


interface QuestionRendererProps {
  question: Question;
  onAnswer: (isCorrect: boolean, question: Question) => void;
  onContinue: () => void;
  user: User;
}

const QuestionRenderer: React.FC<QuestionRendererProps> = ({ question, onAnswer, onContinue, user }) => {
  const handleAnswer = (isCorrect: boolean) => {
    if (isCorrect) {
      soundService.playCorrect();
    } else {
      soundService.playIncorrect();
    }
    onAnswer(isCorrect, question);
  };
  
  // FIX: Render components inside the switch statement to allow TypeScript to correctly narrow the 'question' type for each case.
  const props = { onAnswer: handleAnswer, onContinue, user };

  switch (question.type) {
    case QuestionType.MULTIPLE_CHOICE:
      return <MultipleChoiceQuestion question={question} {...props} />;
    case QuestionType.TRUE_FALSE:
      return <TrueFalseQuestion question={question} {...props} />;
    case QuestionType.MATCHING:
        return <MatchingQuestion question={question} {...props} />;
    case QuestionType.ORDERING:
        return <OrderingQuestion question={question} {...props} />;
    case QuestionType.IMAGE_RECOGNITION:
        return <ImageRecognitionQuestion question={question} {...props} />;
    case QuestionType.FILL_IN_THE_BLANK:
        return <FillInTheBlankQuestion question={question} {...props} />;
    case QuestionType.CAUSE_AND_EFFECT:
        return <CauseAndEffectQuestion question={question} {...props} />;
    case QuestionType.SHORT_EXPLANATION:
        return <ShortExplanationQuestion question={question} {...props} />;
    default:
      return <div>Unsupported question type</div>;
  }
};

export default QuestionRenderer;