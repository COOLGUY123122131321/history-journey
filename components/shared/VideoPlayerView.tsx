import React, { useState, useEffect, useRef } from 'react';
import { soundService } from '../../services/soundService';

interface VideoPlayerViewProps {
    videoUrl: string;
    onContinue: () => void;
}

const VideoPlayerView: React.FC<VideoPlayerViewProps> = ({ videoUrl, onContinue }) => {
    const [videoSrc, setVideoSrc] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showControls, setShowControls] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    // New state for skip button visibility
    const [isHovering, setIsHovering] = useState(false);
    const [showSkipButton, setShowSkipButton] = useState(false);
    const skipButtonTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        if (!videoUrl) return;

        setIsLoading(true);
        setError(null);
        let objectUrl: string | null = null;

        const fetchVideo = async () => {
            try {
                const fullVideoUrl = `${videoUrl}&key=${process.env.API_KEY}`;
                const response = await fetch(fullVideoUrl);

                if (!response.ok) {
                    throw new Error(`Failed to fetch video: ${response.status} ${response.statusText}`);
                }

                const videoBlob = await response.blob();
                objectUrl = URL.createObjectURL(videoBlob);
                setVideoSrc(objectUrl);
                setIsLoading(false);
            } catch (err: any) {
                console.error("Error fetching video data:", err);
                setError("Could not load the cinematic intro. This might be due to an invalid API key or network issues.");
                setIsLoading(false);
                setShowControls(true);
            }
        };

        fetchVideo();

        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [videoUrl]);
    
    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement || !videoSrc) return;

        const handleVideoEnd = () => {
            setShowControls(true);
            setShowSkipButton(false);
        };
        
        const handleError = () => {
            const mediaError = videoElement.error;
            let detailedMessage = "An unknown error occurred during playback.";

            if (mediaError) {
                console.error("Video player MediaError:", mediaError);
                switch (mediaError.code) {
                    case mediaError.MEDIA_ERR_ABORTED:
                        detailedMessage = "Playback was aborted.";
                        break;
                    case mediaError.MEDIA_ERR_NETWORK:
                        detailedMessage = "A network error occurred during playback.";
                        break;
                    case mediaError.MEDIA_ERR_DECODE:
                        detailedMessage = "The video could not be decoded.";
                        break;
                    case mediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                        detailedMessage = "The video format is not supported.";
                        break;
                    default:
                        detailedMessage = `An unexpected error occurred (Code: ${mediaError.code}).`;
                }
            }
            
            setError(`Playback failed. ${detailedMessage}`);
            setShowControls(true);
            setShowSkipButton(false);
        };

        videoElement.addEventListener('ended', handleVideoEnd);
        videoElement.addEventListener('error', handleError);

        videoElement.play().then(() => {
            // Video started playing, set a timer to show the skip button
            skipButtonTimeoutRef.current = window.setTimeout(() => {
                setShowSkipButton(true);
            }, 2000); // Show after 2 seconds
        }).catch(e => {
            console.warn("Autoplay was prevented by the browser.", e);
            setShowControls(true); 
            setShowSkipButton(false);
            setError("Autoplay is blocked. Please press Continue.");
        });

        return () => {
            videoElement.removeEventListener('ended', handleVideoEnd);
            videoElement.removeEventListener('error', handleError);
            if (skipButtonTimeoutRef.current) {
                clearTimeout(skipButtonTimeoutRef.current);
            }
        };
    }, [videoSrc]);

    const handleAction = () => {
        soundService.playUIClick();
        const video = videoRef.current;
        if (video && !video.paused) {
            video.pause();
        }
        onContinue();
    };

    return (
        <div 
            className="fixed inset-0 bg-black flex items-center justify-center z-50 animate-fade-in-up"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {isLoading && (
                <div className="text-white text-center">
                    <div className="text-4xl animate-pulse mb-4">🎞️</div>
                    <p>Loading cinematic...</p>
                </div>
            )}

            {videoSrc && (
                 <video
                    ref={videoRef}
                    src={videoSrc}
                    playsInline
                    autoPlay
                    muted
                    className="w-full h-full object-contain"
                />
            )}
           
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 w-full px-4">
                 {error && <p className="text-red-400 bg-black/50 p-2 rounded mb-2 text-center max-w-md">{error}</p>}
                
                {/* Main Continue Button (end of video or error) */}
                {(showControls || error) && (
                     <button
                        onClick={handleAction}
                        className="bg-brand-gold text-black font-bold py-3 px-8 rounded-lg text-xl animate-fade-in-up"
                    >
                        {error ? "Continue Journey" : "Journey Begins"}
                    </button>
                )}

                {/* Skip Intro Button (during playback) */}
                {!isLoading && !showControls && !error && (
                    <div className={`transition-opacity duration-300 ${showSkipButton || isHovering ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        <button
                            onClick={handleAction}
                            className="bg-black/60 text-white backdrop-blur-md py-2 px-6 rounded-lg hover:bg-white/20 transition font-semibold"
                        >
                            Skip Intro
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoPlayerView;