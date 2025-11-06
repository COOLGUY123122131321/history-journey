import React, { useState, useEffect } from 'react';
import { 
    subscribe, 
    playAudio, 
    pauseAudio, 
    resumeAudio, 
    stopAudio, 
    getState, 
    PlaybackState 
} from '../../services/audioService';

const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></svg>;
const PauseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" /></svg>;
const StopIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" /></svg>;
const LoadingIcon = () => <svg className="animate-spin w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;


interface AudioControlsProps {
  audioData: string | null;
}

const AudioControls: React.FC<AudioControlsProps> = ({ audioData }) => {
    const [playbackState, setPlaybackState] = useState<PlaybackState>(getState());

    useEffect(() => {
        const unsubscribe = subscribe(setPlaybackState);
        // Fix: The useEffect cleanup function must return void or nothing. The `unsubscribe`
        // function returned a boolean from `Set.delete`, causing a type error.
        // Wrapping the call in a block ensures the cleanup function has a void return type.
        return () => {
            unsubscribe();
        };
    }, []);

    const handlePlay = () => {
        if (playbackState === 'paused') {
            resumeAudio();
        } else if (audioData) {
            playAudio(audioData);
        }
    };
    
    const handlePause = () => pauseAudio();
    const handleStop = () => stopAudio();

    const isInteractive = playbackState === 'playing' || playbackState === 'paused';

    return (
        <div className="flex items-center gap-2 p-2 rounded-full bg-gray-100">
            {playbackState !== 'playing' ? (
                <button 
                    onClick={handlePlay} 
                    disabled={!audioData || playbackState === 'loading'}
                    className="p-2 rounded-full text-white bg-brand-blue disabled:bg-gray-400 hover:bg-blue-600 transition" 
                    title="Play"
                >
                    {playbackState === 'loading' ? <LoadingIcon /> : <PlayIcon />}
                </button>
            ) : (
                <button 
                    onClick={handlePause} 
                    className="p-2 rounded-full text-white bg-brand-orange hover:bg-orange-600 transition" 
                    title="Pause"
                >
                    <PauseIcon />
                </button>
            )}

            <button 
                onClick={handleStop} 
                disabled={!isInteractive}
                className="p-2 rounded-full text-white bg-brand-pink disabled:bg-gray-400 hover:bg-pink-600 transition" 
                title="Stop"
            >
                <StopIcon />
            </button>
        </div>
    );
};

export default AudioControls;