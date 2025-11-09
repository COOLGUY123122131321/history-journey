// services/contentAnalyzerService.ts

import { GoogleGenAI } from '@google/genai';
import { getOrGenerate } from './cacheService';

export interface ContentAnalysis {
  title: string;
  topics: string[];
  keywords: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  subject: string; // e.g., "History", "Science", "Literature"
  mainPoints: string[];
  intent: 'study' | 'assignment' | 'essay' | 'presentation' | 'review';
  estimatedTime: number; // minutes
  suggestedJourneyType: 'timeline' | 'map' | 'character' | 'concept' | 'mixed';
  summary: string;
}

/**
 * Analyzes uploaded content using AI
 */
export async function analyzeContent(
  text: string,
  fileType: 'pdf' | 'image' | 'text' | 'audio' | 'word',
  userId: string
): Promise<ContentAnalysis> {
  const prompt = buildAnalysisPrompt(text, fileType);
  
  return getOrGenerate<ContentAnalysis>({
    type: 'text',
    topic: 'content-analysis',
    prompt: text.substring(0, 1000), // Use first 1000 chars as cache key
    userId: userId,
    generatorFn: async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || '' });
      const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const response = await model.generateContent({
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });
      
      const analysis = JSON.parse(response.text) as ContentAnalysis;
      
      // Validate and set defaults
      return {
        title: analysis.title || 'Untitled Content',
        topics: analysis.topics || [],
        keywords: analysis.keywords || [],
        difficulty: analysis.difficulty || 'intermediate',
        subject: analysis.subject || 'General',
        mainPoints: analysis.mainPoints || [],
        intent: analysis.intent || 'study',
        estimatedTime: analysis.estimatedTime || 30,
        suggestedJourneyType: analysis.suggestedJourneyType || 'mixed',
        summary: analysis.summary || '',
      };
    },
  });
}

/**
 * Builds analysis prompt for AI
 */
function buildAnalysisPrompt(text: string, fileType: string): string {
  return `Analyze the following ${fileType} content and provide a structured analysis in JSON format.

Content:
${text.substring(0, 10000)} // Limit to first 10k chars

Please analyze and return a JSON object with the following structure:
{
  "title": "A concise title for this content",
  "topics": ["topic1", "topic2", "topic3"], // Main topics covered
  "keywords": ["keyword1", "keyword2"], // Important keywords
  "difficulty": "beginner" | "intermediate" | "advanced",
  "subject": "History" | "Science" | "Literature" | etc.,
  "mainPoints": ["point1", "point2", "point3"], // Key learning points
  "intent": "study" | "assignment" | "essay" | "presentation" | "review",
  "estimatedTime": 30, // Estimated study time in minutes
  "suggestedJourneyType": "timeline" | "map" | "character" | "concept" | "mixed",
  "summary": "A 2-3 sentence summary of the content"
}

Focus on:
- Identifying the main subject and topics
- Determining appropriate difficulty level
- Detecting if this is an assignment/essay prompt
- Suggesting the best journey type for learning this material
- Extracting key points that should be taught`;
}

/**
 * Extracts text from image using OCR (via Gemini Vision)
 */
export async function extractTextFromImage(
  imageUrl: string,
  userId: string
): Promise<string> {
  return getOrGenerate<string>({
    type: 'text',
    topic: 'ocr-extraction',
    prompt: imageUrl,
    userId: userId,
    generatorFn: async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || '' });
      const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      // Fetch image and convert to base64
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64Image = btoa(binary);
      const mimeType = blob.type || 'image/jpeg';
      
      const result = await model.generateContent({
        contents: [{
          parts: [
            { text: 'Extract all text from this image. Return only the extracted text, no explanations.' },
            {
              inlineData: {
                data: base64Image,
                mimeType: mimeType,
              },
            },
          ],
        }],
      });
      
      return result.response.text();
    },
  });
}

/**
 * Transcribes audio to text (using Gemini or external service)
 */
export async function transcribeAudio(
  audioUrl: string,
  userId: string
): Promise<string> {
  // For now, we'll use a placeholder
  // In production, integrate with Whisper API or similar
  return getOrGenerate<string>({
    type: 'text',
    topic: 'audio-transcription',
    prompt: audioUrl,
    userId: userId,
    generatorFn: async () => {
      // TODO: Implement audio transcription
      // This could use OpenAI Whisper API or Google Speech-to-Text
      throw new Error('Audio transcription not yet implemented. Please use text input.');
    },
  });
}

/**
 * Detects if content is an assignment/essay prompt
 */
export async function detectIntent(
  text: string,
  userId: string
): Promise<'study' | 'assignment' | 'essay' | 'presentation'> {
  const analysis = await analyzeContent(text, 'text', userId);
  return analysis.intent as 'study' | 'assignment' | 'essay' | 'presentation';
}

