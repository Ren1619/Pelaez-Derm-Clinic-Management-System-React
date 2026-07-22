<?php

namespace App\Services;

use App\Models\Feedback;
use App\Models\Patient;

class FeedbackNotificationService
{
    public function __construct(private SystemNotificationService $notifications) {}

    public function submitted(Feedback $feedback, Patient $patient): void
    {
        $feedback->loadMissing('appointment');
        $appointment = $feedback->appointment;

        $this->notifications->create([
            'sender_id' => $patient->PID,
            'sender_type' => 'patient',
            'receiver_id' => null,
            'receiver_type' => 'staff',
            'branch_id' => $appointment->branch_ID,
            'appointment_id' => $appointment->appointment_ID,
            'type' => 'feedback_submitted',
            'deduplication_key' => "feedback-submitted:{$feedback->feedback_ID}",
            'title' => 'New patient feedback',
            'message' => "{$patient->full_name} submitted a {$feedback->rating}-star feedback after appointment #{$appointment->appointment_ID}.",
            'data' => [
                'feedback_id' => $feedback->feedback_ID,
                'patient_name' => $patient->full_name,
                'rating' => $feedback->rating,
            ],
        ]);
    }
}
