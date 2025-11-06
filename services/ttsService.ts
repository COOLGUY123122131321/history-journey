import { generateTtsAudio } from './geminiService';

interface TtsRequest {
  text: string;
  userId: string;
  resolve: (value: string | null) => void;
  reject: (reason?: any) => void;
}

const queue: TtsRequest[] = [];
let isProcessing = false;

// Gemini API TTS has a rate limit of 10 requests per minute.
// Processing one request every 7 seconds (60s / 10 = 6s base) provides a safe buffer.
const REQUEST_INTERVAL = 7000; 

const processQueue = async () => {
  if (queue.length === 0) {
    isProcessing = false;
    return;
  }

  isProcessing = true;
  const { text, userId, resolve, reject } = queue.shift()!;

  try {
    const audioData = await generateTtsAudio(text, userId);
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
   * @param text The text to be converted to speech.
   * @param userId The ID of the user requesting the TTS.
   * @returns A promise that resolves with the base64 audio data.
   */
  requestTts: (text: string, userId: string): Promise<string | null> => {
    return new Promise((resolve, reject) => {
      // Immediately resolve with null for empty text to avoid unnecessary API calls.
      if (!text || text.trim().length === 0) {
        resolve(null);
        return;
      }
      
      queue.push({ text, userId, resolve, reject });

      // If the queue is not currently being processed, start it.
      if (!isProcessing) {
        processQueue();
      }
    });
  },
};