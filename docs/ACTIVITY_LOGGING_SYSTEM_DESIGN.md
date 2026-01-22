# Activity Logging System - Comprehensive Design Document

**Version:** 1.0  
**Date:** January 2025  
**Status:** Design Phase  
**Priority:** CRITICAL

---

## Executive Summary

This document provides a comprehensive design for a complete activity logging system that automatically tracks all user actions across the VOMS PWA application. The system is designed to be:

- **Automatic:** No manual logging required
- **Comprehensive:** Tracks all user actions
- **Performant:** Minimal impact on application performance
- **Reliable:** Works offline and handles failures gracefully
- **Secure:** Protects sensitive data and enforces access control
- **Scalable:** Handles high volumes of activity logs
- **Compliant:** Meets regulatory requirements

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Data Model](#data-model)
4. [Frontend Implementation](#frontend-implementation)
5. [Backend Implementation](#backend-implementation)
6. [API Design](#api-design)
7. [Security & Privacy](#security--privacy)
8. [Performance Considerations](#performance-considerations)
9. [Data Retention & Archival](#data-retention--archival)
10. [UI Components](#ui-components)
11. [Integration Guide](#integration-guide)
12. [Testing Strategy](#testing-strategy)
13. [Monitoring & Maintenance](#monitoring--maintenance)

---

## 1. System Overview

### 1.1 Purpose

The activity logging system provides:
- **Audit Trail:** Complete history of all user actions
- **Compliance:** Meet regulatory requirements (GDPR, SOX, etc.)
- **Security:** Track security events and suspicious activities
- **Debugging:** Help diagnose issues and understand user behavior
- **Analytics:** Understand usage patterns and optimize workflows

### 1.2 Key Requirements

#### Functional Requirements
- ✅ Automatically log all user actions
- ✅ Support offline logging with sync
- ✅ Provide search and filtering capabilities
- ✅ Support export functionality
- ✅ Real-time updates for administrators
- ✅ Activity timeline for users/resources

#### Non-Functional Requirements
- ✅ Performance: < 10ms overhead per action
- ✅ Reliability: 99.9% log delivery rate
- ✅ Scalability: Support 1M+ logs per day
- ✅ Security: No sensitive data in logs
- ✅ Compliance: Configurable retention policies

### 1.3 Scope

**In Scope:**
- All CRUD operations
- Authentication events
- Permission changes
- Data access
- Export/import operations
- System events
- API calls

**Out of Scope (Future):**
- Performance metrics logging
- Error tracking (separate system)
- User analytics (separate system)

---

## 2. Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Layer                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │   Components      │         │   API Client      │          │
│  │   (React)         │         │   (Axios)         │          │
│  └────────┬─────────┘         └────────┬─────────┘          │
│           │                              │                      │
│           │                              │                      │
│           ▼                              ▼                      │
│  ┌──────────────────────────────────────────────────┐          │
│  │      Activity Logging Middleware                 │          │
│  │  - Intercepts API calls                          │          │
│  │  - Extracts action context                       │          │
│  │  - Creates log entries                           │          │
│  └──────────────────────────────────────────────────┘          │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │   Activity       │         │   Activity        │          │
│  │   Logger         │────────▶│   Queue          │          │
│  │   Service        │         │   (IndexedDB)    │          │
│  └──────────────────┘         └──────────────────┘          │
│           │                                                      │
│           │ (Batch Upload)                                      │
│           ▼                                                      │
└───────────┼──────────────────────────────────────────────────────┘
            │
            │ HTTPS
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Backend Layer                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │   Activity Log   │         │   Activity Log   │          │
│  │   API            │────────▶│   Service        │          │
│  │   (Laravel)      │         │   (Laravel)      │          │
│  └──────────────────┘         └──────────────────┘          │
│           │                              │                      │
│           │                              │                      │
│           ▼                              ▼                      │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │   activity_logs  │         │   activity_log_  │          │
│  │   Table          │         │   archives       │          │
│  │   (MySQL)        │         │   Table (MySQL)  │          │
│  └──────────────────┘         └──────────────────┘          │
│                                                                 │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │   Background     │         │   Analytics      │          │
│  │   Jobs           │         │   Service        │          │
│  │   (Queue)        │         │   (Optional)     │          │
│  └──────────────────┘         └──────────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Responsibilities

#### Frontend Components

1. **Activity Logging Middleware**
   - Intercepts all API calls
   - Extracts action context automatically
   - Creates log entries

2. **Activity Logger Service**
   - Manages log creation
   - Handles batching
   - Manages queue

3. **Activity Queue (IndexedDB)**
   - Stores logs offline
   - Handles sync
   - Manages retries

#### Backend Components

1. **Activity Log API**
   - Receives log entries
   - Validates entries
   - Stores in database

2. **Activity Log Service**
   - Business logic
   - Data processing
   - Analytics

3. **Background Jobs**
   - Archival
   - Cleanup
   - Analytics

---

## 3. Data Model

### 3.1 Frontend Data Model

```typescript
/**
 * Activity log entry (frontend)
 */
export interface ActivityLogEntry {
  // Identifiers
  id: string;                    // UUID v4
  request_id?: string;           // Correlation ID for request
  
  // User Information
  user_id: number;               // User who performed action
  user_name: string;             // User name (denormalized)
  user_email?: string;           // User email (denormalized)
  user_role?: string;            // User role (denormalized)
  
  // Action Details
  action: ActivityAction;         // Type of action
  module: ActivityModule;         // Module where action occurred
  resource_type?: string;        // Type of resource (e.g., 'gate_pass', 'user')
  resource_id?: string | number; // ID of resource
  resource_name?: string;        // Name of resource (denormalized)
  
  // Context
  ip_address: string;            // IP address
  user_agent?: string;           // Browser/device info
  session_id?: string;          // Session identifier
  device_info?: {                // Device information
    type: 'desktop' | 'mobile' | 'tablet';
    os?: string;
    browser?: string;
  };
  
  // Change Tracking
  old_values?: Record<string, unknown>; // Before state (for updates)
  new_values?: Record<string, unknown>; // After state (for updates)
  changes?: Change[];            // Detailed changes
  
  // Metadata
  details?: Record<string, unknown>; // Additional context
  severity: 'info' | 'warning' | 'error' | 'critical';
  status: 'success' | 'failed' | 'partial';
  error_message?: string;       // If action failed
  error_code?: string;          // Error code if failed
  
  // Timestamps
  created_at: string;           // When action occurred (ISO 8601)
  logged_at: string;            // When log was created (ISO 8601)
  synced_at?: string;          // When synced to backend (ISO 8601)
  
  // Offline Support
  queued: boolean;              // Whether queued for sync
  retry_count?: number;        // Number of retry attempts
  
  // Retention
  retention_until?: string;    // When log can be archived (ISO 8601)
}

/**
 * Detailed change tracking
 */
export interface Change {
  field: string;                 // Field name
  old_value: unknown;          // Old value
  new_value: unknown;          // New value
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  sensitive?: boolean;          // Whether field contains sensitive data
}

/**
 * Activity action types
 */
export type ActivityAction = 
  // CRUD Operations
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'restore'                    // Soft delete restore
  
  // Authentication
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'password_changed'
  | 'password_reset'
  | 'session_expired'
  | 'session_refreshed'
  
  // Authorization
  | 'permission_granted'
  | 'permission_revoked'
  | 'permission_changed'
  | 'role_changed'
  | 'access_denied'
  
  // Workflow
  | 'approve'
  | 'reject'
  | 'validate'
  | 'submit'
  | 'cancel'
  | 'assign'
  | 'unassign'
  
  // Data Operations
  | 'export'
  | 'import'
  | 'bulk_update'
  | 'bulk_delete'
  
  // System
  | 'system_event'
  | 'configuration_changed'
  | 'maintenance_mode'
  
  // File Operations
  | 'file_uploaded'
  | 'file_downloaded'
  | 'file_deleted';

/**
 * Activity module types
 */
export type ActivityModule =
  | 'auth'                       // Authentication
  | 'user_management'           // User management
  | 'gate_pass'                 // Gate pass module
  | 'expense'                    // Expense module
  | 'inspection'                // Inspection module
  | 'stockyard'                  // Stockyard module
  | 'approvals'                  // Unified approvals
  | 'reports'                    // Reports
  | 'settings'                   // Settings
  | 'notifications'              // Notifications
  | 'system';                    // System events
```

### 3.2 Backend Data Model

#### Database Schema

```sql
-- Main activity logs table
CREATE TABLE activity_logs (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL,        -- UUID for correlation
    request_id VARCHAR(36),                  -- Request correlation ID
    
    -- User Information
    user_id BIGINT UNSIGNED NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255),
    user_role VARCHAR(50),
    
    -- Action Details
    action VARCHAR(50) NOT NULL,
    module VARCHAR(50) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    resource_name VARCHAR(255),
    
    -- Context
    ip_address VARCHAR(45) NOT NULL,         -- IPv4 or IPv6
    user_agent TEXT,
    session_id VARCHAR(255),
    device_type ENUM('desktop', 'mobile', 'tablet'),
    device_os VARCHAR(100),
    device_browser VARCHAR(100),
    
    -- Change Tracking (JSON)
    old_values JSON,
    new_values JSON,
    changes JSON,                            -- Detailed changes array
    
    -- Metadata
    details JSON,                            -- Additional context
    severity ENUM('info', 'warning', 'error', 'critical') DEFAULT 'info',
    status ENUM('success', 'failed', 'partial') DEFAULT 'success',
    error_message TEXT,
    error_code VARCHAR(50),
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL,          -- When action occurred
    logged_at TIMESTAMP NOT NULL,           -- When log was created
    synced_at TIMESTAMP,                    -- When synced (for offline)
    
    -- Indexes
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_module (module),
    INDEX idx_resource (resource_type, resource_id),
    INDEX idx_created_at (created_at),
    INDEX idx_severity (severity),
    INDEX idx_status (status),
    INDEX idx_uuid (uuid),
    INDEX idx_request_id (request_id),
    
    -- Foreign Keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Archive table (for old logs)
CREATE TABLE activity_log_archives (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    -- Same structure as activity_logs
    -- ... (copy all columns)
    archived_at TIMESTAMP NOT NULL,
    INDEX idx_archived_at (archived_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Activity log access audit (who viewed logs)
CREATE TABLE activity_log_access (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    activity_log_id BIGINT UNSIGNED NOT NULL,
    accessed_by BIGINT UNSIGNED NOT NULL,
    accessed_at TIMESTAMP NOT NULL,
    reason TEXT,                            -- Why accessed
    FOREIGN KEY (activity_log_id) REFERENCES activity_logs(id) ON DELETE CASCADE,
    FOREIGN KEY (accessed_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_activity_log_id (activity_log_id),
    INDEX idx_accessed_by (accessed_by),
    INDEX idx_accessed_at (accessed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 4. Frontend Implementation

### 4.1 Activity Logging Service

**File:** `src/lib/activityLogging/ActivityLoggingService.ts`

```typescript
/**
 * Activity Logging Service
 * 
 * Centralized service for activity logging
 */
export class ActivityLoggingService {
  private queue: ActivityQueue;
  private batchSize: number = 10;
  private batchInterval: number = 5000; // 5 seconds
  private batchTimer: NodeJS.Timeout | null = null;
  private pendingBatch: ActivityLogEntry[] = [];

  constructor() {
    this.queue = new ActivityQueue();
    this.startBatchTimer();
  }

  /**
   * Log an activity
   */
  async log(entry: Partial<ActivityLogEntry>): Promise<void> {
    const fullEntry = this.enrichEntry(entry);
    
    // Add to queue (for offline support)
    await this.queue.add(fullEntry);
    
    // Add to batch
    this.pendingBatch.push(fullEntry);
    
    // Send batch if full
    if (this.pendingBatch.length >= this.batchSize) {
      await this.flushBatch();
    }
  }

  /**
   * Enrich log entry with additional context
   */
  private enrichEntry(entry: Partial<ActivityLogEntry>): ActivityLogEntry {
    const user = getCurrentUser(); // From auth context
    const deviceInfo = getDeviceInfo();
    
    return {
      id: generateUUID(),
      user_id: user?.id || 0,
      user_name: user?.name || 'Unknown',
      user_email: user?.email,
      user_role: user?.role,
      ip_address: getClientIP(),
      user_agent: navigator.userAgent,
      session_id: getSessionId(),
      device_info: deviceInfo,
      created_at: new Date().toISOString(),
      logged_at: new Date().toISOString(),
      queued: true,
      severity: 'info',
      status: 'success',
      ...entry,
    };
  }

  /**
   * Flush pending batch
   */
  private async flushBatch(): Promise<void> {
    if (this.pendingBatch.length === 0) return;
    
    const batch = [...this.pendingBatch];
    this.pendingBatch = [];
    
    try {
      await this.sendBatch(batch);
      // Mark as synced in queue
      await Promise.all(
        batch.map(entry => this.queue.markSynced(entry.id))
      );
    } catch (error) {
      // Re-add to batch for retry
      this.pendingBatch.push(...batch);
      logger.error('Failed to send activity log batch', error);
    }
  }

  /**
   * Send batch to backend
   */
  private async sendBatch(batch: ActivityLogEntry[]): Promise<void> {
    await apiClient.post('/v1/activity-logs/batch', {
      logs: batch,
    });
  }

  /**
   * Start batch timer
   */
  private startBatchTimer(): void {
    this.batchTimer = setInterval(() => {
      this.flushBatch();
    }, this.batchInterval);
  }

  /**
   * Process offline queue
   */
  async processQueue(): Promise<void> {
    const queued = await this.queue.getUnsynced();
    if (queued.length === 0) return;
    
    // Send in batches
    for (let i = 0; i < queued.length; i += this.batchSize) {
      const batch = queued.slice(i, i + this.batchSize);
      try {
        await this.sendBatch(batch);
        await Promise.all(
          batch.map(entry => this.queue.markSynced(entry.id))
        );
      } catch (error) {
        // Will retry later
        logger.error('Failed to sync activity logs', error);
      }
    }
  }
}
```

### 4.2 API Interceptor

**File:** `src/lib/activityLogging/activityInterceptor.ts`

```typescript
/**
 * Activity Logging Interceptor
 * 
 * Automatically logs activities from API calls
 */
export function createActivityInterceptor(
  logger: ActivityLoggingService
): AxiosInterceptor {
  return {
    request: (config) => {
      // Extract action context from request
      const context = extractActionContext(config);
      if (context) {
        // Store context for response interceptor
        config.metadata = { activityContext: context };
      }
      return config;
    },
    
    response: async (response) => {
      const context = response.config.metadata?.activityContext;
      if (context) {
        // Create log entry
        await logger.log({
          action: context.action,
          module: context.module,
          resource_type: context.resourceType,
          resource_id: context.resourceId,
          resource_name: context.resourceName,
          old_values: context.oldValues,
          new_values: extractNewValues(response.data),
          status: 'success',
        });
      }
      return response;
    },
    
    error: async (error) => {
      const context = error.config?.metadata?.activityContext;
      if (context) {
        // Log failed action
        await logger.log({
          action: context.action,
          module: context.module,
          resource_type: context.resourceType,
          resource_id: context.resourceId,
          status: 'failed',
          error_message: error.message,
          error_code: error.response?.status?.toString(),
          severity: 'error',
        });
      }
      return Promise.reject(error);
    },
  };
}

/**
 * Extract action context from API request
 */
function extractActionContext(config: AxiosRequestConfig): ActionContext | null {
  const { method, url, data } = config;
  
  // Parse URL to extract module and resource
  const urlMatch = url?.match(/\/v1\/([^\/]+)(?:\/([^\/]+))?(?:\/(\d+))?/);
  if (!urlMatch) return null;
  
  const [, modulePath, resourceType, resourceId] = urlMatch;
  const module = mapPathToModule(modulePath);
  
  // Determine action from HTTP method
  const action = mapMethodToAction(method || 'GET');
  
  // Extract resource name from data if available
  const resourceName = extractResourceName(data, resourceType);
  
  // Extract old values if update
  const oldValues = action === 'update' ? extractOldValues(data) : undefined;
  
  return {
    action,
    module,
    resourceType,
    resourceId,
    resourceName,
    oldValues,
  };
}

/**
 * Map HTTP method to activity action
 */
function mapMethodToAction(method: string): ActivityAction {
  switch (method.toUpperCase()) {
    case 'POST':
      return 'create';
    case 'GET':
      return 'read';
    case 'PUT':
    case 'PATCH':
      return 'update';
    case 'DELETE':
      return 'delete';
    default:
      return 'read';
  }
}

/**
 * Map URL path to module
 */
function mapPathToModule(path: string): ActivityModule {
  const moduleMap: Record<string, ActivityModule> = {
    'gate-passes': 'gate_pass',
    'gate-pass': 'gate_pass',
    'inspections': 'inspection',
    'inspection': 'inspection',
    'expenses': 'expense',
    'expense': 'expense',
    'stockyard': 'stockyard',
    'users': 'user_management',
    'user': 'user_management',
    'approvals': 'approvals',
    'settings': 'settings',
    'reports': 'reports',
    'notifications': 'notifications',
  };
  
  return moduleMap[path] || 'system';
}
```

### 4.3 Activity Queue (IndexedDB)

**File:** `src/lib/activityLogging/activityQueue.ts`

```typescript
/**
 * Activity Queue
 * 
 * Manages offline activity log queue using IndexedDB
 */
export class ActivityQueue {
  private dbName = 'voms_activity_queue';
  private storeName = 'activity_logs';
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('synced', 'synced', { unique: false });
          store.createIndex('created_at', 'created_at', { unique: false });
        }
      };
    });
  }

  async add(entry: ActivityLogEntry): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.add(entry);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getUnsynced(): Promise<ActivityLogEntry[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('synced');
      const request = index.getAll(false);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async markSynced(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const entry = getRequest.result;
        if (entry) {
          entry.synced_at = new Date().toISOString();
          entry.queued = false;
          const putRequest = store.put(entry);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async clearSynced(): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('synced');
      const request = index.openCursor(IDBKeyRange.only(true));
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
}
```

### 4.4 React Hook

**File:** `src/lib/activityLogging/useActivityLogger.ts`

```typescript
/**
 * React Hook for Activity Logging
 * 
 * Provides easy access to activity logging in components
 */
export function useActivityLogger() {
  const logger = useMemo(() => new ActivityLoggingService(), []);
  
  const log = useCallback(async (
    action: ActivityAction,
    module: ActivityModule,
    details?: Partial<ActivityLogEntry>
  ) => {
    await logger.log({
      action,
      module,
      ...details,
    });
  }, [logger]);
  
  return { log };
}
```

---

## 5. Backend Implementation

### 5.1 Laravel Service

**File:** `app/Services/ActivityLogService.php`

```php
<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ActivityLogService
{
    /**
     * Create a single activity log entry
     */
    public function create(array $data): ActivityLog
    {
        return ActivityLog::create([
            'uuid' => $data['id'] ?? \Str::uuid()->toString(),
            'request_id' => $data['request_id'] ?? null,
            'user_id' => $data['user_id'],
            'user_name' => $data['user_name'],
            'user_email' => $data['user_email'] ?? null,
            'user_role' => $data['user_role'] ?? null,
            'action' => $data['action'],
            'module' => $data['module'],
            'resource_type' => $data['resource_type'] ?? null,
            'resource_id' => $data['resource_id'] ?? null,
            'resource_name' => $data['resource_name'] ?? null,
            'ip_address' => $data['ip_address'],
            'user_agent' => $data['user_agent'] ?? null,
            'session_id' => $data['session_id'] ?? null,
            'device_type' => $data['device_info']['type'] ?? null,
            'device_os' => $data['device_info']['os'] ?? null,
            'device_browser' => $data['device_info']['browser'] ?? null,
            'old_values' => $data['old_values'] ?? null,
            'new_values' => $data['new_values'] ?? null,
            'changes' => $data['changes'] ?? null,
            'details' => $data['details'] ?? null,
            'severity' => $data['severity'] ?? 'info',
            'status' => $data['status'] ?? 'success',
            'error_message' => $data['error_message'] ?? null,
            'error_code' => $data['error_code'] ?? null,
            'created_at' => $data['created_at'] ?? now(),
            'logged_at' => $data['logged_at'] ?? now(),
            'synced_at' => $data['synced_at'] ?? now(),
        ]);
    }

    /**
     * Create multiple activity log entries (batch)
     */
    public function createBatch(array $logs): int
    {
        $insertData = [];
        $now = now();
        
        foreach ($logs as $log) {
            $insertData[] = [
                'uuid' => $log['id'] ?? \Str::uuid()->toString(),
                'request_id' => $log['request_id'] ?? null,
                'user_id' => $log['user_id'],
                'user_name' => $log['user_name'],
                'user_email' => $log['user_email'] ?? null,
                'user_role' => $log['user_role'] ?? null,
                'action' => $log['action'],
                'module' => $log['module'],
                'resource_type' => $log['resource_type'] ?? null,
                'resource_id' => $log['resource_id'] ?? null,
                'resource_name' => $log['resource_name'] ?? null,
                'ip_address' => $log['ip_address'],
                'user_agent' => $log['user_agent'] ?? null,
                'session_id' => $log['session_id'] ?? null,
                'device_type' => $log['device_info']['type'] ?? null,
                'device_os' => $log['device_info']['os'] ?? null,
                'device_browser' => $log['device_info']['browser'] ?? null,
                'old_values' => isset($log['old_values']) ? json_encode($log['old_values']) : null,
                'new_values' => isset($log['new_values']) ? json_encode($log['new_values']) : null,
                'changes' => isset($log['changes']) ? json_encode($log['changes']) : null,
                'details' => isset($log['details']) ? json_encode($log['details']) : null,
                'severity' => $log['severity'] ?? 'info',
                'status' => $log['status'] ?? 'success',
                'error_message' => $log['error_message'] ?? null,
                'error_code' => $log['error_code'] ?? null,
                'created_at' => $log['created_at'] ?? $now,
                'logged_at' => $log['logged_at'] ?? $now,
                'synced_at' => $log['synced_at'] ?? $now,
            ];
        }
        
        return ActivityLog::insert($insertData);
    }

    /**
     * Get activity logs with filters
     */
    public function getLogs(array $filters = [], int $perPage = 50)
    {
        $query = ActivityLog::query();
        
        // Apply filters
        if (isset($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }
        
        if (isset($filters['action'])) {
            $query->where('action', $filters['action']);
        }
        
        if (isset($filters['module'])) {
            $query->where('module', $filters['module']);
        }
        
        if (isset($filters['resource_type'])) {
            $query->where('resource_type', $filters['resource_type']);
        }
        
        if (isset($filters['resource_id'])) {
            $query->where('resource_id', $filters['resource_id']);
        }
        
        if (isset($filters['from_date'])) {
            $query->where('created_at', '>=', $filters['from_date']);
        }
        
        if (isset($filters['to_date'])) {
            $query->where('created_at', '<=', $filters['to_date']);
        }
        
        if (isset($filters['search'])) {
            $search = $filters['search'];
            $query->where(function($q) use ($search) {
                $q->where('user_name', 'like', "%{$search}%")
                  ->orWhere('resource_name', 'like', "%{$search}%")
                  ->orWhere('details', 'like', "%{$search}%");
            });
        }
        
        // Order by created_at desc
        $query->orderBy('created_at', 'desc');
        
        return $query->paginate($perPage);
    }

    /**
     * Archive old logs
     */
    public function archiveOldLogs(int $daysOld = 365): int
    {
        $cutoffDate = now()->subDays($daysOld);
        
        $logs = ActivityLog::where('created_at', '<', $cutoffDate)
            ->where('archived', false)
            ->get();
        
        $archived = 0;
        DB::transaction(function() use ($logs, &$archived) {
            foreach ($logs as $log) {
                // Insert into archive table
                DB::table('activity_log_archives')->insert(
                    $log->toArray() + ['archived_at' => now()]
                );
                
                // Delete from main table
                $log->delete();
                $archived++;
            }
        });
        
        return $archived;
    }
}
```

### 5.2 Laravel Model

**File:** `app/Models/ActivityLog.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    protected $table = 'activity_logs';
    
    protected $fillable = [
        'uuid',
        'request_id',
        'user_id',
        'user_name',
        'user_email',
        'user_role',
        'action',
        'module',
        'resource_type',
        'resource_id',
        'resource_name',
        'ip_address',
        'user_agent',
        'session_id',
        'device_type',
        'device_os',
        'device_browser',
        'old_values',
        'new_values',
        'changes',
        'details',
        'severity',
        'status',
        'error_message',
        'error_code',
        'created_at',
        'logged_at',
        'synced_at',
    ];
    
    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'changes' => 'array',
        'details' => 'array',
        'created_at' => 'datetime',
        'logged_at' => 'datetime',
        'synced_at' => 'datetime',
    ];
    
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
```

### 5.3 Laravel Middleware

**File:** `app/Http/Middleware/LogActivity.php`

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Services\ActivityLogService;

class LogActivity
{
    protected $activityLogService;
    
    public function __construct(ActivityLogService $activityLogService)
    {
        $this->activityLogService = $activityLogService;
    }
    
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);
        
        // Log activity if user is authenticated
        if ($request->user()) {
            $this->logActivity($request, $response);
        }
        
        return $response;
    }
    
    protected function logActivity(Request $request, $response): void
    {
        // Extract action context from request
        $action = $this->extractAction($request);
        $module = $this->extractModule($request);
        
        if (!$action || !$module) {
            return; // Skip if can't determine action/module
        }
        
        $this->activityLogService->create([
            'user_id' => $request->user()->id,
            'user_name' => $request->user()->name,
            'user_email' => $request->user()->email,
            'user_role' => $request->user()->role,
            'action' => $action,
            'module' => $module,
            'resource_type' => $this->extractResourceType($request),
            'resource_id' => $this->extractResourceId($request),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'session_id' => $request->session()->getId(),
            'status' => $response->isSuccessful() ? 'success' : 'failed',
            'error_code' => $response->isSuccessful() ? null : $response->status(),
        ]);
    }
    
    protected function extractAction(Request $request): ?string
    {
        $method = $request->method();
        
        return match($method) {
            'POST' => 'create',
            'GET' => 'read',
            'PUT', 'PATCH' => 'update',
            'DELETE' => 'delete',
            default => null,
        };
    }
    
    protected function extractModule(Request $request): ?string
    {
        $path = $request->path();
        
        // Extract module from path
        if (preg_match('/\/v1\/([^\/]+)/', $path, $matches)) {
            return $this->mapPathToModule($matches[1]);
        }
        
        return null;
    }
    
    protected function mapPathToModule(string $path): string
    {
        $map = [
            'gate-passes' => 'gate_pass',
            'inspections' => 'inspection',
            'expenses' => 'expense',
            'stockyard' => 'stockyard',
            'users' => 'user_management',
            'approvals' => 'approvals',
            'settings' => 'settings',
            'reports' => 'reports',
        ];
        
        return $map[$path] ?? 'system';
    }
    
    protected function extractResourceType(Request $request): ?string
    {
        // Extract from URL path
        $path = $request->path();
        if (preg_match('/\/v1\/([^\/]+)\/([^\/]+)/', $path, $matches)) {
            return $matches[2];
        }
        
        return null;
    }
    
    protected function extractResourceId(Request $request): ?string
    {
        // Extract from URL path or request data
        $path = $request->path();
        if (preg_match('/\/v1\/[^\/]+\/[^\/]+\/(\d+)/', $path, $matches)) {
            return $matches[1];
        }
        
        return $request->input('id');
    }
}
```

---

## 6. API Design

### 6.1 Endpoints

#### Create Activity Log (Single)
```http
POST /api/v1/activity-logs
Content-Type: application/json

{
  "id": "uuid",
  "user_id": 1,
  "user_name": "John Doe",
  "action": "create",
  "module": "gate_pass",
  "resource_type": "gate_pass",
  "resource_id": "123",
  "ip_address": "192.168.1.1",
  ...
}
```

#### Create Activity Logs (Batch)
```http
POST /api/v1/activity-logs/batch
Content-Type: application/json

{
  "logs": [
    { ... },
    { ... }
  ]
}
```

#### Get Activity Logs
```http
GET /api/v1/activity-logs?user_id=1&action=create&module=gate_pass&page=1&per_page=50
```

#### Get Activity Log
```http
GET /api/v1/activity-logs/{id}
```

#### Export Activity Logs
```http
GET /api/v1/activity-logs/export?format=csv&from_date=2025-01-01&to_date=2025-01-31
```

#### Get Activity Statistics
```http
GET /api/v1/activity-logs/statistics?from_date=2025-01-01&to_date=2025-01-31
```

---

## 7. Security & Privacy

### 7.1 Sensitive Data Handling

**PII Masking:**
- Email addresses: Mask except first letter and domain
- Phone numbers: Mask except last 4 digits
- Credit card numbers: Never log
- Passwords: Never log

**Data Sanitization:**
```typescript
function sanitizeLogData(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveFields = ['password', 'credit_card', 'ssn', 'pin'];
  const sanitized = { ...data };
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}
```

### 7.2 Access Control

- **View Logs:** Requires `activity_logs.view` permission
- **Export Logs:** Requires `activity_logs.export` permission
- **View Own Logs:** Users can view their own activity logs
- **Admin Access:** Admins can view all logs

### 7.3 Audit Trail

- Log access to activity logs
- Track who viewed which logs
- Track export operations
- Track log deletions

---

## 8. Performance Considerations

### 8.1 Optimization Strategies

1. **Batching:** Send logs in batches (10-50 at a time)
2. **Async Processing:** Don't block user actions
3. **IndexedDB:** Use for offline queue (fast writes)
4. **Database Indexes:** Optimize query performance
5. **Archival:** Move old logs to archive table

### 8.2 Performance Targets

- **Log Creation:** < 10ms overhead
- **Batch Upload:** < 100ms for 10 logs
- **Query Performance:** < 500ms for filtered queries
- **Export:** < 5s for 10K logs

---

## 9. Data Retention & Archival

### 9.1 Retention Policies

- **Active Logs:** 90 days (configurable)
- **Archived Logs:** 2 years (configurable)
- **Critical Logs:** 5 years (never archived)
- **Security Events:** 7 years (compliance)

### 9.2 Archival Process

1. **Daily Job:** Archive logs older than retention period
2. **Monthly Job:** Clean up archived logs older than archive retention
3. **Manual Archive:** Admins can manually archive logs

---

## 10. UI Components

### 10.1 Activity Logs Page

**Features:**
- List view with pagination
- Advanced filters
- Search functionality
- Export options
- Real-time updates
- Detail view

### 10.2 Activity Timeline

**Features:**
- Timeline view for user/resource
- Visual representation
- Filter by action type
- Export timeline

### 10.3 Activity Dashboard

**Features:**
- Activity statistics
- Recent activities
- Activity trends
- User activity heatmap

---

## 11. Integration Guide

### 11.1 Automatic Integration

The system automatically logs activities from API calls. No manual integration needed.

### 11.2 Manual Logging

For custom actions not captured automatically:

```typescript
const { log } = useActivityLogger();

await log('approve', 'gate_pass', {
  resource_type: 'gate_pass',
  resource_id: passId,
  resource_name: 'Visitor Pass #123',
  details: {
    approved_by: userId,
    reason: 'Valid visitor',
  },
});
```

---

## 12. Testing Strategy

### 12.1 Unit Tests

- Test activity logging service
- Test queue operations
- Test data sanitization
- Test API interceptor

### 12.2 Integration Tests

- Test end-to-end logging flow
- Test offline queue sync
- Test batch upload
- Test error handling

### 12.3 Performance Tests

- Test log creation performance
- Test batch upload performance
- Test query performance
- Test large dataset handling

---

## 13. Monitoring & Maintenance

### 13.1 Monitoring

- **Log Volume:** Track logs per day
- **Queue Size:** Monitor offline queue size
- **Sync Status:** Monitor sync success rate
- **Performance:** Monitor API response times
- **Errors:** Track logging errors

### 13.2 Maintenance

- **Daily:** Process offline queue
- **Weekly:** Archive old logs
- **Monthly:** Clean up archived logs
- **Quarterly:** Review retention policies

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] Database schema created
- [ ] Laravel models and services
- [ ] API endpoints
- [ ] Basic UI components

### Phase 2: Frontend
- [ ] Activity logging service
- [ ] API interceptor
- [ ] Offline queue
- [ ] React hooks

### Phase 3: Integration
- [ ] Integrate with all modules
- [ ] Test automatic logging
- [ ] Test offline functionality
- [ ] Performance testing

### Phase 4: UI & Features
- [ ] Activity logs page
- [ ] Timeline component
- [ ] Dashboard
- [ ] Export functionality

### Phase 5: Security & Compliance
- [ ] PII masking
- [ ] Access control
- [ ] Audit trail
- [ ] Retention policies

### Phase 6: Optimization
- [ ] Performance optimization
- [ ] Batch optimization
- [ ] Query optimization
- [ ] Archival optimization

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Next Review:** After Phase 1 implementation

