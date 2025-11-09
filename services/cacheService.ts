import { db, storage } from './firebase';
import {
  collection,
  query,
  where,
  limit,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  increment,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, uploadString } from 'firebase/storage';
import { CachedContent, CacheContentType } from '../types';

// Validate base64 string before processing
function isValidBase64(str: string): boolean {
    try {
        if (!str || typeof str !== 'string' || str.length < 10) return false;

        // Clean the string first
        const clean = (str || '')
            .replace(/^data:.*;base64,/, '')
            .replace(/\s+/g, '');

        if (clean.length < 10) return false;

        // Check if string contains only valid base64 characters
        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        if (!base64Regex.test(clean)) {
            return false;
        }

        // Try to decode the ENTIRE string to ensure it's valid
        // Wrap in try-catch to safely handle any decoding errors
        try {
            atob(clean);
            return true;
        } catch (decodeError) {
            // If decoding fails, the base64 is invalid
            return false;
        }
    } catch (error) {
        // Any other error means invalid
        return false;
    }
}

// Helper to convert base64 to blob for uploading
function base64ToBlob(base64: string, contentType: string = ''): Blob {
    // Clean the base64 string first
    const cleanBase64 = (base64 || '')
        .replace(/^data:.*;base64,/, '') // strip any data URL prefix
        .replace(/\s+/g, ''); // remove whitespace/newlines

    // Validate before attempting to decode
    if (!isValidBase64(cleanBase64)) {
        throw new Error(`Invalid base64 data provided (length: ${cleanBase64.length})`);
    }

    try {
        const byteCharacters = atob(cleanBase64);
        const byteArrays = [];
        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }
        return new Blob(byteArrays, { type: contentType });
    } catch (error) {
        throw new Error(`Failed to convert base64 to blob: ${error instanceof Error ? error.message : String(error)}`);
    }
}


type GeneratorFn<T> = () => Promise<T>;

interface MediaOptions {
    path: string; // e.g., 'videos/' or 'audio/'
    dataType: 'base64' | 'url';
    mimeType: string;
}

interface GetOrGenerateOptions<T> {
    type: CacheContentType;
    topic: string;
    prompt: string;
    userId: string;
    generatorFn: GeneratorFn<T>;
    mediaOptions?: MediaOptions;
}

const contentCacheRef = collection(db, 'content_cache');

export async function getOrGenerate<T extends (string | object)>(options: GetOrGenerateOptions<T>): Promise<T> {
    const { type, topic, prompt, userId, generatorFn, mediaOptions } = options;

    // 1. Check if content already exists in Firestore
    const q = query(contentCacheRef, where('prompt', '==', prompt), where('type', '==', type), limit(1));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        const cachedDoc = querySnapshot.docs[0] as QueryDocumentSnapshot<CachedContent<T>>;
        const cachedData = cachedDoc.data();
        
        // For media options, prefer URL if available, otherwise use content
        // For non-media, use content
        let cachedValue: T | null = null;
        if (mediaOptions) {
            // Check URL first (for uploaded media), then content (for localhost base64)
            cachedValue = (cachedData.url || cachedData.content) as T;
        } else {
            cachedValue = cachedData.content as T;
        }
        
        // If cached value is missing or empty, regenerate
        if (!cachedValue || (typeof cachedValue === 'string' && cachedValue.trim().length === 0)) {
            console.warn(`[Cache] Cached ${type} data is empty. Regenerating...`);
            // Fall through to regeneration
        }
        // Handle cached base64 data for TTS
        else if (mediaOptions && mediaOptions.dataType === 'base64' && typeof cachedValue === 'string') {
            // Check if cached value is a URL (from Firebase Storage) instead of base64
            if (cachedValue.startsWith('http://') || cachedValue.startsWith('https://')) {
                console.log(`[Cache] Cached ${type} data is a URL. Fetching and converting to base64...`);
                try {
                    // Fetch the audio file from the URL
                    const response = await fetch(cachedValue);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch audio: ${response.status} ${response.statusText}`);
                    }
                    const blob = await response.blob();
                    const arrayBuffer = await blob.arrayBuffer();
                    
                    // Convert ArrayBuffer to base64
                    const bytes = new Uint8Array(arrayBuffer);
                    let binary = '';
                    for (let i = 0; i < bytes.length; i++) {
                        binary += String.fromCharCode(bytes[i]);
                    }
                    const base64Data = btoa(binary);
                    
                    // Validate the converted base64
                    if (isValidBase64(base64Data)) {
                        // Increment views count
                        await updateDoc(doc(contentCacheRef, cachedDoc.id), {
                            views: increment(1)
                        });
                        
                        console.log(`[Cache] HIT for type: ${type}, topic: ${topic} (converted from URL)`);
                        return base64Data as T;
                    } else {
                        throw new Error('Converted base64 is invalid');
                    }
                } catch (urlError: any) {
                    console.error(`[Cache] Failed to fetch/convert cached URL:`, urlError);
                    // Fall through to regeneration
                }
            } else {
                // Cached value is base64, validate it
                const cleanBase64 = (cachedValue || '')
                    .replace(/^data:.*;base64,/, '')
                    .replace(/\s+/g, '');
                
                // Strict validation: decode the entire string to catch corruption
                if (!isValidBase64(cleanBase64)) {
                    console.error(`[Cache] Cached ${type} data is corrupted (invalid base64). Length: ${cleanBase64.length}. Regenerating...`);
                    console.error(`[Cache] Corrupted data preview: ${cleanBase64.substring(0, 100)}...`);
                    
                    // Delete the corrupted cache entry
                    try {
                        await updateDoc(doc(contentCacheRef, cachedDoc.id), {
                            // Mark as corrupted by clearing the content
                            content: null,
                            url: null,
                        });
                    } catch (error) {
                        console.error('[Cache] Failed to mark corrupted cache entry:', error);
                    }
                    // Fall through to regeneration
                } else {
                    // Increment views count asynchronously
                    await updateDoc(doc(contentCacheRef, cachedDoc.id), {
                        views: increment(1)
                    });
                    
                    console.log(`[Cache] HIT for type: ${type}, topic: ${topic}`);
                    // Return cleaned base64 data to ensure consistency
                    return cleanBase64 as T;
                }
            }
        } else {
            // Increment views count asynchronously
            await updateDoc(doc(contentCacheRef, cachedDoc.id), {
                views: increment(1)
            });
            
            console.log(`[Cache] HIT for type: ${type}, topic: ${topic}`);
            return cachedValue;
        }
    }

    console.log(`[Cache] MISS for type: ${type}, topic: ${topic}. Generating...`);
    // 2. If not found, generate with AI
    const generatedData = await generatorFn();

    // Validate generated data before caching
    if (mediaOptions && mediaOptions.dataType === 'base64' && typeof generatedData === 'string') {
        // Don't cache empty or invalid base64 strings
        if (!generatedData || generatedData.trim().length === 0) {
            console.warn(`[Cache] Generated ${type} data is empty. Not caching.`);
            return generatedData as T;
        }
        
        const cleanBase64 = (generatedData || '')
            .replace(/^data:.*;base64,/, '')
            .replace(/\s+/g, '');
        
        if (!isValidBase64(cleanBase64)) {
            console.error(`[Cache] Generated ${type} data is invalid base64. Not caching.`);
            // Return the data anyway (it might be handled gracefully by the caller)
            return generatedData as T;
        }
    }

    let contentToStore: Partial<CachedContent<T>> = {};

    // 3. Handle media upload if necessary
    if (mediaOptions && (typeof generatedData === 'string')) {
        // Check if running on localhost - skip Firebase Storage upload to avoid CORS issues
        const isLocalhost = typeof window !== 'undefined' && (
            window.location.hostname === 'localhost' || 
            window.location.hostname === '127.0.0.1' ||
            window.location.hostname === ''
        );
        
        // For localhost, skip upload and use data directly
        if (isLocalhost) {
            console.warn('[Cache] Skipping Firebase Storage upload on localhost. Using data directly.');
            if (mediaOptions.dataType === 'url') {
                // Return the direct URL for videos
                return generatedData as T;
            } else if (mediaOptions.dataType === 'base64') {
                // For base64 audio (TTS), return base64 directly (audioService expects base64)
                // For other base64 media types, this could be converted to data URL if needed
                return generatedData as T;
            }
        }
        
        let downloadURL: string;
        const storageRef = ref(storage, mediaOptions.path);

        try {
            if (mediaOptions.dataType === 'base64') {
                // Validate base64 before attempting conversion
                const cleanBase64 = (generatedData || '')
                    .replace(/^data:.*;base64,/, '')
                    .replace(/\s+/g, '');
                
                if (!isValidBase64(cleanBase64)) {
                    throw new Error(`Invalid base64 data generated (length: ${cleanBase64.length}). Cannot upload to storage.`);
                }
                
                const blob = base64ToBlob(generatedData, mediaOptions.mimeType);
                await uploadBytes(storageRef, blob);
            } else if (mediaOptions.dataType === 'url') {
                const response = await fetch(`${generatedData}&key=${process.env.API_KEY}`);
                const blob = await response.blob();
                await uploadBytes(storageRef, blob);
            }
            downloadURL = await getDownloadURL(storageRef);
            contentToStore = { url: downloadURL };
        } catch (uploadError: any) {
            // Handle CORS or storage errors - likely running locally
            const errorMessage = uploadError?.message || uploadError?.toString() || '';
            const errorCode = uploadError?.code || '';
            const errorName = uploadError?.name || '';
            
            // Check for various CORS and storage error indicators
            const isCorsError = errorMessage.includes('CORS') || 
                               errorMessage.includes('cors') ||
                               errorMessage.includes('preflight') ||
                               errorMessage.includes('ERR_FAILED') ||
                               errorMessage.includes('network') ||
                               errorCode === 'storage/unauthorized' ||
                               errorCode === 'storage/canceled' ||
                               errorName === 'NetworkError';
            
            // Check if it's a base64 validation error
            const isBase64Error = errorMessage.includes('Invalid base64') || 
                                 errorMessage.includes('Failed to convert base64') ||
                                 errorMessage.includes('atob');
            
            // If running on localhost, always fall back to direct URL for URL-type media
            const isLocalhost = window.location.hostname === 'localhost' || 
                               window.location.hostname === '127.0.0.1' ||
                               window.location.hostname === '';
            
            // For base64 errors, if we're on localhost or if the base64 is actually valid (just failed conversion),
            // return the data directly. Otherwise, we need to regenerate.
            if (isBase64Error && mediaOptions.dataType === 'base64') {
                const cleanBase64 = (generatedData || '')
                    .replace(/^data:.*;base64,/, '')
                    .replace(/\s+/g, '');
                
                // If base64 is actually valid but conversion failed, return it directly
                if (isValidBase64(cleanBase64)) {
                    console.warn('[Cache] Base64 conversion failed but data is valid. Using data directly.', uploadError);
                    return generatedData as T;
                } else {
                    // Invalid base64 - regenerate
                    console.error('[Cache] Invalid base64 data generated. Cannot use.', uploadError);
                    throw new Error(`Invalid base64 data generated: ${errorMessage}`);
                }
            }
            
            if (isCorsError || isLocalhost) {
                console.warn('[Cache] Storage upload failed (likely CORS issue in local dev). Using data directly.', uploadError);
                // For local development, use the data directly
                // This won't be cached in Firestore, but will work for local testing
                if (mediaOptions.dataType === 'url') {
                    // Return the direct URL for videos
                    return generatedData as T;
                } else if (mediaOptions.dataType === 'base64') {
                    // For base64 audio (TTS), return base64 directly (audioService expects base64)
                    // For other base64 media types, this could be converted to data URL if needed
                    return generatedData as T;
                }
                // If we can't handle it, throw the error
                throw new Error(`Storage upload failed: ${errorMessage}. This is likely a CORS configuration issue. Please configure Firebase Storage CORS or use the deployed version.`);
            }
            // Re-throw other errors
            throw uploadError;
        }
    } else {
        contentToStore = { content: generatedData };
    }

    // 4. Save to Firestore for future reuse
    const newCacheItem: Omit<CachedContent<T>, 'id'> = {
        type,
        topic,
        prompt,
        ...contentToStore,
        createdAt: serverTimestamp(),
        createdBy: userId,
        views: 1,
        likedBy: [],
    };

    await addDoc(contentCacheRef, newCacheItem);
    
    return generatedData;
}
