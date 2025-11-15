<?php

namespace App\Services;

use App\Models\UserActivityLog;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;

class ActivityLogService
{
    /**
     * Log a user activity
     */
    public function logActivity(
        string $userId,
        string $action,
        ?string $resourceType = null,
        ?string $resourceId = null,
        ?array $metadata = null,
        ?Request $request = null
    ): void {
        try {
            UserActivityLog::create([
                'user_id' => $userId,
                'action' => $action,
                'resource_type' => $resourceType,
                'resource_id' => $resourceId,
                'metadata' => $metadata,
                'ip_address' => $request?->ip(),
                'user_agent' => $request?->userAgent(),
                'performed_at' => now(),
            ]);
        } catch (\Exception $e) {
            Log::warning('Failed to log user activity: ' . $e->getMessage(), [
                'user_id' => $userId,
                'action' => $action,
            ]);
            // Don't throw - activity logging is non-critical
        }
    }

    /**
     * Log login activity
     */
    public function logLogin(string $userId, Request $request): void
    {
        $this->logActivity($userId, 'login', null, null, null, $request);
    }

    /**
     * Log logout activity
     */
    public function logLogout(string $userId, Request $request): void
    {
        $this->logActivity($userId, 'logout', null, null, null, $request);
    }

    /**
     * Log resource creation
     */
    public function logCreate(string $userId, string $resourceType, string $resourceId, ?Request $request = null): void
    {
        $this->logActivity($userId, "create_{$resourceType}", $resourceType, $resourceId, null, $request);
    }

    /**
     * Log resource update
     */
    public function logUpdate(string $userId, string $resourceType, string $resourceId, ?Request $request = null): void
    {
        $this->logActivity($userId, "update_{$resourceType}", $resourceType, $resourceId, null, $request);
    }

    /**
     * Log resource deletion
     */
    public function logDelete(string $userId, string $resourceType, string $resourceId, ?Request $request = null): void
    {
        $this->logActivity($userId, "delete_{$resourceType}", $resourceType, $resourceId, null, $request);
    }

    /**
     * Log approval action
     */
    public function logApproval(string $userId, string $resourceType, string $resourceId, string $action, ?Request $request = null): void
    {
        $this->logActivity($userId, "{$action}_{$resourceType}", $resourceType, $resourceId, ['approval_action' => $action], $request);
    }
}

