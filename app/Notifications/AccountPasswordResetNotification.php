<?php

namespace App\Notifications;

use App\Enums\AccountType;
use App\Models\Patient;
use App\Models\StaffAccount;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Config;

/**
 * Sends a password reset link for either a staff or patient account.
 */
class AccountPasswordResetNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Store the reset token and account type used by the reset route.
     */
    public function __construct(
        public readonly string $token,
        public readonly AccountType $accountType,
    ) {
        $this->afterCommit();
    }

    /**
     * Deliver this notification by email.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Build a clear account-specific password reset email.
     */
    public function toMail(StaffAccount|Patient $notifiable): MailMessage
    {
        $accountLabel = $this->accountType === AccountType::Staff
            ? 'staff account'
            : 'patient account';
        $expiresInMinutes = (int) Config::get(
            'auth.passwords.'.$this->accountType->passwordBroker().'.expire',
            60,
        );

        // The route carries the account type so the matching broker validates the token.
        $resetUrl = route('password.reset', [
            'accountType' => $this->accountType->value,
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ]);

        return (new MailMessage)
            ->subject('Reset your Pelaez Dermatology Clinic password')
            ->greeting('Hello!')
            ->line("We received a password reset request for your {$accountLabel}.")
            ->action('Reset password', $resetUrl)
            ->line("This password reset link expires in {$expiresInMinutes} minutes.")
            ->line('If you did not request a password reset, you can safely ignore this email.');
    }

    /**
     * Return no database payload because this is an email-only notification.
     *
     * @return array<string, never>
     */
    public function toArray(object $notifiable): array
    {
        return [];
    }
}
