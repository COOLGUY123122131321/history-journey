import React from 'react';

interface ProgressBarProps {
    value: number;
    label: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, label }) => {
    const cappedValue = Math.min(100, Math.max(0, value));

    return (
        <div>
            <div className="flex justify-between mb-1">
                <span className="text-base font-medium text-brand-purple">{label}</span>
                <span className="text-sm font-medium text-brand-purple">{cappedValue}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                    className="bg-brand-orange h-4 rounded-full transition-all duration-500" 
                    style={{ width: `${cappedValue}%` }}
                ></div>
            </div>
        </div>
    );
};

export default ProgressBar;
