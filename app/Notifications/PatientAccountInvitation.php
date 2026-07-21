<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;

class PatientAccountInvitation extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly ?string $temporaryPassword = null)
    {
        $this->afterCommit();
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $message = (new MailMessage)
            ->subject('Verify your patient email address')
            ->greeting('Welcome to Pelaez Dermatology Clinic')
            ->line('A patient account has been created for you. Please verify its email address.');

        if ($this->temporaryPassword !== null) {
            $message->line("Your temporary password is: {$this->temporaryPassword}")
                ->line('Keep this password secure. Patient sign-in will be available through the patient portal.');
        }

        return $message
            ->action('Verify email address', $this->verificationUrl($notifiable))
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
            'patients.verification.verify',
            Carbon::now()->addMinutes((int) Config::get('auth.verification.expire', 60)),
            [
                'patient' => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ],
        );
    }
}
