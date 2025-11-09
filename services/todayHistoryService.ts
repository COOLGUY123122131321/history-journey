// services/todayHistoryService.ts

import { TodayHistoryEvent, TodayHistory } from '../types';
import { GoogleGenAI } from '@google/genai';
import { getOrGenerate } from './cacheService';

export interface TodayHistoryConfig {
  userId: string;
  currentTopics?: string[];
  preferredDifficulty?: 'beginner' | 'intermediate' | 'advanced';
  streakCount?: number;
}

/**
 * Get today's historical events
 */
export async function getTodayHistory(config: TodayHistoryConfig): Promise<TodayHistory> {
  const today = new Date();
  const dateKey = today.toISOString().split('T')[0]; // YYYY-MM-DD format

  return getOrGenerate<TodayHistory>({
    type: 'text',
    topic: 'today-history',
    prompt: `${dateKey}-${config.userId}`,
    userId: config.userId,
    generatorFn: async () => {
      const events = await generateTodayEvents(dateKey, config);
      const streak = config.streakCount || 0;

      return {
        date: dateKey,
        events,
        streak,
        lastCompletedDate: undefined,
      };
    },
  });
}

/**
 * Generate historical events for a specific date
 */
async function generateTodayEvents(dateKey: string, config: TodayHistoryConfig): Promise<TodayHistoryEvent[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || '' });
  const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

  // Parse the date to get month and day
  const date = new Date(dateKey);
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const prompt = `Generate 3-6 significant historical events that happened on ${month}/${day} throughout history.

Context:
- Current topics the student is studying: ${config.currentTopics?.join(', ') || 'General history'}
- Preferred difficulty: ${config.preferredDifficulty || 'intermediate'}
- Include events from different time periods and regions when possible
- Prioritize events related to current topics if applicable

Return JSON array with events in this format:
[
  {
    "year": 1066,
    "title": "Battle of Hastings",
    "summary": "William the Conqueror defeats Harold Godwinson, marking the Norman conquest of England",
    "tags": ["medieval", "england", "battle", "conquest"],
    "imageUrl": "optional_image_url",
    "isCompleted": false
  }
]

Guidelines:
- Mix different historical periods (ancient, medieval, modern, contemporary)
- Include diverse geographical regions
- Keep summaries to 1-2 sentences
- Add relevant tags for categorization
- Ensure educational value and accuracy`;

  const response = await model.generateContent({
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    },
  });

  const events = JSON.parse(response.text) as Omit<TodayHistoryEvent, 'miniJourneyId'>[];

  return events.map(event => ({
    ...event,
    miniJourneyId: undefined,
  }));
}

/**
 * Mark an event as completed and update streak
 */
export async function completeTodayEvent(
  userId: string,
  eventYear: number,
  eventTitle: string
): Promise<{ newStreak: number; xpEarned: number }> {
  // In a real implementation, this would update Firestore
  // For now, return mock data
  const xpEarned = 25; // Base XP for completing a daily event
  const newStreak = 1; // This would be calculated based on consecutive days

  return { newStreak, xpEarned };
}

/**
 * Create a mini-journey from a historical event
 */
export async function createMiniJourneyFromEvent(
  event: TodayHistoryEvent,
  userId: string
): Promise<string> {
  // This would generate a short 5-7 minute journey
  // For now, return a mock journey ID
  return `mini-journey-${event.year}-${Date.now()}`;
}

/**
 * Get streak information for the user
 */
export async function getUserStreak(userId: string): Promise<{
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate?: string;
}> {
  // In a real implementation, this would query Firestore
  // For now, return mock data
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastCompletedDate: undefined,
  };
}

/**
 * Generate a "surprise me" random historical event
 */
export async function getSurpriseEvent(userId: string): Promise<TodayHistoryEvent> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || '' });
  const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `Generate a single interesting historical event from a random date.

Return JSON object:
{
  "year": 1492,
  "title": "Discovery of the New World",
  "summary": "Christopher Columbus reaches the Americas, opening the Age of Exploration",
  "tags": ["exploration", "americas", "voyage"],
  "imageUrl": null,
  "isCompleted": false
}`;

  const response = await model.generateContent({
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    },
  });

  return JSON.parse(response.text) as TodayHistoryEvent;
}
