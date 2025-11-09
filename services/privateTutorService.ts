// services/privateTutorService.ts

import { GoogleGenAI } from '@google/genai';
import { getOrGenerate } from './cacheService';
import { StudyMaterial } from './contentMemoryService';

export interface TutorMessage {
  role: 'user' | 'tutor';
  content: string;
  timestamp: Date;
}

export interface TutorPersonality {
  name: string;
  style: 'friendly' | 'scholarly' | 'encouraging' | 'wise';
  tone: string;
}

const TUTOR_PERSONALITIES: Record<string, TutorPersonality> = {
  spark: {
    name: 'Professor Spark',
    style: 'friendly',
    tone: 'Enthusiastic and encouraging, uses analogies and stories',
  },
  nova: {
    name: 'Dr. Nova',
    style: 'scholarly',
    tone: 'Academic but accessible, focuses on deep understanding',
  },
  sage: {
    name: 'Sage',
    style: 'wise',
    tone: 'Thoughtful and reflective, asks probing questions',
  },
};

/**
 * Gets tutor response to student question
 */
export async function getTutorResponse(
  question: string,
  context: {
    material?: StudyMaterial;
    currentTopic?: string;
    difficulty?: string;
  },
  userId: string,
  personality: string = 'spark'
): Promise<string> {
  const tutor = TUTOR_PERSONALITIES[personality] || TUTOR_PERSONALITIES.spark;
  
  return getOrGenerate<string>({
    type: 'text',
    topic: 'tutor-response',
    prompt: `${question} - ${context.currentTopic || ''}`,
    userId: userId,
    generatorFn: async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || '' });
      const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const contextPrompt = context.material
        ? `Context: The student is studying "${context.material.analysis.title}" about ${context.material.analysis.topics.join(', ')}.`
        : '';
      
      const prompt = `You are ${tutor.name}, a ${tutor.style} AI tutor. ${tutor.tone}

${contextPrompt}

Student's question: ${question}

Provide a helpful, engaging response that:
- Answers the question clearly
- Uses examples or analogies if helpful
- Encourages further thinking
- Matches your ${tutor.style} personality
- Keeps it concise (2-3 sentences)

Response:`;
      
      const response = await model.generateContent({
        contents: prompt,
      });
      
      return response.text;
    },
  });
}

/**
 * Generates a hint for a stuck student
 */
export async function generateHint(
  question: string,
  topic: string,
  userId: string
): Promise<string> {
  return getOrGenerate<string>({
    type: 'hint',
    topic: topic,
    prompt: question,
    userId: userId,
    generatorFn: async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || '' });
      const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const prompt = `A student is stuck on this question: "${question}"

Topic: ${topic}

Provide a helpful hint that:
- Guides them toward the answer without giving it away
- Encourages them to think
- Is encouraging and supportive
- Is one sentence

Hint:`;
      
      const response = await model.generateContent({
        contents: prompt,
      });
      
      return response.text;
    },
  });
}

/**
 * Generates a creative learning challenge
 */
export async function generateCreativeChallenge(
  topic: string,
  difficulty: string,
  userId: string
): Promise<string> {
  return getOrGenerate<string>({
    type: 'text',
    topic: 'creative-challenge',
    prompt: topic,
    userId: userId,
    generatorFn: async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || '' });
      const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const prompt = `Create a creative learning challenge about "${topic}" for a ${difficulty} level student.

The challenge should:
- Be engaging and fun
- Encourage creative thinking
- Relate to the topic
- Be something the student can do or imagine
- Be 1-2 sentences

Examples:
- "Imagine you're a citizen in the French Revolution—what would you do?"
- "Create a timeline of events as if you were there"
- "Write a letter from the perspective of a historical figure"

Challenge:`;
      
      const response = await model.generateContent({
        contents: prompt,
      });
      
      return response.text;
    },
  });
}

/**
 * Explains a concept using a story or example
 */
export async function explainWithStory(
  concept: string,
  topic: string,
  userId: string
): Promise<string> {
  return getOrGenerate<string>({
    type: 'text',
    topic: 'story-explanation',
    prompt: `${concept} - ${topic}`,
    userId: userId,
    generatorFn: async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || '' });
      const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const prompt = `Explain "${concept}" related to "${topic}" using a story, analogy, or real-world example.

Make it:
- Engaging and memorable
- Easy to understand
- 3-4 sentences
- Relatable

Explanation:`;
      
      const response = await model.generateContent({
        contents: prompt,
      });
      
      return response.text;
    },
  });
}

