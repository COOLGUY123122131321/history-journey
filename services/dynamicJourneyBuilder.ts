// services/dynamicJourneyBuilder.ts

import { Journey, Scene, Question, QuestionType } from '../types';
import { ContentAnalysis } from './contentAnalyzerService';
import { GoogleGenAI } from '@google/genai';
import { getOrGenerate } from './cacheService';

export interface StudyJourney extends Journey {
  sourceMaterialId: string;
  analysis: ContentAnalysis;
  progress: {
    completedScenes: number;
    totalScenes: number;
    score: number;
    timeSpent: number;
  };
}

/**
 * Builds a dynamic learning journey from analyzed content
 */
export async function buildStudyJourney(
  contentText: string,
  analysis: ContentAnalysis,
  userId: string,
  sourceMaterialId: string
): Promise<StudyJourney> {
  const journeyId = `study_${sourceMaterialId}_${Date.now()}`;
  
  // Generate journey structure based on analysis
  const journeyStructure = await generateJourneyStructure(analysis, contentText, userId);
  
  const journey: StudyJourney = {
    id: journeyId,
    name: analysis.title,
    description: analysis.summary,
    startingPrompt: generateStartingPrompt(analysis),
    sourceMaterialId,
    analysis,
    progress: {
      completedScenes: 0,
      totalScenes: journeyStructure.sceneCount,
      score: 0,
      timeSpent: 0,
    },
  };
  
  return journey;
}

/**
 * Generates journey structure based on content analysis
 */
async function generateJourneyStructure(
  analysis: ContentAnalysis,
  contentText: string,
  userId: string
): Promise<{ sceneCount: number; structure: string }> {
  return getOrGenerate<{ sceneCount: number; structure: string }>({
    type: 'text',
    topic: 'journey-structure',
    prompt: `${analysis.title} - ${analysis.topics.join(', ')}`,
    userId: userId,
    generatorFn: async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || '' });
      const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const prompt = `Based on this content analysis, create a learning journey structure:

Title: ${analysis.title}
Topics: ${analysis.topics.join(', ')}
Difficulty: ${analysis.difficulty}
Journey Type: ${analysis.suggestedJourneyType}
Estimated Time: ${analysis.estimatedTime} minutes

Main Points to Cover:
${analysis.mainPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Create a JSON structure with:
{
  "sceneCount": number of interactive scenes needed (3-8),
  "structure": "brief description of the journey flow"
}

The journey should be engaging, educational, and match the ${analysis.suggestedJourneyType} journey type.`;
      
      const response = await model.generateContent({
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });
      
      return JSON.parse(response.text);
    },
  });
}

/**
 * Generates starting prompt for the journey
 */
function generateStartingPrompt(analysis: ContentAnalysis): string {
  const journeyTypePrompts = {
    timeline: `Welcome! You're about to embark on a journey through time, exploring ${analysis.title}.`,
    map: `Welcome, explorer! You're about to discover ${analysis.title} through an interactive map adventure.`,
    character: `Welcome! You're about to meet historical figures and experience ${analysis.title} through their eyes.`,
    concept: `Welcome! You're about to dive deep into the concepts behind ${analysis.title}.`,
    mixed: `Welcome! You're about to explore ${analysis.title} through an interactive learning adventure.`,
  };
  
  return journeyTypePrompts[analysis.suggestedJourneyType] || journeyTypePrompts.mixed;
}

/**
 * Generates scenes for the journey based on content
 */
export async function generateJourneyScenes(
  journey: StudyJourney,
  contentText: string,
  userId: string
): Promise<Scene[]> {
  const scenes: Scene[] = [];
  const mainPoints = journey.analysis.mainPoints;
  
  // Generate one scene per main point
  for (let i = 0; i < mainPoints.length && i < 8; i++) {
    const scene = await generateScene(
      mainPoints[i],
      journey,
      i + 1,
      mainPoints.length,
      contentText,
      userId
    );
    scenes.push(scene);
  }
  
  return scenes;
}

/**
 * Generates a single scene based on a main point
 */
async function generateScene(
  mainPoint: string,
  journey: StudyJourney,
  sceneNumber: number,
  totalScenes: number,
  contentText: string,
  userId: string
): Promise<Scene> {
  return getOrGenerate<Scene>({
    type: 'scene',
    topic: journey.id,
    prompt: `${mainPoint} - Scene ${sceneNumber}`,
    userId: userId,
    generatorFn: async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || '' });
      const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const prompt = `Create an interactive scene for a learning journey about "${journey.name}".

Scene ${sceneNumber} of ${totalScenes}
Focus: ${mainPoint}
Journey Type: ${journey.analysis.suggestedJourneyType}
Difficulty: ${journey.analysis.difficulty}

Create a scene that:
- Teaches about "${mainPoint}" in an engaging way
- Matches the ${journey.analysis.suggestedJourneyType} journey type
- Is appropriate for ${journey.analysis.difficulty} level
- Includes 2-3 choices for the student to make

Return JSON:
{
  "scenario": "A 2-3 sentence narrative setting up the scene",
  "choices": [
    { "text": "Choice 1" },
    { "text": "Choice 2" },
    { "text": "Choice 3" }
  ]
}`;
      
      const response = await model.generateContent({
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });
      
      return JSON.parse(response.text) as Scene;
    },
  });
}

/**
 * Generates quiz questions based on content
 */
export async function generateStudyQuestions(
  journey: StudyJourney,
  contentText: string,
  userId: string
): Promise<Question[]> {
  const questions: Question[] = [];
  const mainPoints = journey.analysis.mainPoints;
  
  // Generate 2-3 questions per main point
  for (const point of mainPoints.slice(0, 5)) {
    const pointQuestions = await generateQuestionsForPoint(
      point,
      journey,
      contentText,
      userId
    );
    questions.push(...pointQuestions);
  }
  
  return questions;
}

/**
 * Generates questions for a specific point
 */
async function generateQuestionsForPoint(
  point: string,
  journey: StudyJourney,
  contentText: string,
  userId: string
): Promise<Question[]> {
  return getOrGenerate<Question[]>({
    type: 'question',
    topic: journey.id,
    prompt: `Questions about: ${point}`,
    userId: userId,
    generatorFn: async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || '' });
      const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const prompt = `Create 2-3 quiz questions about "${point}" related to "${journey.name}".

Difficulty: ${journey.analysis.difficulty}

Return JSON array:
[
  {
    "type": "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_EXPLANATION",
    "questionText": "The question",
    "explanation": "Why this answer is correct",
    "options": ["option1", "option2", "option3", "option4"], // Only for MULTIPLE_CHOICE
    "correctAnswer": "the correct answer"
  }
]`;
      
      const response = await model.generateContent({
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });
      
      return JSON.parse(response.text) as Question[];
    },
  });
}

