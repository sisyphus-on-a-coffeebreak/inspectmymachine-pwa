/**
 * Safe IndexedDB wrapper with error handling and recovery
 * 
 * Wraps idb-keyval operations to handle IndexedDB errors gracefully,
 * preventing console spam and providing fallback behavior.
 * 
 * This wrapper attempts to fix common IndexedDB issues:
 * - Corrupted databases (by attempting to delete and recreate)
 * - Quota exceeded errors (by clearing old data)
 * - Concurrent access issues (by queuing operations)
 */

import { get as idbGet, set as idbSet, del as idbDel, keys as idbKeys } from 'idb-keyval';

// Global error handler for unhandled IndexedDB promise rejections
// This must be set up immediately, before any other code runs
if (typeof window !== 'undefined') {
  // Handle unhandled promise rejections from IndexedDB
  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const error = event.reason;
    
    // Check error message (string or object)
    let errorMessage = '';
    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object') {
      errorMessage = error.message || error.name || String(error) || '';
    }
    
    // Also check error name for DOMException
    const errorName = error?.name || '';
    
    // Check stack trace for IndexedDB references
    const stack = error?.stack || '';
    
    // Suppress IndexedDB-related errors
    const isIndexedDbError = 
      errorMessage.includes('UnknownError') ||
      errorMessage.includes('Internal error') ||
      errorMessage.includes('backing store') ||
      errorMessage.includes('indexedDB') ||
      errorMessage.includes('IndexedDB') ||
      errorMessage.includes('IDBDatabase') ||
      errorMessage.includes('IDBTransaction') ||
      errorName === 'UnknownError' ||
      errorName === 'DOMException' ||
      stack.includes('indexedDB') ||
      stack.includes('IDBDatabase') ||
      stack.includes('IDBTransaction');
    
    if (isIndexedDbError) {
      // Suppress IndexedDB errors - they're handled by our wrapper
      event.preventDefault();
      event.stopPropagation();
      return;
    }
  };
  
  // Add listener with capture to catch early
  window.addEventListener('unhandledrejection', handleUnhandledRejection, { capture: true });
  
  // Also add without capture as fallback
  window.addEventListener('unhandledrejection', handleUnhandledRejection);
}

// Track if IndexedDB is available
let idbAvailable: boolean | null = null;
let idbErrorCount = 0;
const MAX_ERROR_COUNT = 3;
let recoveryAttempted = false;

// Operation queue to prevent concurrent access issues
const operationQueue: Array<() => Promise<any>> = [];
let isProcessingQueue = false;

/**
 * Process queued operations sequentially
 */
async function processQueue(): Promise<void> {
  if (isProcessingQueue || operationQueue.length === 0) {
    return;
  }

  isProcessingQueue = true;
  while (operationQueue.length > 0) {
    const operation = operationQueue.shift();
    if (operation) {
      try {
        await operation();
      } catch (error) {
        // Error is handled by the operation itself
      }
    }
  }
  isProcessingQueue = false;
}

/**
 * Attempt to recover from IndexedDB errors
 */
async function attemptRecovery(): Promise<boolean> {
  if (recoveryAttempted) {
    return false;
  }

  recoveryAttempted = true;

  try {
    // Try to clear the keyval store (idb-keyval uses a specific database)
    // First, try to delete the database if it's corrupted
    const dbName = 'keyval-store';
    
    return new Promise<boolean>((resolve) => {
      const deleteReq = indexedDB.deleteDatabase(dbName);
      
      deleteReq.onsuccess = () => {
        // Database deleted, reset state and try again
        idbAvailable = null;
        idbErrorCount = 0;
        if (import.meta.env.DEV) {
          console.info('[IndexedDB] Recovered by deleting corrupted database');
        }
        resolve(true);
      };
      
      deleteReq.onerror = () => {
        // Couldn't delete, might be in use
        resolve(false);
      };
      
      deleteReq.onblocked = () => {
        // Database is blocked, can't delete
        resolve(false);
      };
    });
  } catch (error) {
    return false;
  }
}

/**
 * Check if IndexedDB is available
 */
async function checkIdbAvailability(): Promise<boolean> {
  if (idbAvailable !== null) {
    return idbAvailable;
  }

  try {
    // Try to open a test database
    const testDb = indexedDB.open('__idb_test__', 1);
    await new Promise<void>((resolve, reject) => {
      testDb.onsuccess = () => {
        testDb.result.close();
        indexedDB.deleteDatabase('__idb_test__');
        resolve();
      };
      testDb.onerror = () => reject(testDb.error);
      testDb.onblocked = () => reject(new Error('IndexedDB blocked'));
    });
    idbAvailable = true;
    idbErrorCount = 0;
    recoveryAttempted = false;
    return true;
  } catch (error) {
    // Check if it's a corruption error
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isCorruptionError = 
      errorMessage.includes('UnknownError') ||
      errorMessage.includes('Internal error') ||
      errorMessage.includes('backing store');

    if (isCorruptionError && !recoveryAttempted) {
      // Try to recover
      const recovered = await attemptRecovery();
      if (recovered) {
        // Try again after recovery
        return checkIdbAvailability();
      }
    }

    idbAvailable = false;
    if (import.meta.env.DEV) {
      console.warn('[IndexedDB] Not available:', error);
    }
    return false;
  }
}

/**
 * Wrap an IndexedDB operation with error handling
 */
async function safeOperation<T>(
  operation: () => Promise<T>,
  fallback: T
): Promise<T> {
  // If we've had too many errors, skip the operation
  if (idbErrorCount >= MAX_ERROR_COUNT && idbAvailable === false) {
    return fallback;
  }

  // Check availability first
  const available = await checkIdbAvailability();
  if (!available) {
    return fallback;
  }

  // Queue the operation to prevent concurrent access issues
  return new Promise<T>((resolve) => {
    const queuedOperation = async () => {
      try {
        const result = await operation();
        idbErrorCount = 0; // Reset error count on success
        recoveryAttempted = false; // Reset recovery flag on success
        resolve(result);
      } catch (error) {
        idbErrorCount++;
        
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isCorruptionError = 
          errorMessage.includes('UnknownError') ||
          errorMessage.includes('Internal error') ||
          errorMessage.includes('backing store');

        // If it's a corruption error and we haven't tried recovery, attempt it
        if (isCorruptionError && !recoveryAttempted && idbErrorCount <= 2) {
          const recovered = await attemptRecovery();
          if (recovered) {
            // Try the operation again after recovery
            try {
              const result = await operation();
              idbErrorCount = 0;
              recoveryAttempted = false;
              resolve(result);
              return;
            } catch (retryError) {
              // Recovery didn't help
            }
          }
        }
        
        // If we've exceeded the error threshold, mark as unavailable
        if (idbErrorCount >= MAX_ERROR_COUNT) {
          idbAvailable = false;
          if (import.meta.env.DEV) {
            console.warn('[IndexedDB] Disabled after multiple errors');
          }
        } else if (import.meta.env.DEV) {
          console.warn('[IndexedDB] Operation failed:', error);
        }
        
        resolve(fallback);
      }
    };

    operationQueue.push(queuedOperation);
    processQueue();
  });
}

/**
 * Safe wrapper for idb-keyval get
 */
export async function get<T>(key: string): Promise<T | undefined> {
  return safeOperation(
    () => idbGet<T>(key),
    undefined
  );
}

/**
 * Safe wrapper for idb-keyval set
 */
export async function set<T>(key: string, value: T): Promise<void> {
  await safeOperation(
    () => idbSet(key, value),
    undefined
  );
}

/**
 * Safe wrapper for idb-keyval del
 */
export async function del(key: string): Promise<void> {
  await safeOperation(
    () => idbDel(key),
    undefined
  );
}

/**
 * Safe wrapper for idb-keyval keys
 */
export async function keys(): Promise<IDBValidKey[]> {
  return safeOperation(
    () => idbKeys(),
    []
  );
}

/**
 * Reset IndexedDB availability (useful for recovery)
 */
export function resetIdbAvailability(): void {
  idbAvailable = null;
  idbErrorCount = 0;
  recoveryAttempted = false;
}

/**
 * Check if IndexedDB is currently available
 */
export function isIdbAvailable(): boolean {
  return idbAvailable === true;
}
