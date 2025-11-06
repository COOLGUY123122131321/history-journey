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

// Helper to convert base64 to blob for uploading
function base64ToBlob(base64: string, contentType: string = ''): Blob {
    const byteCharacters = atob(base64);
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
        
        // Increment views count asynchronously
        await updateDoc(doc(contentCacheRef, cachedDoc.id), {
            views: increment(1)
        });
        
        console.log(`[Cache] HIT for type: ${type}, topic: ${topic}`);
        return (mediaOptions ? cachedData.url : cachedData.content) as T;
    }

    console.log(`[Cache] MISS for type: ${type}, topic: ${topic}. Generating...`);
    // 2. If not found, generate with AI
    const generatedData = await generatorFn();

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
            
            // If running on localhost, always fall back to direct URL for URL-type media
            const isLocalhost = window.location.hostname === 'localhost' || 
                               window.location.hostname === '127.0.0.1' ||
                               window.location.hostname === '';
            
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
