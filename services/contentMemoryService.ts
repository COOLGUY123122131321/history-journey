// services/contentMemoryService.ts

import { db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  updateDoc,
  increment,
  deleteDoc,
} from 'firebase/firestore';
import { StudyMaterial, PersonalJourney, JourneyProgress, TTSCache, ProgressAnalytics } from '../types';

export interface LearningProgress {
  userId: string;
  materialId: string;
  journeyId: string;
  completedScenes: number;
  totalScenes: number;
  score: number;
  timeSpent: number; // minutes
  lastAccessed: Date;
  masteryLevel: 'novice' | 'apprentice' | 'expert' | 'master';
  weakPoints: string[]; // Topics that need review
  strongPoints: string[]; // Topics mastered
}

/**
 * Saves study material to Firestore
 */
export async function saveStudyMaterial(
  material: Omit<StudyMaterial, 'createdAt'>
): Promise<StudyMaterial> {
  const materialRef = doc(collection(db, `users/${material.userId}/materials`), material.uploadId);
  const materialData = {
    ...material,
    createdAt: serverTimestamp(),
  };

  await setDoc(materialRef, materialData);

  return {
    ...materialData,
    createdAt: new Date(),
  } as StudyMaterial;
}

/**
 * Gets all study materials for a user
 */
export async function getUserStudyMaterials(userId: string): Promise<StudyMaterial[]> {
  const q = query(
    collection(db, `users/${userId}/materials`),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    uploadId: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as StudyMaterial[];
}

// ===== JOURNEY MANAGEMENT =====

/**
 * Saves a personal journey
 */
export async function savePersonalJourney(
  journey: Omit<PersonalJourney, 'createdAt'>
): Promise<PersonalJourney> {
  const journeyRef = doc(collection(db, `users/${journey.userId}/journeys`), journey.journeyId);
  const journeyData = {
    ...journey,
    createdAt: serverTimestamp(),
  };

  await setDoc(journeyRef, journeyData);

  return {
    ...journeyData,
    createdAt: new Date(),
  } as PersonalJourney;
}

/**
 * Gets all journeys for a user
 */
export async function getUserJourneys(userId: string): Promise<PersonalJourney[]> {
  const q = query(
    collection(db, `users/${userId}/journeys`),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    journeyId: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as PersonalJourney[];
}

/**
 * Gets a specific journey
 */
export async function getJourney(userId: string, journeyId: string): Promise<PersonalJourney | null> {
  const journeyRef = doc(db, `users/${userId}/journeys`, journeyId);
  const snapshot = await getDoc(journeyRef);

  if (!snapshot.exists()) return null;

  return {
    journeyId: snapshot.id,
    ...snapshot.data(),
    createdAt: snapshot.data().createdAt?.toDate() || new Date(),
  } as PersonalJourney;
}

// ===== PROGRESS TRACKING =====

/**
 * Saves journey progress
 */
export async function saveJourneyProgress(
  progress: Omit<JourneyProgress, 'reviewedAt'>
): Promise<void> {
  const progressRef = doc(collection(db, `users/${progress.userId}/progress`), progress.journeyId);

  await setDoc(progressRef, {
    ...progress,
    reviewedAt: serverTimestamp(),
  }, { merge: true });
}

/**
 * Gets journey progress
 */
export async function getJourneyProgress(userId: string, journeyId: string): Promise<JourneyProgress | null> {
  const progressRef = doc(db, `users/${userId}/progress`, journeyId);
  const snapshot = await getDoc(progressRef);

  if (!snapshot.exists()) return null;

  return {
    journeyId: snapshot.id,
    ...snapshot.data(),
    reviewedAt: snapshot.data().reviewedAt?.toDate() || new Date(),
  } as JourneyProgress;
}

// ===== TTS CACHE MANAGEMENT =====

/**
 * Saves TTS cache entry
 */
export async function saveTTSCache(cache: TTSCache): Promise<void> {
  const cacheRef = doc(collection(db, 'tts_cache'), cache.hash);
  await setDoc(cacheRef, {
    ...cache,
    createdAt: serverTimestamp(),
  });
}

/**
 * Gets TTS cache entry
 */
export async function getTTSCache(hash: string): Promise<TTSCache | null> {
  const cacheRef = doc(db, 'tts_cache', hash);
  const snapshot = await getDoc(cacheRef);

  if (!snapshot.exists()) return null;

  return {
    hash: snapshot.id,
    ...snapshot.data(),
    createdAt: snapshot.data().createdAt?.toDate() || new Date(),
  } as TTSCache;
}

// ===== ANALYTICS =====

/**
 * Saves progress analytics
 */
export async function saveProgressAnalytics(analytics: ProgressAnalytics): Promise<void> {
  const analyticsRef = doc(collection(db, `users/${analytics.userId}/analytics`), analytics.journeyId);
  await setDoc(analyticsRef, analytics, { merge: true });
}

/**
 * Gets analytics for a journey
 */
export async function getJourneyAnalytics(userId: string, journeyId: string): Promise<ProgressAnalytics | null> {
  const analyticsRef = doc(db, `users/${userId}/analytics`, journeyId);
  const snapshot = await getDoc(analyticsRef);

  if (!snapshot.exists()) return null;

  return snapshot.data() as ProgressAnalytics;
}

/**
 * Gets all user analytics for insights
 */
export async function getUserAnalytics(userId: string): Promise<ProgressAnalytics[]> {
  const q = query(collection(db, `users/${userId}/analytics`));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    journeyId: doc.id,
    ...doc.data(),
  })) as ProgressAnalytics[];
}

// ===== LEGACY FUNCTIONS (KEPT FOR COMPATIBILITY) =====

/**
 * Gets learning progress for a material (legacy - use getJourneyProgress instead)
 */
export async function getLearningProgress(
  userId: string,
  materialId: string
): Promise<JourneyProgress | null> {
  // For backward compatibility, try to find a journey for this material
  const q = query(
    collection(db, `users/${userId}/journeys`),
    where('sourceMaterialId', '==', materialId)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const journeyId = snapshot.docs[0].id;
  return getJourneyProgress(userId, journeyId);
}

/**
 * Updates mastery level based on progress
 */
export function calculateMasteryLevel(progress: JourneyProgress): 'novice' | 'apprentice' | 'expert' | 'master' {
  const completionRate = progress.completed ? 1 : progress.step / 10; // Rough estimate
  const scoreRate = progress.xpEarned / 100;

  if (completionRate >= 0.9 && scoreRate >= 0.9) {
    return 'master';
  } else if (completionRate >= 0.7 && scoreRate >= 0.7) {
    return 'expert';
  } else if (completionRate >= 0.5 && scoreRate >= 0.5) {
    return 'apprentice';
  }
  return 'novice';
}

/**
 * Gets materials that need review based on analytics
 */
export async function getMaterialsForReview(userId: string): Promise<StudyMaterial[]> {
  const analytics = await getUserAnalytics(userId);

  // Find journeys with low completion rates or high confusion tags
  const reviewJourneyIds = analytics
    .filter(a => a.completionRate < 0.8 || a.confusionTags.length > 0)
    .map(a => a.journeyId);

  const materials: StudyMaterial[] = [];
  for (const journeyId of reviewJourneyIds.slice(0, 5)) {
    const journey = await getJourney(userId, journeyId);
    if (journey?.sourceMaterialId) {
      const material = await getDoc(doc(db, `users/${userId}/materials`, journey.sourceMaterialId));
      if (material.exists()) {
        materials.push({
          uploadId: material.id,
          ...material.data(),
          createdAt: material.data().createdAt?.toDate() || new Date(),
        } as StudyMaterial);
      }
    }
  }

  return materials;
}

/**
 * Suggests follow-up lessons based on completed materials
 */
export async function suggestFollowUpLessons(
  userId: string,
  completedMaterialId: string
): Promise<StudyMaterial[]> {
  const completedMaterial = await getDoc(doc(db, `users/${userId}/materials`, completedMaterialId));
  if (!completedMaterial.exists()) return [];

  const material = completedMaterial.data() as StudyMaterial;

  // Find materials with related topics
  const q = query(
    collection(db, `users/${userId}/materials`),
    where('topics', 'array-contains-any', material.topics.slice(0, 10)), // Firestore limit
    limit(5)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs
    .filter(doc => doc.id !== completedMaterialId)
    .map(doc => ({
      uploadId: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as StudyMaterial[];
}

/**
 * Tracks study session (legacy - use saveProgressAnalytics instead)
 */
export async function trackStudySession(
  userId: string,
  materialId: string,
  duration: number // minutes
): Promise<void> {
  // Find related journey and update analytics
  const q = query(
    collection(db, `users/${userId}/journeys`),
    where('sourceMaterialId', '==', materialId)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return;

  const journeyId = snapshot.docs[0].id;
  const existingAnalytics = await getJourneyAnalytics(userId, journeyId);

  if (existingAnalytics) {
    await saveProgressAnalytics({
      ...existingAnalytics,
      timeSpent: existingAnalytics.timeSpent + duration,
      sessionEnd: new Date(),
    });
  }
}

