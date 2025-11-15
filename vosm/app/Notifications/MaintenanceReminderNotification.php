<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MaintenanceReminderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $maintenance;
    protected $component;
    protected $daysUntilDue;
    protected $isOverdue;

    /**
     * Create a new notification instance.
     */
    public function __construct($maintenance, $component, int $daysUntilDue, bool $isOverdue = false)
    {
        $this->maintenance = $maintenance;
        $this->component = $component;
        $this->daysUntilDue = $daysUntilDue;
        $this->isOverdue = $isOverdue;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $componentName = $this->getComponentName();
        
        $subject = $this->isOverdue
            ? "Maintenance Overdue: {$componentName}"
            : "Maintenance Due Soon: {$componentName}";
        
        $message = $this->isOverdue
            ? "Maintenance for {$componentName} is overdue. Please schedule maintenance as soon as possible."
            : "Maintenance for {$componentName} is due in {$this->daysUntilDue} day(s).";
        
        return (new MailMessage)
            ->subject($subject)
            ->line($message)
            ->line("Maintenance Type: {$this->maintenance->title}")
            ->line("Last Performed: " . $this->maintenance->performed_at->format('M d, Y'))
            ->line("Next Due Date: " . $this->maintenance->next_due_date->format('M d, Y'))
            ->action('View Component', url("/app/stockyard/components/{$this->maintenance->component_type}/{$this->maintenance->component_id}"))
            ->line('Please schedule the required maintenance to ensure component reliability.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $componentName = $this->getComponentName();
        
        return [
            'type' => 'maintenance_reminder',
            'component_type' => $this->maintenance->component_type,
            'component_id' => $this->maintenance->component_id,
            'maintenance_id' => $this->maintenance->id,
            'component_name' => $componentName,
            'maintenance_title' => $this->maintenance->title,
            'days_until_due' => $this->daysUntilDue,
            'is_overdue' => $this->isOverdue,
            'next_due_date' => $this->maintenance->next_due_date?->format('Y-m-d'),
            'message' => $this->isOverdue
                ? "Maintenance for {$componentName} is overdue."
                : "Maintenance for {$componentName} is due in {$this->daysUntilDue} day(s).",
            'action_url' => "/app/stockyard/components/{$this->maintenance->component_type}/{$this->maintenance->component_id}",
        ];
    }

    /**
     * Get component display name
     */
    protected function getComponentName(): string
    {
        if ($this->maintenance->component_type === 'spare_part') {
            return $this->component->name ?? 'Spare Part';
        }
        
        $name = trim(($this->component->brand ?? '') . ' ' . ($this->component->model ?? ''));
        if (empty($name)) {
            $name = $this->component->serial_number ?? $this->component->part_number ?? 'Component';
        }
        
        return $name;
    }
}

