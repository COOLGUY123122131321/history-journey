// services/openaiTtsService.ts

import { getOrGenerate } from './cacheService';
import { GoogleGenAI } from '@google/genai';

/**
 * OpenAI Text-to-Speech Service
 * 
 * Provides high-quality TTS using OpenAI's TTS API.
 * Audio files are cached and stored in Firebase Storage for reuse.
 * 
 * Setup:
 * 1. Get an OpenAI API key from https://platform.openai.com/api-keys
 * 2. Set OPENAI_API_KEY in your .env.local file
 */

interface OpenAITTSConfig {
  model?: 'tts-1' | 'tts-1-hd';
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  speed?: number; // 0.25 to 4.0
}

const DEFAULT_CONFIG: OpenAITTSConfig = {
  model: 'tts-1',
  voice: 'alloy',
  speed: 1.0,
};

/**
 * Generates TTS audio using OpenAI TTS API
 * 
 * @param text The text to convert to speech
 * @param userId The user ID for caching purposes
 * @param config Optional TTS configuration (voice, model, speed)
 * @returns Promise resolving to base64 audio data or null if generation fails
 */
export async function generateOpenAITTS(
  text: string,
  userId: string,
  config: OpenAITTSConfig = {}
): Promise<string | null> {
  if (!text || text.trim().length === 0) {
    return null;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('[OpenAI TTS] API key not found. Please set OPENAI_API_KEY in .env.local');
    return null;
  }

  const ttsConfig = { ...DEFAULT_CONFIG, ...config };

  // Use the existing caching system to store and retrieve TTS audio
  return getOrGenerate<string>({
    type: 'tts',
    topic: 'openai-tts',
    prompt: text,
    userId: userId,
    mediaOptions: {
      path: `tts/openai/${text.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}_${Date.now()}.mp3`,
      dataType: 'base64',
      mimeType: 'audio/mpeg',
    },
    generatorFn: async () => {
      try {
        const response = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: ttsConfig.model,
            voice: ttsConfig.voice,
            input: text,
            speed: ttsConfig.speed,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[OpenAI TTS] API error:', response.status, errorText);
          
          if (response.status === 401) {
            throw new Error('OpenAI API key is invalid. Please check your OPENAI_API_KEY in .env.local');
          } else if (response.status === 429) {
            throw new Error('OpenAI TTS API rate limit exceeded. Please check your usage limits.');
          }
          
          throw new Error(`OpenAI TTS API error: ${response.status} - ${errorText}`);
        }

        // OpenAI returns audio as a blob, convert to base64
        const audioBlob = await response.blob();
        const arrayBuffer = await audioBlob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Convert Uint8Array to base64 safely
        let binary = '';
        const len = uint8Array.length;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(uint8Array[i]);
        }
        const base64 = btoa(binary);

        if (!base64 || base64.length < 100) {
          console.error('[OpenAI TTS] Invalid audio data received');
          return '';
        }

        return base64;
      } catch (error: any) {
        const errorMessage = error?.message || error?.toString() || '';
        console.error('[OpenAI TTS] Generation failed:', errorMessage);
        
        // Don't throw - return empty string to allow fallback
        return '';
      }
    },
  });
}

/**
 * Enhanced TTS function that uses Gemini to refine the text before converting to speech
 * 
 * This function:
 * 1. Uses Gemini to generate/refine the text for better speech quality
 * 2. Converts the refined text to speech using OpenAI TTS
 * 
 * @param textPrompt The original text or prompt to convert to speech
 * @param userId The user ID for caching purposes
 * @param options Optional configuration
 * @returns Promise resolving to base64 audio data or null if generation fails
 */
export async function generateAndSpeak(
  textPrompt: string,
  userId: string,
  options: {
    refineWithGemini?: boolean;
    geminiModel?: string;
    openaiConfig?: OpenAITTSConfig;
  } = {}
): Promise<string | null> {
  if (!textPrompt || textPrompt.trim().length === 0) {
    return null;
  }

  const { refineWithGemini = false, geminiModel = 'gemini-1.5-pro-latest', openaiConfig = {} } = options;

  try {
    let finalText = textPrompt;

    // Step 1: Optionally refine text with Gemini
    if (refineWithGemini) {
      const geminiApiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      if (geminiApiKey) {
        try {
          const gemini = new GoogleGenAI({ apiKey: geminiApiKey });
          const model = gemini.getGenerativeModel({ model: geminiModel });
          
          const prompt = `Rewrite the following text to be natural and suitable for speech narration. Keep it concise and engaging. Do not add any explanations, just return the improved text:\n\n${textPrompt}`;
          
          const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
          });

          const refinedText = result.response.text();
          if (refinedText && refinedText.trim().length > 0) {
            finalText = refinedText.trim();
            console.log('🧠 Gemini refined text:', finalText);
          }
        } catch (error) {
          console.warn('[TTS] Gemini text refinement failed, using original text:', error);
          // Continue with original text if Gemini fails
        }
      }
    }

    // Step 2: Convert to speech using OpenAI TTS
    return await generateOpenAITTS(finalText, userId, openaiConfig);
  } catch (error: any) {
    console.error('[Enhanced TTS] Generation failed:', error);
    return null;
  }
}

/**
 * Available OpenAI TTS voices
 */
export const OPENAI_TTS_VOICES = {
  'alloy': 'Neutral, balanced voice',
  'echo': 'Clear, confident voice',
  'fable': 'Warm, expressive voice',
  'onyx': 'Deep, authoritative voice',
  'nova': 'Bright, energetic voice',
  'shimmer': 'Soft, gentle voice',
} as const;

