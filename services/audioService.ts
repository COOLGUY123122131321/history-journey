// services/audioService.ts

export type PlaybackState = 'stopped' | 'loading' | 'playing' | 'paused';

let audioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let audioBuffer: AudioBuffer | null = null;

let state: PlaybackState = 'stopped';
let contextStartTime = 0;
let bufferOffset = 0;

const listeners = new Set<(state: PlaybackState) => void>();

const setState = (newState: PlaybackState) => {
    state = newState;
    listeners.forEach(listener => listener(state));
};

// Validate base64 string before processing
function isValidBase64(str: string): boolean {
  try {
    if (!str || typeof str !== 'string' || str.length < 10) return false;

    // Clean the string first
    const clean = (str || '')
      .replace(/^data:.*;base64,/, '') // strip any data URL prefix
      .replace(/\s+/g, ''); // remove whitespace/newlines

    if (clean.length < 10) return false;

    // Check if string contains only valid base64 characters
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(clean)) {
      return false;
    }

    // Try to decode the ENTIRE string to ensure it's valid
    // Wrap in try-catch to safely handle any decoding errors
    try {
      atob(clean);
      return true;
    } catch (decodeError) {
      // If decoding fails, the base64 is invalid
      return false;
    }
  } catch (error) {
    // Any other error means invalid
    return false;
  }
}

// Helper functions for decoding MP3 base64 safely via Web Audio
function toDataUrl(base64: string): string {
  const clean = (base64 || '')
    .replace(/^data:.*;base64,/, '') // strip any data URL prefix
    .replace(/\s+/g, ''); // remove whitespace/newlines
  
  // Validate before creating data URL to prevent browser errors
  if (!isValidBase64(clean)) {
    throw new Error(`Cannot create data URL: invalid base64 data (length: ${clean.length})`);
  }
  
  return `data:audio/mpeg;base64,${clean}`;
}

async function loadAudioBufferFromBase64(base64: string, ctx: AudioContext): Promise<AudioBuffer> {
  // Validate base64 before attempting to decode
  if (!isValidBase64(base64)) {
    throw new Error(`Invalid base64 audio data provided (${base64.length} chars)`);
  }

  // Clean the base64 string
  const clean = (base64 || '')
    .replace(/^data:.*;base64,/, '')
    .replace(/\s+/g, '');

  // Decode base64 directly to ArrayBuffer instead of using fetch with data URL
  // This avoids browser's internal atob() calls that might throw errors
  let arrayBuf: ArrayBuffer;
  try {
    const binaryString = atob(clean);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    arrayBuf = bytes.buffer;
  } catch (decodeError: any) {
    const errorMessage = decodeError?.message || decodeError?.toString() || 'Unknown error';
    throw new Error(`Failed to decode base64 audio data: ${errorMessage}`);
  }

  if (arrayBuf.byteLength === 0) {
    throw new Error("Decoded audio data is empty");
  }

  // Use browser decoder for MP3
  return await ctx.decodeAudioData(arrayBuf);
}

// Public API
export const subscribe = (callback: (state: PlaybackState) => void) => {
    listeners.add(callback);
    callback(state); // Immediately notify with current state
    return () => listeners.delete(callback);
};

export const getState = () => state;

export const stopAudio = () => {
    if (currentSource) {
        currentSource.onended = null; // Prevent onended from firing stop again
        currentSource.stop();
        currentSource = null;
    }
    audioBuffer = null;
    bufferOffset = 0;
    setState('stopped');
};

const getAudioContext = () => {
    if (!audioContext || audioContext.state === 'closed') {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    return audioContext;
}

export const playAudio = async (base64Audio: string) => {
    if (state !== 'stopped') {
        stopAudio();
    }

    if (!base64Audio || typeof base64Audio !== 'string' || base64Audio.length < 100) {
        console.warn("Invalid or dummy audio data, skipping playback.");
        setState('stopped');
        return;
    }

    // Early validation to catch invalid base64 before processing
    // Wrap in try-catch to catch any errors from validation itself
    let isValid = false;
    try {
        isValid = isValidBase64(base64Audio);
    } catch (validationError: any) {
        console.error("Error during base64 validation:", validationError);
        console.error("Audio data preview:", base64Audio.substring(0, 100) + "...");
        setState('stopped');
        return;
    }

    if (!isValid) {
        console.error("Invalid base64 audio data provided. Cannot play audio.");
        console.error("Audio data preview:", base64Audio.substring(0, 100) + "...");
        setState('stopped');
        return;
    }

    setState('loading');

    try {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') {
            await ctx.resume();
        }

        // Decode MP3 base64 using Web Audio's decoder
        audioBuffer = await loadAudioBufferFromBase64(base64Audio, ctx);

        currentSource = ctx.createBufferSource();
        currentSource.buffer = audioBuffer;
        currentSource.connect(ctx.destination);

        contextStartTime = ctx.currentTime;
        currentSource.start(0);

        currentSource.onended = () => {
            // Only auto-stop if it wasn't paused manually
            if (state === 'playing') {
                stopAudio();
            }
        };

        setState('playing');

    } catch (error: any) {
        console.error("Failed to play audio:", error);

        // Check for atob errors specifically
        const errorMessage = error?.message || error?.toString() || '';
        if (errorMessage.includes('atob') || errorMessage.includes('InvalidCharacterError') || errorMessage.includes('Failed to execute \'atob\'')) {
            console.error("CRITICAL: Invalid base64 data detected. This should have been caught by validation.");
            console.error("Audio data length:", base64Audio?.length);
            console.error("Audio data preview:", base64Audio?.substring?.(0, 200) || 'N/A');
            console.error("This indicates corrupted cached data. The cache entry should be regenerated.");
        } else if (error instanceof Error) {
            if (error.message.includes('Invalid base64') || error.message.includes('invalid base64')) {
                console.error("Audio data appears to be corrupted or invalid base64. The data may need to be regenerated.");
            } else if (error.message.includes('decodeAudioData')) {
                console.error("Audio format not supported by browser or data corrupted");
            } else if (error.message.includes('fetch') || error.message.includes('data URL')) {
                console.error("Failed to process audio data URL");
            }
        }

        stopAudio();
    }
};

export const pauseAudio = () => {
    if (state !== 'playing' || !currentSource || !audioContext) return;
    
    currentSource.onended = null;
    currentSource.stop();
    bufferOffset += audioContext.currentTime - contextStartTime;
    
    currentSource = null;
    setState('paused');
};

export const resumeAudio = () => {
    if (state !== 'paused' || !audioBuffer || !audioContext) return;
    
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    currentSource = audioContext.createBufferSource();
    currentSource.buffer = audioBuffer;
    currentSource.connect(audioContext.destination);
    
    contextStartTime = audioContext.currentTime;
    currentSource.start(0, bufferOffset);
    
    currentSource.onended = () => {
        if (state === 'playing') {
            stopAudio();
        }
    };
    
    setState('playing');
};
