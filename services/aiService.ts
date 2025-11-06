/**
 * AI Service - Handles AI content generation
 * 
 * This service abstracts the AI provider (Gemini, OpenAI, etc.) and provides
 * a unified interface for generating different types of content.
 */

import { GoogleGenAI, GenerateContentResponse, Modality } from '@google/genai';

// Initialize AI client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
const model = 'gemini-2.5-flash';

/**
 * Response structure from AI generation
 */
export interface AIResponse {
  text: string;
  imageUrl?: string;
  videoUrl?: string;
}

/**
 * Generate AI response based on prompt and type
 * 
 * @param prompt - The user's question or command
 * @param type - Type of content to generate
 * @param topic - Context topic for better generation
 * @returns AIResponse with generated content
 */
export async function generateAIResponse(
  prompt: string,
  type: 'explanation' | 'video' | 'quiz' | 'question' | 'image' | 'text',
  topic: string,
  userId?: string
): Promise<AIResponse> {
  try {
    switch (type) {
      case 'explanation':
        return await generateExplanation(prompt, topic);
      
      case 'video':
        return await generateVideo(prompt, topic, userId);
      
      case 'quiz':
        return await generateQuiz(prompt, topic);
      
      case 'question':
        return await generateQuestion(prompt, topic);
      
      case 'image':
        return await generateImage(prompt, topic);
      
      case 'text':
      default:
        return await generateText(prompt, topic);
    }
  } catch (error) {
    console.error(`AI generation failed for ${type}:`, error);
    handleAIError(error, type);
  }
}

/**
 * Generate an explanation text
 */
async function generateExplanation(prompt: string, topic: string): Promise<AIResponse> {
  const enhancedPrompt = `You are a history educator. Provide a clear, engaging explanation about: ${prompt}
  
Context: ${topic}
  
Format your response as a well-structured explanation suitable for students learning about this topic.`;

  const response = await ai.models.generateContent({
    model: model,
    contents: enhancedPrompt,
  });

  return {
    text: response.text,
  };
}

/**
 * Generate text content (general purpose)
 */
async function generateText(prompt: string, topic: string): Promise<AIResponse> {
  const enhancedPrompt = `Context: ${topic}

${prompt}

Provide a clear, informative response.`;

  const response = await ai.models.generateContent({
    model: model,
    contents: enhancedPrompt,
  });

  return {
    text: response.text,
  };
}

/**
 * Generate a quiz question
 */
async function generateQuiz(prompt: string, topic: string): Promise<AIResponse> {
  const enhancedPrompt = `Create a quiz question about: ${prompt}

Topic: ${topic}

Format as a multiple-choice question with one correct answer and 3 distractors.`;

  const response = await ai.models.generateContent({
    model: model,
    contents: enhancedPrompt,
    config: { responseMimeType: 'application/json' },
  });

  return {
    text: response.text,
  };
}

/**
 * Generate a question
 */
async function generateQuestion(prompt: string, topic: string): Promise<AIResponse> {
  const enhancedPrompt = `Based on the topic "${topic}", generate a thoughtful question about: ${prompt}`;

  const response = await ai.models.generateContent({
    model: model,
    contents: enhancedPrompt,
  });

  return {
    text: response.text,
  };
}

/**
 * Generate an image (placeholder - would use image generation API)
 */
async function generateImage(prompt: string, topic: string): Promise<AIResponse> {
  // Placeholder - in production, this would call an image generation API
  // For now, return text describing the image that would be generated
  const enhancedPrompt = `Generate a detailed image description for: ${prompt}
  
Topic: ${topic}
  
The image should be historically accurate and visually engaging.`;

  const response = await ai.models.generateContent({
    model: model,
    contents: enhancedPrompt,
  });

  // In production, you would generate an actual image URL here
  // For now, we'll return the description as text
  return {
    text: response.text,
    imageUrl: undefined, // Would be set to actual image URL in production
  };
}

/**
 * Generate a video (uses existing video generation from geminiService)
 * Note: This requires a userId, so we'll need to pass it through
 */
async function generateVideo(prompt: string, topic: string, userId?: string): Promise<AIResponse> {
  // Import the existing video generation function
  // For now, we'll use a simplified version
  try {
    const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const videoPrompt = `Cinematic intro video. Theme: "${topic}". ${prompt}. Epic, realistic, historical, 4k.`;
    
    // This is a simplified version - in production, use the full generateJourneyIntroVideo from geminiService
    let operation = await genAI.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: videoPrompt,
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await genAI.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    
    return {
      text: `Video generated for: ${prompt}`,
      videoUrl: downloadLink,
    };
  } catch (error) {
    console.error('Video generation failed:', error);
    // Return a fallback
    return {
      text: `Video generation requested for: ${prompt}`,
      videoUrl: undefined,
    };
  }
}

/**
 * Helper to handle API errors gracefully
 */
function handleAIError(error: any, type: string): never {
  const errorMessage = error?.message || error?.toString() || 'Unknown error';
  
  if (errorMessage.includes('API key') || errorMessage.includes('API_KEY_INVALID')) {
    throw new Error('Invalid or missing API key. Please configure GEMINI_API_KEY in .env.local');
  }
  
  // Re-throw with more context
  throw new Error(`AI generation failed for ${type}: ${errorMessage}`);
}

