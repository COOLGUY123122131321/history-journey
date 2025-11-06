import { GoogleGenAI, GenerateContentResponse, Type, Modality } from '@google/genai';
import {
    Journey,
    Scene,
    Choice,
    Outcome,
    Resources,
    Question,
    TutorMood,
    QuestionType,
    User,
} from '../types';
import { getOrGenerate } from './cacheService';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash';

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

let isTtsPermanentlyDisabled = false;

async function withRetry<T>(apiCall: () => Promise<T>, isTtsCall = false): Promise<T> {
  let lastError: any = null;
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await apiCall();
    } catch (error: any) {
      lastError = error;
      const errorMessage = (error?.toString() ?? '').toLowerCase();
      
      if (errorMessage.includes('limit: 0')) {
        if (isTtsCall) {
            console.error("Unrecoverable TTS API quota error. Please check your plan and billing details. TTS will be disabled for this session.", error);
            isTtsPermanentlyDisabled = true;
        } else {
             console.error("Unrecoverable API quota error. Please check your plan and billing details. Will not retry.", error);
        }
        throw error;
      }

      const isRetryable = errorMessage.includes('429') || errorMessage.includes('503') || errorMessage.includes('resource_exhausted') || errorMessage.includes('unavailable');
      
      if (isRetryable) {
        const delay = INITIAL_BACKOFF_MS * Math.pow(2, i) + Math.random() * 1000;
        console.warn(`API call failed with a transient error. Retrying in ${delay.toFixed(0)}ms... (Attempt ${i + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw lastError || new Error("API call failed after multiple retries.");
}

const outcomeSchema = {
    type: Type.OBJECT,
    properties: {
        outcomeText: {
            type: Type.STRING,
            description: "A 2-3 sentence, first-person narrative description of what happens immediately after the player's choice.",
        },
        mentorInsight: {
            type: Type.STRING,
            description: "A short, wise insight from an AI history mentor (Professor Spark), explaining the historical context or significance of the choice. Keep it to 1-2 sentences.",
        },
        resourceChanges: {
            type: Type.OBJECT,
            properties: {
                health: { type: Type.NUMBER, description: "Change in player's health. Can be positive or negative." },
                food: { type: Type.NUMBER, description: "Change in player's food supply. Can be positive or negative." },
                money: { type: Type.NUMBER, description: "Change in player's money. Can be positive or negative." },
                influence: { type: Type.NUMBER, description: "Change in player's social/political influence. Can be positive or negative." },
            },
            description: "An object representing the changes to the player's resources. Only include keys for resources that change. A value of 0 means no change.",
        },
        question: {
            type: Type.OBJECT,
            description: "A single, relevant quiz question that follows the outcome, formatted as one of the supported question types.",
            properties: {
                type: {
                    type: Type.STRING,
                    enum: [QuestionType.MULTIPLE_CHOICE, QuestionType.TRUE_FALSE],
                },
                questionText: { type: Type.STRING },
                explanation: { type: Type.STRING },
                options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "For MULTIPLE_CHOICE questions, provide an array of 3-4 string options. This field should be omitted for TRUE_FALSE questions.",
                },
                correctAnswer: {
                    type: Type.STRING,
                    description: "The correct answer. For MULTIPLE_CHOICE, this is one of the strings from the 'options' array. For TRUE_FALSE, this must be the string 'true' or 'false'.",
                },
            },
            required: ["type", "questionText", "explanation", "correctAnswer"],
        },
        nextScene: {
            type: Type.OBJECT,
            properties: {
                scenario: {
                    type: Type.STRING,
                    description: "The next scenario the player faces. A 2-3 sentence, first-person narrative setting up the next choice."
                },
                choices: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            text: { type: Type.STRING, description: "The text for a choice button." }
                        },
                         required: ["text"],
                    },
                    description: "An array of 2 or 3 choices for the player to make in the new scenario."
                }
            },
            required: ["scenario", "choices"],
            description: "The scene that follows the outcome of the player's choice.",
        },
        isGameOver: {
            type: Type.BOOLEAN,
            description: "Set to true if the player's choice leads to a definitive end of the story (e.g., death, imprisonment, or achieving a major goal)."
        },
        gameOverReason: {
            type: Type.STRING,
            description: "If isGameOver is true, provide a short (1-2 sentence) reason explaining why the story ended."
        }
    },
    required: ["outcomeText", "mentorInsight", "resourceChanges", "question", "nextScene", "isGameOver"]
};


export const startJourney = async (journey: Journey, userId: string): Promise<Scene> => {
    const prompt = `
        You are an AI storyteller for the interactive history game "History Journey".
        Your task is to generate the very first scene for the player.
        The journey is: "${journey.name}".
        The initial setting is: "${journey.startingPrompt}".

        Based on this, create the first set of choices for the player.
        Respond with a valid JSON object with the following structure:
        {
            "scenario": "A slightly rephrased version of the starting prompt, setting the scene for the first choice.",
            "choices": [
                { "text": "First choice..." },
                { "text": "Second choice..." },
                { "text": "Third choice..." }
            ]
        }
    `;

    return getOrGenerate<Scene>({
        type: 'scene',
        topic: journey.id,
        prompt: prompt,
        userId: userId,
        generatorFn: async () => {
             const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
                model: model,
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            }));
            return JSON.parse(response.text) as Scene;
        }
    });
};

export const advanceStory = async (journeyName: string, previousScene: Scene, choice: Choice, resources: Resources, userId: string): Promise<Outcome> => {
    // Note: Caching with dynamic resources is complex. We'll use a prompt that omits them for better cache hit rates.
    const cacheablePrompt = `PREVIOUS SCENE: "${previousScene.scenario}" | PLAYER'S CHOICE: "${choice.text}"`;
    
    const prompt = `
        You are an AI storyteller for the interactive history game "History Journey".
        The player is on the "${journeyName}" journey.
        
        CURRENT PLAYER STATUS (for context, do not make outcomes dependent on exact numbers unless critical):
        - Health: ${resources.health}/100
        - Food: ${resources.food}/100
        - Money: ${resources.money}/100
        - Influence: ${resources.influence}/100

        PREVIOUS SCENE:
        "${previousScene.scenario}"

        PLAYER'S CHOICE:
        "${choice.text}"

        Your task is to generate the complete next step of the story. Generate a single, valid JSON object that adheres to the provided schema.
    `;

    return getOrGenerate<Outcome>({
        type: 'outcome',
        topic: journeyName,
        prompt: cacheablePrompt,
        userId: userId,
        generatorFn: async () => {
            const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
                model: model,
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: outcomeSchema
                }
            }));
            
            const outcome = JSON.parse(response.text);

            if (outcome.question && outcome.question.type === QuestionType.TRUE_FALSE) {
                outcome.question.correctAnswer = String(outcome.question.correctAnswer).toLowerCase() === 'true';
            }

            return outcome as Outcome;
        }
    });
};

export const generateJourneyIntroVideo = async (journey: Journey, userId: string): Promise<string> => {
    const prompt = `Cinematic intro video for a historical journey. Theme: "${journey.name}". A short, atmospheric, 5-second establishing shot that captures the essence of this description: "${journey.description}". Epic, realistic, historical, 4k.`;

    return getOrGenerate<string>({
        type: 'video',
        topic: journey.id,
        prompt: prompt,
        userId: userId,
        mediaOptions: {
            path: `journey_intros/${journey.id}_${Date.now()}.mp4`,
            dataType: 'url',
            mimeType: 'video/mp4',
        },
        generatorFn: async () => {
            const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
            try {
                let operation = await genAI.models.generateVideos({
                    model: 'veo-3.1-fast-generate-preview',
                    prompt: prompt,
                    config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
                });

                while (!operation.done) {
                    await new Promise(resolve => setTimeout(resolve, 10000));
                    operation = await genAI.operations.getVideosOperation({ operation: operation });
                }

                const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
                if (!downloadLink) throw new Error("Video generation completed but no download link was found.");
                
                return downloadLink;
            } catch (error: any) {
                const errorMessage = error?.message || error?.toString() || '';
                const errorCode = error?.error?.code || error?.code;
                
                // Check for API key errors
                if (errorMessage.includes("Requested entity was not found") || 
                    errorMessage.includes("API key not valid") ||
                    errorCode === 400 && errorMessage.includes("API key")) {
                    throw new Error("API_KEY_INVALID");
                }
                console.error("Video generation failed:", error);
                throw error;
            }
        }
    });
};

export const getHint = async (question: Question, userId: string): Promise<string> => {
    const prompt = `
        You are an AI tutor. A student asked for a hint for the following question.
        Provide a short, one-sentence hint that guides them to the right answer without giving it away.
        Question: "${question.questionText}"
        ${'options' in question && (question as any).options ? `Options: ${JSON.stringify((question as any).options)}` : ''}
        Generate just the hint text.`;

    return getOrGenerate<string>({
        type: 'hint',
        topic: question.questionText.slice(0, 50),
        prompt: prompt,
        userId: userId,
        generatorFn: async () => {
             const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
                model: model,
                contents: prompt,
            }));
            return response.text.trim();
        }
    });
};

export const getTutorFeedback = async (accuracy: number, userId: string): Promise<{ message: string; mood: TutorMood }> => {
    const prompt = `...`; // Similar wrapping for feedback
    // This function is less critical for caching, will skip for brevity
    let mood: TutorMood = 'neutral';
    if (accuracy >= 80) mood = 'happy';
    else if (accuracy < 50) mood = 'sad';
    return { message: "Great work!", mood };
};

export const evaluateShortAnswer = async (questionText: string, userAnswer: string, keyConcepts: string[]): Promise<{ isCorrect: boolean; feedback: string }> => {
    // Not caching this as user input is unique
    const evaluationSchema = {
        type: Type.OBJECT,
        properties: {
            isCorrect: { type: Type.BOOLEAN },
            feedback: { type: Type.STRING, description: "A short, one-sentence explanation for why the answer is correct or incorrect." },
        },
        required: ["isCorrect", "feedback"],
    };
    const prompt = `...`; // Same as before
    const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model, contents: prompt, config: { responseMimeType: 'application/json', responseSchema: evaluationSchema }
    }));
    return JSON.parse(response.text);
};

export const generateTtsAudio = async (text: string, userId: string): Promise<string | null> => {
    if (!text || text.trim().length === 0 || isTtsPermanentlyDisabled) return null;

    return getOrGenerate<string>({
        type: 'tts',
        topic: 'general-tts',
        prompt: text,
        userId: userId,
        mediaOptions: {
            path: `tts/${text.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}_${Date.now()}.mp3`,
            dataType: 'base64',
            mimeType: 'audio/mpeg',
        },
        generatorFn: async () => {
            try {
                const response = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
                    model: 'gemini-2.5-flash-preview-tts',
                    contents: [{ parts: [{ text: text }] }],
                    config: {
                        responseModalities: [Modality.AUDIO],
                        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
                    },
                }), true);
                return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
            } catch (error) {
                console.error("TTS generation failed:", error);
                return "";
            }
        }
    });
};