<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class NotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $notification;

    /**
     * Create a new message instance.
     */
    public function __construct($notification)
    {
        $this->notification = $notification;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        $subject = $this->notification->title;
        
        return $this->subject($subject)
            ->view('emails.notification', [
                'notification' => $this->notification,
            ])
            ->text('emails.notification-text', [
                'notification' => $this->notification,
            ]);
    }
}

