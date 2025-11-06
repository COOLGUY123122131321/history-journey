
// A simple, file-less sound and vibration service using Web Audio API.

let audioContext: AudioContext | null = null;
let isMuted = false;

const getAudioContext = () => {
    if (!audioContext || audioContext.state === 'closed') {
        // Resume context on user interaction
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContext;
};

// Resume context on first user gesture
const resumeAudioContext = () => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
        ctx.resume();
    }
};
if (typeof window !== 'undefined') {
    document.addEventListener('click', resumeAudioContext, { once: true });
    document.addEventListener('touchstart', resumeAudioContext, { once: true });
}


const playSound = (type: OscillatorType, frequency: number, duration: number, volume = 0.5) => {
    if (isMuted) return;
    try {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') {
           ctx.resume();
        }
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
        
        gainNode.gain.setValueAtTime(volume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
        console.error("Could not play sound", e);
    }
};

const playArpeggio = (notes: number[], durationPerNote: number) => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
       ctx.resume();
    }
    notes.forEach((note, index) => {
        setTimeout(() => {
            playSound('sine', note, durationPerNote, 0.3);
        }, index * durationPerNote * 1000);
    });
};

const vibrate = (pattern: number | number[]) => {
    if (isMuted) return;
    if ('vibrate' in navigator) {
        try {
            navigator.vibrate(pattern);
        } catch (e) {
            console.warn("Could not vibrate:", e);
        }
    }
};

export const soundService = {
    setMuted: (muted: boolean) => {
        isMuted = muted;
        if(muted && 'vibrate' in navigator) {
            navigator.vibrate(0); // Stop any ongoing vibration
        }
    },
    playCorrect: () => {
        playSound('sine', 880, 0.2, 0.3);
        setTimeout(() => playSound('sine', 1046.50, 0.2, 0.3), 80);
        vibrate(50);
    },
    playIncorrect: () => {
        playSound('sawtooth', 220, 0.3, 0.2);
        vibrate([80, 40, 80]);
    },
    playUIClick: () => {
        playSound('triangle', 1000, 0.05, 0.1);
        vibrate(20);
    },
    playLessonStart: () => {
        playArpeggio([440, 554.37, 659.25], 0.1);
    },
    playLessonComplete: () => {
        playArpeggio([523.25, 659.25, 783.99, 1046.50], 0.15);
        vibrate([50, 100, 50, 100, 50]);
    },
    playRewardUnlock: () => {
        playSound('sine', 1200, 0.4, 0.4);
        vibrate(200);
    }
};
