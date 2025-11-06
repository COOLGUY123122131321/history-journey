/**
 * Shared AI Content Caching System
 * 
 * Provides a simple API for fetching or generating AI content with Firestore caching.
 * This system ensures that identical requests reuse cached content, saving API costs
 * and improving response times.
 */

import { db } from './firebase';
import {
  collection,
  query,
  where,
  limit,
  getDocs,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
  increment,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { generateAIResponse, AIResponse } from './aiService';

/**
 * Content type for different kinds of AI-generated content
 */
export type ContentType = 'explanation' | 'video' | 'quiz' | 'question' | 'image' | 'text';

/**
 * Cached content document structure in Firestore
 */
export interface CachedContentDocument {
  prompt: string;
  topic: string;
  type: ContentType;
  text: string;
  imageUrl?: string;
  videoUrl?: string;
  createdAt: any; // Firestore Timestamp
  views?: number; // Track how many times this content was used
  createdBy?: string; // User ID who first generated this content
}

/**
 * Result of fetchOrGenerateContent with cache status
 */
export interface ContentResult extends CachedContentDocument {
  fromCache: boolean; // true if loaded from cache, false if newly generated
}

/**
 * Generate a hash of the prompt for use as document ID (optional optimization)
 */
function hashPrompt(prompt: string): string {
  let hash = 0;
  for (let i = 0; i < prompt.length; i++) {
    const char = prompt.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Main function: Fetch content from cache or generate new content
 * 
 * @param prompt - The user's question or command (e.g., "Explain Napoleon's rise to power")
 * @param type - Type of content: 'explanation', 'video', 'quiz', etc.
 * @param topic - Topic category (e.g., "Napoleon", "French Revolution")
 * @param userId - Optional user ID for attribution
 * @returns ContentResult with the content and cache status
 * 
 * @example
 * ```typescript
 * const result = await fetchOrGenerateContent(
 *   "Explain Napoleon's rise to power",
 *   "explanation",
 *   "Napoleon",
 *   user.uid
 * );
 * 
 * if (result.fromCache) {
 *   console.log("✅ Loaded from cache");
 * } else {
 *   console.log("✨ Generated with AI");
 * }
 * ```
 */
export async function fetchOrGenerateContent(
  prompt: string,
  type: ContentType,
  topic: string,
  userId?: string
): Promise<ContentResult> {
  const cacheRef = collection(db, 'content_cache');

  // 1. Check Firestore cache
  const q = query(
    cacheRef,
    where('prompt', '==', prompt),
    where('type', '==', type),
    limit(1)
  );

  const snapshot = await getDocs(q);

  // 2. If found in cache, return it
  if (!snapshot.empty) {
    const cachedDoc = snapshot.docs[0] as QueryDocumentSnapshot<CachedContentDocument>;
    const cachedData = cachedDoc.data();

    // Increment views asynchronously (don't wait for it)
    const docRef = doc(cacheRef, cachedDoc.id);
    updateDoc(docRef, {
      views: increment(1),
    }).catch(err => console.error('Failed to increment views:', err));

    console.log(`✅ [Cache HIT] Loaded from cache - ${type}: ${topic}`);
    
    return {
      ...cachedData,
      fromCache: true,
    };
  }

  // 3. Not found in cache - generate new content
  console.log(`✨ [Cache MISS] Generating new content - ${type}: ${topic}`);
  
  const aiResponse = await generateAIResponse(prompt, type, topic, userId);

  // 4. Prepare document for Firestore
  const newDoc: Omit<CachedContentDocument, 'createdAt'> & { createdAt: any } = {
    prompt,
    topic,
    type,
    text: aiResponse.text || '',
    imageUrl: aiResponse.imageUrl,
    videoUrl: aiResponse.videoUrl,
    views: 1,
    createdBy: userId,
    createdAt: serverTimestamp(),
  };

  // 5. Save to Firestore
  try {
    await addDoc(cacheRef, newDoc);
    console.log(`💾 Saved new content to cache - ${type}: ${topic}`);
  } catch (error) {
    console.error('Failed to save content to cache:', error);
    // Continue even if cache save fails - we still return the content
  }

  // 6. Return the new content
  return {
    ...newDoc,
    createdAt: new Date(), // Use Date for returned value since serverTimestamp is a placeholder
    fromCache: false,
  };
}

/**
 * Fetch multiple cached items by topic
 * Useful for displaying related content or analytics
 */
export async function fetchCachedContentByTopic(
  topic: string,
  type?: ContentType
): Promise<CachedContentDocument[]> {
  const cacheRef = collection(db, 'content_cache');
  
  let q;
  if (type) {
    q = query(
      cacheRef,
      where('topic', '==', topic),
      where('type', '==', type)
    );
  } else {
    q = query(cacheRef, where('topic', '==', topic));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as CachedContentDocument);
}

/**
 * Get cache statistics for a topic
 */
export async function getCacheStats(topic: string): Promise<{
  totalItems: number;
  totalViews: number;
  byType: Record<ContentType, number>;
}> {
  const items = await fetchCachedContentByTopic(topic);
  
  const stats = {
    totalItems: items.length,
    totalViews: items.reduce((sum, item) => sum + (item.views || 0), 0),
    byType: {} as Record<ContentType, number>,
  };

  items.forEach(item => {
    stats.byType[item.type] = (stats.byType[item.type] || 0) + 1;
  });

  return stats;
}

