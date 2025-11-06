
import React from 'react';

interface LoaderProps {
    message: string;
}

const Loader: React.FC<LoaderProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="text-5xl animate-bounce">🐣</div>
        <p className="mt-4 text-lg font-semibold text-brand-purple">{message}</p>
    </div>
  );
};

export default Loader;
