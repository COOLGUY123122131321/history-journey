import { generateGoogleCloudTTS } from './googleCloudTtsService';
import { generateOpenAITTS, generateAndSpeak } from './openaiTtsService';
import { generateTtsAudio } from './geminiService';

interface TtsRequest {
  text: string;
  userId: string;
  resolve: (value: string | null) => void;
  reject: (reason?: any) => void;
  options?: {
    refineWithGemini?: boolean;
    useOpenAI?: boolean;
  };
}

const queue: TtsRequest[] = [];
let isProcessing = false;

// Google Cloud TTS has higher rate limits, but we'll use a conservative interval
// Gemini API TTS has a rate limit of 10 requests per minute.
// Processing one request every 7 seconds (60s / 10 = 6s base) provides a safe buffer.
const REQUEST_INTERVAL = 7000; 

// Check if various TTS services are available
const isGoogleCloudTTSAvailable = (): boolean => {
  return !!process.env.GOOGLE_CLOUD_TTS_API_KEY;
};

const isOpenAITTSAvailable = (): boolean => {
  return !!process.env.OPENAI_API_KEY;
};

const processQueue = async () => {
  if (queue.length === 0) {
    isProcessing = false;
    return;
  }

  isProcessing = true;
  const { text, userId, resolve, reject, options = {} } = queue.shift()!;

  try {
    let audioData: string | null = null;
    
    // If OpenAI is explicitly requested or refineWithGemini is true, use enhanced OpenAI TTS
    if (options.useOpenAI || options.refineWithGemini) {
      if (isOpenAITTSAvailable()) {
        audioData = await generateAndSpeak(text, userId, {
          refineWithGemini: options.refineWithGemini,
          openaiConfig: {},
        });
      }
    }
    
    // Try Google Cloud TTS (higher quality, more stable)
    if (!audioData && isGoogleCloudTTSAvailable()) {
      audioData = await generateGoogleCloudTTS(text, userId);
    }
    
    // Try OpenAI TTS (if not already tried)
    if (!audioData && isOpenAITTSAvailable() && !options.useOpenAI && !options.refineWithGemini) {
      audioData = await generateOpenAITTS(text, userId);
    }
    
    // Gemini TTS is disabled - it's not reliably supported
    // If no TTS service is available, log a helpful message
    if (!audioData) {
      const availableServices = [];
      if (isOpenAITTSAvailable()) availableServices.push('OpenAI TTS');
      if (isGoogleCloudTTSAvailable()) availableServices.push('Google Cloud TTS');
      
      if (availableServices.length === 0) {
        console.warn('[TTS] No TTS service available. Please configure OPENAI_API_KEY or GOOGLE_CLOUD_TTS_API_KEY in .env.local');
      } else {
        console.warn(`[TTS] TTS generation failed. Available services: ${availableServices.join(', ')}`);
      }
    }
    
    resolve(audioData);
  } catch (error) {
    console.error(`TTS Service failed for text: "${text}"`, error);
    reject(error);
  } finally {
    // Wait for the interval before processing the next item in the queue.
    setTimeout(processQueue, REQUEST_INTERVAL);
  }
};

export const ttsService = {
  /**
   * Adds a text-to-speech request to a queue to be processed sequentially.
   * This prevents API rate limit errors by avoiding bursts of concurrent requests.
   * 
   * Priority order:
   * 1. OpenAI TTS (if explicitly requested or refineWithGemini is true)
   * 2. Google Cloud TTS (if available)
   * 3. OpenAI TTS (if available)
   * 
   * Note: Gemini TTS is disabled as it's not reliably supported.
   * Please configure OPENAI_API_KEY or GOOGLE_CLOUD_TTS_API_KEY for TTS functionality.
   * 
   * @param text The text to be converted to speech.
   * @param userId The ID of the user requesting the TTS.
   * @param options Optional configuration:
   *   - refineWithGemini: Use Gemini to refine text before TTS (requires OpenAI API key)
   *   - useOpenAI: Explicitly use OpenAI TTS
   * @returns A promise that resolves with the base64 audio data.
   */
  requestTts: (
    text: string,
    userId: string,
    options?: {
      refineWithGemini?: boolean;
      useOpenAI?: boolean;
    }
  ): Promise<string | null> => {
    return new Promise((resolve, reject) => {
      // Immediately resolve with null for empty text to avoid unnecessary API calls.
      if (!text || text.trim().length === 0) {
        resolve(null);
        return;
      }
      
      queue.push({ text, userId, resolve, reject, options });

      // If the queue is not currently being processed, start it.
      if (!isProcessing) {
        processQueue();
      }
    });
  },
  
  /**
   * Enhanced TTS with Gemini text refinement and OpenAI TTS
   * This combines Gemini's text generation with OpenAI's high-quality TTS
   * 
   * @param textPrompt The text or prompt to convert to speech
   * @param userId The ID of the user requesting the TTS
   * @param openaiConfig Optional OpenAI TTS configuration
   * @returns A promise that resolves with the base64 audio data
   */
  generateAndSpeak: (
    textPrompt: string,
    userId: string,
    openaiConfig?: {
      voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
      model?: 'tts-1' | 'tts-1-hd';
      speed?: number;
    }
  ): Promise<string | null> => {
    return generateAndSpeak(textPrompt, userId, {
      refineWithGemini: true,
      openaiConfig,
    });
  },
};