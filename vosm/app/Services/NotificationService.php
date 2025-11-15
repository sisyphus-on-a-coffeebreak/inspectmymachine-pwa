<?php

namespace App\Services;

use App\Models\AppNotification;
use App\Models\User;
use App\Notifications\NotificationMail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class NotificationService
{
    /**
     * Create a notification for a user
     */
    public function createNotification(array $data): AppNotification
    {
        $notification = AppNotification::create([
            'user_id' => $data['user_id'],
            'type' => $data['type'] ?? 'info',
            'title' => $data['title'],
            'message' => $data['message'],
            'action_url' => $data['action_url'] ?? null,
            'read' => false,
            'email_sent' => false,
        ]);

        Log::info('Notification created', [
            'notification_id' => $notification->id,
            'user_id' => $data['user_id'],
            'type' => $notification->type,
        ]);

        // Optionally send email notification
        if (isset($data['send_email']) && $data['send_email'] === true) {
            $this->sendEmailNotification($notification);
        }

        return $notification;
    }

    /**
     * Create notifications for multiple users
     */
    public function createNotificationsForUsers(array $userIds, array $data): int
    {
        $count = 0;
        foreach ($userIds as $userId) {
            $this->createNotification(array_merge($data, ['user_id' => $userId]));
            $count++;
        }
        return $count;
    }

    /**
     * Create notification for users with specific roles
     */
    public function createNotificationForRoles(array $roles, array $data): int
    {
        $users = User::whereIn('role', $roles)
            ->where('is_active', true)
            ->pluck('id')
            ->toArray();

        if (empty($users)) {
            return 0;
        }

        return $this->createNotificationsForUsers($users, $data);
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(string $notificationId, ?string $userId = null): ?AppNotification
    {
        $notification = AppNotification::find($notificationId);

        if (!$notification) {
            return null;
        }

        // Verify ownership if userId provided
        if ($userId && $notification->user_id !== $userId) {
            return null;
        }

        $notification->markAsRead();
        return $notification->fresh();
    }

    /**
     * Mark all notifications as read for a user
     */
    public function markAllAsRead(string $userId): int
    {
        return AppNotification::where('user_id', $userId)
            ->where('read', false)
            ->update([
                'read' => true,
                'read_at' => now(),
            ]);
    }

    /**
     * Delete notification
     */
    public function deleteNotification(string $notificationId, ?string $userId = null): bool
    {
        $notification = AppNotification::find($notificationId);

        if (!$notification) {
            return false;
        }

        // Verify ownership if userId provided
        if ($userId && $notification->user_id !== $userId) {
            return false;
        }

        return $notification->delete();
    }

    /**
     * Get unread count for a user
     */
    public function getUnreadCount(string $userId): int
    {
        return AppNotification::where('user_id', $userId)
            ->where('read', false)
            ->count();
    }

    /**
     * Send email notification (placeholder - implement with actual email template)
     */
    protected function sendEmailNotification(AppNotification $notification): void
    {
        try {
            $user = $notification->user;
            if (!$user || !$user->email) {
                return;
            }

            // Send email notification
            try {
                Mail::to($user->email)->send(new NotificationMail($notification));
                
                // Mark as email sent
                $notification->update(['email_sent' => true]);

                Log::info('Email notification sent', [
                    'notification_id' => $notification->id,
                    'user_id' => $user->id,
                    'email' => $user->email,
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to send email notification: ' . $e->getMessage(), [
                    'notification_id' => $notification->id,
                    'user_id' => $user->id,
                    'email' => $user->email,
                ]);
                // Don't throw - email sending failure shouldn't break the notification
            }
        } catch (\Exception $e) {
            Log::error('Failed to send email notification: ' . $e->getMessage(), [
                'notification_id' => $notification->id,
            ]);
        }
    }
}

