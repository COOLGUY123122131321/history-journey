import React, { useState, useEffect } from 'react';

const messages = [
    "The Muses are crafting your vision...",
    "Rendering the Roman Forum...",
    "Consulting the scrolls of Alexandria...",
    "Forging a Viking longship...",
    "The annals of history are being written...",
    "Gathering revolutionaries in Paris...",
    "Sharpening Spartan swords...",
];

const VideoLoader: React.FC = () => {
  const [message, setMessage] = useState(messages[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessage(prevMessage => {
        const currentIndex = messages.indexOf(prevMessage);
        const nextIndex = (currentIndex + 1) % messages.length;
        return messages[nextIndex];
      });
    }, 3000); // Change message every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-brand-dark-bg flex flex-col items-center justify-center z-50 text-white p-4 text-center">
        <div className="text-6xl animate-pulse">🎬</div>
        <h2 className="text-3xl font-cinzel text-brand-gold mt-6 mb-2">Generating Cinematic Intro</h2>
        <p className="text-lg text-gray-300 transition-opacity duration-500 min-h-[28px]">{message}</p>
        <p className="text-sm text-gray-500 mt-8">This may take a minute or two. Please be patient.</p>
    </div>
  );
};

export default VideoLoader;
