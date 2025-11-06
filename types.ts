export interface User {
  uid: string;
  displayName: string;
  photoURL: string;
}

export interface Journey {
  id: string;
  name: string;
  description: string;
  cardImage: string;
  startingPrompt: string;
}

export interface Choice {
  text: string;
}

export interface Scene {
  scenario: string;
  choices: Choice[];
}

export interface Outcome {
  outcomeText: string;
  mentorInsight: string;
  resourceChanges: Partial<Resources>;
  question: Question;
  nextScene: Scene;
  isGameOver: boolean;
  gameOverReason?: string;
}

export interface Resources {
  health: number;
  food: number;
  money: number;
  influence: number;
}

export interface GameState {
  currentJourneyId: string | null;
  currentScene: Scene | null;
  resources: Resources;
  isGameOver: boolean;
  gameOverReason?: string;
}

export interface Progress {
  xp: number;
  level: number;
  journeys: {
    [journeyId: string]: {
      completed: boolean;
      highScore?: number;
    };
  };
}

export type TutorMood = 'happy' | 'sad' | 'neutral' | 'wise';

// FIX: Added missing type definitions and exports
export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  MATCHING = 'MATCHING',
  ORDERING = 'ORDERING',
  IMAGE_RECOGNITION = 'IMAGE_RECOGNITION',
  FILL_IN_THE_BLANK = 'FILL_IN_THE_BLANK',
  CAUSE_AND_EFFECT = 'CAUSE_AND_EFFECT',
  SHORT_EXPLANATION = 'SHORT_EXPLANATION',
}

export interface BaseQuestion {
  type: QuestionType;
  questionText: string;
  explanation: string;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: QuestionType.MULTIPLE_CHOICE;
  options: string[];
  correctAnswer: string;
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: QuestionType.TRUE_FALSE;
  correctAnswer: boolean;
}

export interface MatchingItem {
  id: string;
  text: string;
}

export interface MatchingPair {
  promptId: string;
  answerId: string;
}

export interface MatchingQuestion extends BaseQuestion {
  type: QuestionType.MATCHING;
  prompts: MatchingItem[];
  answers: MatchingItem[];
  correctPairs: MatchingPair[];
}

export interface OrderingItem {
  id: string;
  text: string;
}

export interface OrderingQuestion extends BaseQuestion {
  type: QuestionType.ORDERING;
  items: OrderingItem[];
  correctOrder: string[];
}

export interface ImageRecognitionQuestion extends BaseQuestion {
  type: QuestionType.IMAGE_RECOGNITION;
  imageUrl: string;
  imagePrompt: string;
  options: string[];
  correctAnswer: string;
}

export interface FillInTheBlankQuestion extends BaseQuestion {
  type: QuestionType.FILL_IN_THE_BLANK;
  correctAnswer: string;
}

export interface CauseAndEffectQuestion extends BaseQuestion {
  type: QuestionType.CAUSE_AND_EFFECT;
  options: string[];
  correctAnswer: string;
}

export interface ShortExplanationQuestion extends BaseQuestion {
  type: QuestionType.SHORT_EXPLANATION;
  keyConcepts: string[];
}

export type Question =
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | MatchingQuestion
  | OrderingQuestion
  | ImageRecognitionQuestion
  | FillInTheBlankQuestion
  | CauseAndEffectQuestion
  | ShortExplanationQuestion;

export interface TimelineEvent {
  date: string;
  description: string;
}

export interface Lesson {
  id: number;
  title: string;
  explanation: string;
  imageUrl: string;
  imagePrompt: string;
  timelineEvents?: TimelineEvent[];
  questions: Question[];
}

export interface MapNode {
    lessonId: number;
    title: string;
    x: number;
    y: number;
    nodeType?: 'lesson' | 'quiz';
}

export interface RewardNodePosition {
    id: string;
    x: number;
    y: number;
    requiredLessonId: number;
}

export interface Topic {
  id: string;
  name: string;
  backgroundImage: string;
  nodes: MapNode[];
  rewards?: RewardNodePosition[];
  lessons: Lesson[];
}

// Caching System Types
export type CacheContentType = 'scene' | 'outcome' | 'video' | 'hint' | 'feedback' | 'tts' | 'text' | 'image' | 'quiz';

export interface CachedContent<T> {
  id?: string;
  type: CacheContentType;
  topic: string; 
  prompt: string;
  content?: T;
  url?: string;
  createdAt: any; // Firestore Timestamp
  createdBy: string;
  views: number;
  likedBy: string[];
}