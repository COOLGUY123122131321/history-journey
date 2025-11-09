// services/googleCloudTtsService.ts

import { getOrGenerate } from './cacheService';

/**
 * Google Cloud Text-to-Speech Service
 * 
 * Provides high-quality, stable TTS using Google Cloud Text-to-Speech API.
 * Audio files are cached and stored in Firebase Storage for reuse.
 * 
 * Setup:
 * 1. Enable Text-to-Speech API in Google Cloud Console
 * 2. Create an API key with Text-to-Speech permissions
 * 3. Set GOOGLE_CLOUD_TTS_API_KEY in your .env.local file
 */

interface GoogleCloudTTSConfig {
  languageCode?: string;
  voiceName?: string;
  audioEncoding?: 'MP3' | 'LINEAR16' | 'OGG_OPUS';
  speakingRate?: number;
  pitch?: number;
}

const DEFAULT_CONFIG: GoogleCloudTTSConfig = {
  languageCode: 'en-US',
  voiceName: 'en-US-Standard-C',
  audioEncoding: 'MP3',
  speakingRate: 1.0,
  pitch: 0.0,
};

/**
 * Generates TTS audio using Google Cloud Text-to-Speech API
 * 
 * @param text The text to convert to speech
 * @param userId The user ID for caching purposes
 * @param config Optional TTS configuration (voice, language, etc.)
 * @returns Promise resolving to base64 audio data or null if generation fails
 */
export async function generateGoogleCloudTTS(
  text: string,
  userId: string,
  config: GoogleCloudTTSConfig = {}
): Promise<string | null> {
  if (!text || text.trim().length === 0) {
    return null;
  }

  const apiKey = process.env.GOOGLE_CLOUD_TTS_API_KEY;
  if (!apiKey) {
    console.error('[Google Cloud TTS] API key not found. Please set GOOGLE_CLOUD_TTS_API_KEY in .env.local');
    return null;
  }

  const ttsConfig = { ...DEFAULT_CONFIG, ...config };

  // Use the existing caching system to store and retrieve TTS audio
  return getOrGenerate<string>({
    type: 'tts',
    topic: 'google-cloud-tts',
    prompt: text,
    userId: userId,
    mediaOptions: {
      path: `tts/google-cloud/${text.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}_${Date.now()}.mp3`,
      dataType: 'base64',
      mimeType: 'audio/mpeg',
    },
    generatorFn: async () => {
      try {
        const response = await fetch(
          `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              input: { text },
              voice: {
                languageCode: ttsConfig.languageCode,
                name: ttsConfig.voiceName,
              },
              audioConfig: {
                audioEncoding: ttsConfig.audioEncoding,
                speakingRate: ttsConfig.speakingRate,
                pitch: ttsConfig.pitch,
              },
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[Google Cloud TTS] API error:', response.status, errorText);
          
          if (response.status === 403) {
            throw new Error('Google Cloud TTS API key is invalid or missing permissions. Please check your API key and enable Text-to-Speech API in Google Cloud Console.');
          } else if (response.status === 429) {
            throw new Error('Google Cloud TTS API quota exceeded. Please check your usage limits.');
          }
          
          throw new Error(`Google Cloud TTS API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const audioBase64 = data.audioContent;

        if (!audioBase64) {
          console.error('[Google Cloud TTS] Response missing audioContent:', data);
          return '';
        }

        // Validate base64 data
        const cleanBase64 = audioBase64.replace(/^data:.*;base64,/, '').replace(/\s+/g, '');
        if (!cleanBase64 || cleanBase64.length < 100) {
          console.error('[Google Cloud TTS] Invalid audio data received');
          return '';
        }

        return cleanBase64;
      } catch (error: any) {
        const errorMessage = error?.message || error?.toString() || '';
        console.error('[Google Cloud TTS] Generation failed:', errorMessage);
        
        // Don't throw - return empty string to allow fallback
        return '';
      }
    },
  });
}

/**
 * Available Google Cloud TTS voices for English (US)
 * You can use any of these voice names in the config
 */
export const GOOGLE_CLOUD_TTS_VOICES = {
  'en-US-Standard-A': 'Female voice',
  'en-US-Standard-B': 'Male voice',
  'en-US-Standard-C': 'Female voice',
  'en-US-Standard-D': 'Male voice',
  'en-US-Standard-E': 'Female voice',
  'en-US-Standard-F': 'Female voice',
  'en-US-Standard-G': 'Female voice',
  'en-US-Standard-H': 'Female voice',
  'en-US-Standard-I': 'Male voice',
  'en-US-Standard-J': 'Male voice',
  'en-US-Wavenet-A': 'Female voice (WaveNet)',
  'en-US-Wavenet-B': 'Male voice (WaveNet)',
  'en-US-Wavenet-C': 'Female voice (WaveNet)',
  'en-US-Wavenet-D': 'Male voice (WaveNet)',
  'en-US-Wavenet-E': 'Female voice (WaveNet)',
  'en-US-Wavenet-F': 'Female voice (WaveNet)',
  'en-US-Wavenet-G': 'Female voice (WaveNet)',
  'en-US-Wavenet-H': 'Female voice (WaveNet)',
  'en-US-Wavenet-I': 'Male voice (WaveNet)',
  'en-US-Wavenet-J': 'Male voice (WaveNet)',
} as const;

