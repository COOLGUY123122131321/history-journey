// services/clientCacheService.ts

import { StudyMaterial, PersonalJourney, JourneyProgress, TTSCache, ProgressAnalytics } from '../types';

interface CacheEntry<T> {
  key: string;
  data: T;
  timestamp: number;
  expiresAt?: number; // For time-based expiration
  version: number; // For invalidation
}

interface CacheConfig {
  maxAge: number; // milliseconds
  maxEntries: number;
}

class ClientCacheService {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'HistoryJourneyCache';
  private readonly dbVersion = 1;

  private readonly configs = {
    materials: { maxAge: 24 * 60 * 60 * 1000, maxEntries: 100 }, // 24 hours
    journeys: { maxAge: 24 * 60 * 60 * 1000, maxEntries: 50 },
    progress: { maxAge: 60 * 60 * 1000, maxEntries: 200 }, // 1 hour
    tts: { maxAge: 7 * 24 * 60 * 60 * 1000, maxEntries: 500 }, // 7 days
    analytics: { maxAge: 60 * 60 * 1000, maxEntries: 100 },
  };

  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create stores for each data type
        const stores = ['materials', 'journeys', 'progress', 'tts', 'analytics'];

        stores.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'key' });
            store.createIndex('timestamp', 'timestamp');
            store.createIndex('expiresAt', 'expiresAt');
          }
        });
      };
    });
  }

  private async ensureDB(): Promise<void> {
    if (!this.db) {
      await this.init();
    }
  }

  private async getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    await this.ensureDB();
    const transaction = this.db!.transaction([storeName], mode);
    return transaction.objectStore(storeName);
  }

  // ===== GENERIC CACHE METHODS =====

  async set<T>(storeName: string, key: string, data: T, config?: Partial<CacheConfig>): Promise<void> {
    const cacheConfig = { ...this.configs[storeName as keyof typeof this.configs], ...config };

    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + cacheConfig.maxAge,
      version: 1,
    };

    const store = await this.getStore(storeName, 'readwrite');
    await new Promise<void>((resolve, reject) => {
      const request = store.put(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    // Clean up old entries
    await this.cleanup(storeName, cacheConfig.maxEntries);
  }

  async get<T>(storeName: string, key: string): Promise<T | null> {
    const store = await this.getStore(storeName);

    return new Promise<T | null>((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        const entry: CacheEntry<T> = request.result;
        if (!entry) {
          resolve(null);
          return;
        }

        // Check if expired
        if (entry.expiresAt && Date.now() > entry.expiresAt) {
          this.delete(storeName, key); // Clean up expired entry
          resolve(null);
          return;
        }

        resolve(entry.data);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, key: string): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName: string): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');

    await new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async cleanup(storeName: string, maxEntries: number): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');

    const entries = await new Promise<CacheEntry<any>[]>((resolve, reject) => {
      const request = store.index('timestamp').openCursor(null, 'prev');
      const results: CacheEntry<any>[] = [];

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });

    // Remove expired entries
    const expiredEntries = entries.filter(entry =>
      entry.expiresAt && Date.now() > entry.expiresAt
    );

    for (const entry of expiredEntries) {
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(entry.key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }

    // Remove oldest entries if over limit
    const validEntries = entries.filter(entry =>
      !entry.expiresAt || Date.now() <= entry.expiresAt
    );

    if (validEntries.length > maxEntries) {
      const toDelete = validEntries.slice(maxEntries);
      for (const entry of toDelete) {
        await new Promise<void>((resolve, reject) => {
          const request = store.delete(entry.key);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
    }
  }

  // ===== SPECIFIC CACHE METHODS =====

  // Materials cache
  async setMaterials(userId: string, materials: StudyMaterial[]): Promise<void> {
    await this.set('materials', `user_${userId}_materials`, materials);
  }

  async getMaterials(userId: string): Promise<StudyMaterial[] | null> {
    return this.get<StudyMaterial[]>('materials', `user_${userId}_materials`);
  }

  async setMaterial(userId: string, materialId: string, material: StudyMaterial): Promise<void> {
    await this.set('materials', `user_${userId}_material_${materialId}`, material);
  }

  async getMaterial(userId: string, materialId: string): Promise<StudyMaterial | null> {
    return this.get<StudyMaterial>('materials', `user_${userId}_material_${materialId}`);
  }

  // Journeys cache
  async setJourneys(userId: string, journeys: PersonalJourney[]): Promise<void> {
    await this.set('journeys', `user_${userId}_journeys`, journeys);
  }

  async getJourneys(userId: string): Promise<PersonalJourney[] | null> {
    return this.get<PersonalJourney[]>('journeys', `user_${userId}_journeys`);
  }

  async setJourney(userId: string, journeyId: string, journey: PersonalJourney): Promise<void> {
    await this.set('journeys', `user_${userId}_journey_${journeyId}`, journey);
  }

  async getJourney(userId: string, journeyId: string): Promise<PersonalJourney | null> {
    return this.get<PersonalJourney>('journeys', `user_${userId}_journey_${journeyId}`);
  }

  // Progress cache
  async setProgress(userId: string, journeyId: string, progress: JourneyProgress): Promise<void> {
    await this.set('progress', `user_${userId}_progress_${journeyId}`, progress, { maxAge: 15 * 60 * 1000 }); // 15 minutes
  }

  async getProgress(userId: string, journeyId: string): Promise<JourneyProgress | null> {
    return this.get<JourneyProgress>('progress', `user_${userId}_progress_${journeyId}`);
  }

  // TTS cache
  async setTTS(hash: string, ttsData: TTSCache): Promise<void> {
    await this.set('tts', `tts_${hash}`, ttsData);
  }

  async getTTS(hash: string): Promise<TTSCache | null> {
    return this.get<TTSCache>('tts', `tts_${hash}`);
  }

  // Analytics cache
  async setAnalytics(userId: string, analytics: ProgressAnalytics[]): Promise<void> {
    await this.set('analytics', `user_${userId}_analytics`, analytics);
  }

  async getAnalytics(userId: string): Promise<ProgressAnalytics[] | null> {
    return this.get<ProgressAnalytics[]>('analytics', `user_${userId}_analytics`);
  }

  // ===== INVALIDATION METHODS =====

  async invalidateUserData(userId: string): Promise<void> {
    const stores = ['materials', 'journeys', 'progress', 'analytics'];

    for (const store of stores) {
      const storeInstance = await this.getStore(store, 'readwrite');

      await new Promise<void>((resolve, reject) => {
        const request = storeInstance.openCursor();
        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            const key = cursor.key as string;
            if (key.startsWith(`user_${userId}_`)) {
              cursor.delete();
            }
            cursor.continue();
          } else {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });
    }
  }

  async invalidateJourneyData(userId: string, journeyId: string): Promise<void> {
    await this.delete('journeys', `user_${userId}_journey_${journeyId}`);
    await this.delete('progress', `user_${userId}_progress_${journeyId}`);
  }

  // ===== OFFLINE SUPPORT =====

  async getOfflineData(): Promise<{
    materials: StudyMaterial[];
    journeys: PersonalJourney[];
    progress: JourneyProgress[];
  }> {
    // This would be used when the app is offline
    // For now, return cached data
    return {
      materials: [],
      journeys: [],
      progress: [],
    };
  }

  async storeOfflineAction(action: {
    type: string;
    payload: any;
    timestamp: number;
  }): Promise<void> {
    // Store actions to sync when back online
    const actions = await this.get('analytics', 'offline_actions') || [];
    actions.push(action);
    await this.set('analytics', 'offline_actions', actions, { maxAge: 7 * 24 * 60 * 60 * 1000 }); // Keep for 7 days
  }

  async getOfflineActions(): Promise<any[]> {
    return this.get('analytics', 'offline_actions') || [];
  }

  async clearOfflineActions(): Promise<void> {
    await this.delete('analytics', 'offline_actions');
  }
}

// Singleton instance
export const clientCache = new ClientCacheService();

// Initialize cache when imported
if (typeof window !== 'undefined') {
  clientCache.init().catch(console.error);
}
