<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;

class StaffAccountInvitation extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly ?string $passwordResetToken = null)
    {
        $this->afterCommit();
    }

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $message = (new MailMessage)
            ->subject('Verify your staff email address')
            ->greeting('Welcome to Pelaez Dermatology Clinic')
            ->line('Please verify the email address assigned to your staff account.');

        if ($this->passwordResetToken !== null) {
            $message->line('Use the secure link below to verify your email and choose your password.');
        }

        return $message
            ->action(
                $this->passwordResetToken === null ? 'Verify email address' : 'Verify email and set password',
                $this->verificationUrl($notifiable),
            )
            ->line('This verification link expires in 60 minutes.');
    }

    /** @return array<string, never> */
    public function toArray(object $notifiable): array
    {
        return [];
    }

    private function verificationUrl(object $notifiable): string
    {
        /** @var \Illuminate\Contracts\Auth\MustVerifyEmail&\Illuminate\Database\Eloquent\Model $notifiable */
        return URL::temporarySignedRoute(
            'staff.verification.verify',
            Carbon::now()->addMinutes((int) Config::get('auth.verification.expire', 60)),
            [
                'staffAccount' => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
                'password_reset_token' => $this->passwordResetToken,
            ],
        );
    }
}
