// services/essayAssistantService.ts

import { GoogleGenAI } from '@google/genai';
import { getOrGenerate } from './cacheService';
import { ContentAnalysis } from './contentAnalyzerService';

export interface EssayOutline {
  title: string;
  introduction: string;
  bodyParagraphs: Array<{
    topic: string;
    mainPoint: string;
    supportingEvidence: string[];
  }>;
  conclusion: string;
  keyQuotes?: string[];
  suggestedExamples: string[];
}

export interface EssayFeedback {
  clarity: number; // 0-100
  argument: number; // 0-100
  creativity: number; // 0-100
  structure: number; // 0-100
  overallScore: number; // 0-100
  strengths: string[];
  improvements: string[];
  detailedFeedback: string;
}

/**
 * Generates an essay outline from a prompt
 */
export async function generateEssayOutline(
  prompt: string,
  analysis: ContentAnalysis,
  userId: string
): Promise<EssayOutline> {
  return getOrGenerate<EssayOutline>({
    type: 'text',
    topic: 'essay-outline',
    prompt: prompt,
    userId: userId,
    generatorFn: async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || '' });
      const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const systemPrompt = `You are an expert essay writing tutor. Generate a structured outline for this essay prompt.

Essay Prompt: ${prompt}

Context from study material:
- Topics: ${analysis.topics.join(', ')}
- Main Points: ${analysis.mainPoints.join(', ')}
- Difficulty: ${analysis.difficulty}

Create a comprehensive essay outline in JSON format:
{
  "title": "Suggested essay title",
  "introduction": "Introduction paragraph outline",
  "bodyParagraphs": [
    {
      "topic": "Paragraph topic",
      "mainPoint": "Main argument",
      "supportingEvidence": ["evidence1", "evidence2"]
    }
  ],
  "conclusion": "Conclusion outline",
  "keyQuotes": ["quote1", "quote2"],
  "suggestedExamples": ["example1", "example2"]
}`;
      
      const response = await model.generateContent({
        contents: systemPrompt,
        config: {
          responseMimeType: 'application/json',
        },
      });
      
      return JSON.parse(response.text) as EssayOutline;
    },
  });
}

/**
 * Provides step-by-step writing guidance
 */
export async function getWritingGuidance(
  step: 'introduction' | 'body' | 'conclusion',
  outline: EssayOutline,
  currentText: string,
  userId: string
): Promise<string> {
  return getOrGenerate<string>({
    type: 'text',
    topic: 'writing-guidance',
    prompt: `${step} - ${outline.title}`,
    userId: userId,
    generatorFn: async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || '' });
      const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const stepGuidance = {
        introduction: `Write an engaging introduction that:
- Hooks the reader
- Introduces the topic: ${outline.introduction}
- Presents your thesis statement
- Provides context`,
        body: `Write body paragraphs that:
- Each paragraph focuses on: ${outline.bodyParagraphs.map(p => p.topic).join(', ')}
- Support your arguments with evidence
- Use transitions between paragraphs
- Cite examples from your study material`,
        conclusion: `Write a strong conclusion that:
- Summarizes your main points
- Restates your thesis
- Leaves a lasting impression
- ${outline.conclusion}`,
      };
      
      const prompt = `You are a writing tutor. Guide the student on writing the ${step} of their essay.

Outline: ${JSON.stringify(outline, null, 2)}

Current text so far:
${currentText || 'Not started yet'}

${stepGuidance[step]}

Provide specific, actionable guidance (3-4 sentences):`;
      
      const response = await model.generateContent({
        contents: prompt,
      });
      
      return response.text;
    },
  });
}

/**
 * Suggests ideas and examples from study material
 */
export async function suggestIdeasAndExamples(
  topic: string,
  analysis: ContentAnalysis,
  userId: string
): Promise<{
  ideas: string[];
  examples: string[];
  quotes: string[];
}> {
  return getOrGenerate<{ ideas: string[]; examples: string[]; quotes: string[] }>({
    type: 'text',
    topic: 'essay-suggestions',
    prompt: topic,
    userId: userId,
    generatorFn: async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || '' });
      const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const prompt = `Based on this study material, suggest ideas, examples, and quotes for an essay about "${topic}".

Study Material:
- Topics: ${analysis.topics.join(', ')}
- Main Points: ${analysis.mainPoints.join(', ')}
- Keywords: ${analysis.keywords.join(', ')}

Return JSON:
{
  "ideas": ["idea1", "idea2", "idea3"],
  "examples": ["example1", "example2"],
  "quotes": ["quote1", "quote2"]
}`;
      
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
 * Provides feedback on essay
 */
export async function provideEssayFeedback(
  essayText: string,
  prompt: string,
  analysis: ContentAnalysis,
  userId: string
): Promise<EssayFeedback> {
  return getOrGenerate<EssayFeedback>({
    type: 'text',
    topic: 'essay-feedback',
    prompt: `${prompt} - ${essayText.substring(0, 200)}`,
    userId: userId,
    generatorFn: async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || '' });
      const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const prompt = `You are an expert essay grader. Provide detailed feedback on this essay.

Essay Prompt: ${prompt}

Essay:
${essayText}

Context from study material:
- Topics: ${analysis.topics.join(', ')}
- Main Points: ${analysis.mainPoints.join(', ')}

Evaluate and return JSON:
{
  "clarity": 0-100,
  "argument": 0-100,
  "creativity": 0-100,
  "structure": 0-100,
  "overallScore": 0-100,
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"],
  "detailedFeedback": "Detailed paragraph of feedback"
}`;
      
      const response = await model.generateContent({
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });
      
      return JSON.parse(response.text) as EssayFeedback;
    },
  });
}

/**
 * Converts essay writing into a mini-game or dialogue
 */
export async function createEssayStoryMode(
  prompt: string,
  outline: EssayOutline,
  userId: string
): Promise<{
  scenario: string;
  choices: Array<{ text: string; leadsTo: string }>;
}> {
  return getOrGenerate<{ scenario: string; choices: Array<{ text: string; leadsTo: string }> }>({
    type: 'text',
    topic: 'essay-story-mode',
    prompt: prompt,
    userId: userId,
    generatorFn: async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || '' });
      const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const prompt = `Create an interactive story mode for essay writing.

Essay Prompt: ${prompt}
Outline: ${JSON.stringify(outline, null, 2)}

Create a scenario where the student "discovers" their essay arguments through dialogue with a tutor or character.

Return JSON:
{
  "scenario": "A narrative setting up the essay writing as a discovery journey",
  "choices": [
    {
      "text": "Choice that leads to exploring an argument",
      "leadsTo": "What happens when this choice is made"
    }
  ]
}`;
      
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

