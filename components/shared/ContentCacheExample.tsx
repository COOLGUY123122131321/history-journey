/**
 * Example Component: How to use the Content Cache System
 * 
 * This component demonstrates how to use fetchOrGenerateContent
 * to display cached or newly generated AI content.
 */

import React, { useState, useEffect } from 'react';
import { fetchOrGenerateContent, ContentResult } from '../../services/contentCache';
import { useAuth } from '../../context/AuthContext';
import Loader from './Loader';

interface ContentCacheExampleProps {
  prompt: string;
  type: 'explanation' | 'video' | 'quiz' | 'question' | 'image' | 'text';
  topic: string;
}

const ContentCacheExample: React.FC<ContentCacheExampleProps> = ({ 
  prompt, 
  type, 
  topic 
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState<ContentResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await fetchOrGenerateContent(
          prompt,
          type,
          topic,
          user?.uid
        );
        
        setContent(result);
      } catch (err: any) {
        console.error('Failed to fetch/generate content:', err);
        setError(err.message || 'Failed to load content');
      } finally {
        setIsLoading(false);
      }
    };

    if (prompt && topic) {
      loadContent();
    }
  }, [prompt, type, topic, user?.uid]);

  if (isLoading) {
    return <Loader message="Loading content..." />;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!content) {
    return null;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      {/* Cache Status Badge */}
      <div className="mb-4 flex items-center gap-2">
        {content.fromCache ? (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
            ✅ Loaded from cache
          </span>
        ) : (
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
            ✨ Generated with AI
          </span>
        )}
        {content.views && content.views > 1 && (
          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
            👁️ {content.views} views
          </span>
        )}
      </div>

      {/* Content Display */}
      <div className="space-y-4">
        {/* Text Content */}
        {content.text && (
          <div className="prose max-w-none">
            <p className="text-gray-800 whitespace-pre-wrap">{content.text}</p>
          </div>
        )}

        {/* Image */}
        {content.imageUrl && (
          <div className="mt-4">
            <img 
              src={content.imageUrl} 
              alt={prompt}
              className="w-full rounded-lg shadow-md"
            />
          </div>
        )}

        {/* Video */}
        {content.videoUrl && (
          <div className="mt-4">
            <video 
              src={content.videoUrl} 
              controls
              className="w-full rounded-lg shadow-md"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-500">
        <p>Topic: <span className="font-semibold">{content.topic}</span></p>
        <p>Type: <span className="font-semibold">{content.type}</span></p>
        {content.createdAt && (
          <p>
            Created: {new Date(content.createdAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
};

export default ContentCacheExample;


