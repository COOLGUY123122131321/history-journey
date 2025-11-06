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

// Helper functions for decoding audio
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
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
    
    if (!base64Audio || base64Audio.length < 100) {
        console.warn("Invalid or dummy audio data, skipping playback.");
        return;
    }

    setState('loading');
    
    try {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') {
            await ctx.resume();
        }

        const decodedBytes = decode(base64Audio);
        audioBuffer = await decodeAudioData(decodedBytes, ctx, 24000, 1);
        
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

    } catch (error) {
        console.error("Failed to play audio:", error);
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