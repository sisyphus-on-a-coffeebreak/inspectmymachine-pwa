<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ExpenseEscalationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $expense;
    protected $daysPending;

    /**
     * Create a new notification instance.
     */
    public function __construct($expense, int $daysPending)
    {
        $this->expense = $expense;
        $this->daysPending = $daysPending;
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
        return (new MailMessage)
            ->subject('Expense Approval Escalation Required')
            ->line("An expense has been pending approval for {$this->daysPending} days and requires your attention.")
            ->line("Expense Amount: ₹" . number_format($this->expense->amount, 2))
            ->line("Category: {$this->expense->category}")
            ->line("Description: {$this->expense->description}")
            ->action('Review Expense', url("/app/expenses/{$this->expense->id}"))
            ->line('Please review and approve or reject this expense as soon as possible.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'expense_escalation',
            'expense_id' => $this->expense->id,
            'amount' => $this->expense->amount,
            'category' => $this->expense->category,
            'description' => $this->expense->description,
            'days_pending' => $this->daysPending,
            'message' => "Expense #{$this->expense->id} has been pending approval for {$this->daysPending} days.",
            'action_url' => "/app/expenses/{$this->expense->id}",
        ];
    }
}

