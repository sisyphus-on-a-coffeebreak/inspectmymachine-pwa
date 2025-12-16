/**
 * Offline Request Queue
 * 
 * Queues failed API requests when offline or when network errors occur,
 * and automatically retries them when connection is restored.
 * Uses IndexedDB for persistent storage.
 */

import { get, set, del, keys } from './idb-safe';
import { apiClient } from './apiClient';
import { isNetworkError, isRetryableError } from './errorHandling';
import type { ApiRequestConfig } from './apiClient';
import { logger } from './logger';

const QUEUE_PREFIX = 'offline-queue:';
const QUEUE_INDEX_KEY = 'offline-queue-index';

export interface QueuedRequest {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  data?: unknown;
  config?: ApiRequestConfig;
  timestamp: number;
  retryCount: number;
  lastError?: string;
}

export interface QueueStats {
  total: number;
  pending: number;
  failed: number;
}

class OfflineQueue {
  private listeners: Set<(stats: QueueStats) => void> = new Set();
  private retryInterval: number | null = null;
  private isOnline: boolean = navigator.onLine;

  constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners();
    });

    // Start periodic retry when online
    if (this.isOnline) {
      this.startRetryInterval();
    }
  }

  /**
   * Generate unique ID for queued request
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get all queued request IDs
   */
  private async getQueueIds(): Promise<string[]> {
    const index = await get<string[]>(QUEUE_INDEX_KEY);
    return index || [];
  }

  /**
   * Update queue index
   */
  private async updateQueueIndex(ids: string[]): Promise<void> {
    await set(QUEUE_INDEX_KEY, ids);
  }

  /**
   * Add request to queue
   */
  async enqueue(
    method: QueuedRequest['method'],
    path: string,
    data?: unknown,
    config?: ApiRequestConfig,
    error?: unknown
  ): Promise<string> {
    const id = this.generateId();
    const request: QueuedRequest = {
      id,
      method,
      path,
      data,
      config,
      timestamp: Date.now(),
      retryCount: 0,
      lastError: error instanceof Error ? error.message : String(error),
    };

    await set(`${QUEUE_PREFIX}${id}`, request);
    
    const queueIds = await this.getQueueIds();
    queueIds.push(id);
    await this.updateQueueIndex(queueIds);

    this.notifyListeners();

    // If online, try to process immediately
    if (this.isOnline) {
      this.processQueue();
    }

    return id;
  }

  /**
   * Remove request from queue
   */
  async dequeue(id: string): Promise<void> {
    await del(`${QUEUE_PREFIX}${id}`);
    
    const queueIds = await this.getQueueIds();
    const filtered = queueIds.filter(queueId => queueId !== id);
    await this.updateQueueIndex(filtered);

    this.notifyListeners();
  }

  /**
   * Get queued request by ID
   */
  async get(id: string): Promise<QueuedRequest | undefined> {
    return await get<QueuedRequest>(`${QUEUE_PREFIX}${id}`);
  }

  /**
   * Get all queued requests
   */
  async getAll(): Promise<QueuedRequest[]> {
    const queueIds = await this.getQueueIds();
    const requests = await Promise.all(
      queueIds.map(id => this.get(id))
    );
    return requests.filter((req): req is QueuedRequest => req !== undefined);
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<QueueStats> {
    const requests = await this.getAll();
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    return {
      total: requests.length,
      pending: requests.filter(r => r.retryCount < 5 && (now - r.timestamp) < 24 * 60 * 60 * 1000).length,
      failed: requests.filter(r => r.retryCount >= 5 || (now - r.timestamp) >= 24 * 60 * 60 * 1000).length,
    };
  }

  /**
   * Process queued requests
   */
  async processQueue(): Promise<void> {
    if (!this.isOnline) {
      return;
    }

    const requests = await this.getAll();
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const maxRetries = 5;

    // Filter out old requests and requests that exceeded retry limit
    const validRequests = requests.filter(req => {
      const age = now - req.timestamp;
      return age < maxAge && req.retryCount < maxRetries;
    });

    // Remove invalid requests
    for (const req of requests) {
      if (!validRequests.includes(req)) {
        await this.dequeue(req.id);
      }
    }

    // Process valid requests
    for (const request of validRequests) {
      try {
        await this.retryRequest(request);
      } catch (error) {
        // Request failed again, increment retry count
        request.retryCount++;
        request.lastError = error instanceof Error ? error.message : String(error);
        await set(`${QUEUE_PREFIX}${request.id}`, request);
      }
    }

    this.notifyListeners();
  }

  /**
   * Retry a queued request
   */
  private async retryRequest(request: QueuedRequest): Promise<void> {
    let response;

    switch (request.method) {
      case 'GET':
        response = await apiClient.get(request.path, request.config);
        break;
      case 'POST':
        response = await apiClient.post(request.path, request.data, request.config);
        break;
      case 'PUT':
        response = await apiClient.put(request.path, request.data, request.config);
        break;
      case 'PATCH':
        response = await apiClient.patch(request.path, request.data, request.config);
        break;
      case 'DELETE':
        response = await apiClient.delete(request.path, request.config);
        break;
      default:
        throw new Error(`Unsupported method: ${request.method}`);
    }

    // Request succeeded, remove from queue
    await this.dequeue(request.id);
  }

  /**
   * Clear all queued requests
   */
  async clear(): Promise<void> {
    const queueIds = await this.getQueueIds();
    
    await Promise.all(
      queueIds.map(id => del(`${QUEUE_PREFIX}${id}`))
    );
    
    await this.updateQueueIndex([]);
    this.notifyListeners();
  }

  /**
   * Clear failed requests (exceeded retry limit or too old)
   */
  async clearFailed(): Promise<void> {
    const requests = await this.getAll();
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const maxRetries = 5;

    const failedRequests = requests.filter(req => {
      const age = now - req.timestamp;
      return age >= maxAge || req.retryCount >= maxRetries;
    });

    await Promise.all(
      failedRequests.map(req => this.dequeue(req.id))
    );

    this.notifyListeners();
  }

  /**
   * Subscribe to queue updates
   */
  subscribe(listener: (stats: QueueStats) => void): () => void {
    this.listeners.add(listener);
    
    // Immediately notify with current stats (with error handling)
    this.getStats()
      .then(stats => listener(stats))
      .catch(() => {
        // Silently handle errors - IndexedDB might be unavailable
        listener({ total: 0, pending: 0, failed: 0 });
      });

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of queue changes
   */
  private async notifyListeners(): Promise<void> {
    try {
      const stats = await this.getStats();
      this.listeners.forEach(listener => {
        try {
          listener(stats);
        } catch (error) {
          // Error in queue listener - handled gracefully
          if (import.meta.env.DEV) {
            logger.error('Error in queue listener', error, 'offlineQueue');
          }
        }
      });
    } catch (error) {
      // IndexedDB error - notify with empty stats
      const emptyStats: QueueStats = { total: 0, pending: 0, failed: 0 };
      this.listeners.forEach(listener => {
        try {
          listener(emptyStats);
        } catch (listenerError) {
          // Ignore listener errors
        }
      });
    }
  }

  /**
   * Start periodic retry interval
   */
  private startRetryInterval(): void {
    if (this.retryInterval) {
      return;
    }

    // Retry every 30 seconds when online
    this.retryInterval = window.setInterval(() => {
      if (this.isOnline) {
        this.processQueue();
      }
    }, 30000);
  }

  /**
   * Stop periodic retry interval
   */
  private stopRetryInterval(): void {
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
      this.retryInterval = null;
    }
  }

  /**
   * Check if currently online
   */
  isCurrentlyOnline(): boolean {
    return this.isOnline;
  }
}

// Export singleton instance
export const offlineQueue = new OfflineQueue();


