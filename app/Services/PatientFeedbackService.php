<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Feedback;
use App\Models\Patient;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PatientFeedbackService
{
    /** @return array<string, mixed> */
    public function payload(Patient $patient): array
    {
        $pendingAppointments = $patient->appointments()
            ->where('status', 'completed')
            ->doesntHave('feedback')
            ->with(['patient:PID,first_name,middle_name,last_name,contact_number', 'services'])
            ->latest('scheduled_at')
            ->get()
            ->map(fn (Appointment $appointment): array => $this->serializeAppointment($appointment))
            ->all();

        $feedbacks = Feedback::query()
            ->whereHas('appointment', fn ($query) => $query->where('PID', $patient->PID))
            ->with(['appointment.patient:PID,first_name,middle_name,last_name,contact_number', 'appointment.services'])
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return [
            'patient' => [
                'PID' => $patient->PID,
                'name' => $patient->full_name,
                'email' => $patient->email,
            ],
            'pendingAppointments' => $pendingAppointments,
            'feedbacks' => $feedbacks->through(fn (Feedback $feedback): array => $this->serializeFeedback($feedback)),
        ];
    }

    /** @param array<string, mixed> $data */
    public function create(Patient $patient, array $data): Feedback
    {
        return DB::transaction(function () use ($patient, $data): Feedback {
            $appointment = Appointment::query()
                ->whereKey($data['appointment_ID'])
                ->where('PID', $patient->PID)
                ->lockForUpdate()
                ->first();

            if ($appointment === null) {
                throw ValidationException::withMessages([
                    'appointment_ID' => 'The selected appointment does not belong to your account.',
                ]);
            }

            if ($appointment->status !== 'completed') {
                throw ValidationException::withMessages([
                    'appointment_ID' => 'Feedback can only be submitted for a completed appointment.',
                ]);
            }

            if ($appointment->feedback()->exists()) {
                throw ValidationException::withMessages([
                    'appointment_ID' => 'Feedback has already been submitted for this appointment.',
                ]);
            }

            return $appointment->feedback()->create([
                'rating' => $data['rating'],
                'description' => Arr::get($data, 'description') ?: null,
            ]);
        }, 3);
    }

    /** @return array<string, mixed> */
    private function serializeFeedback(Feedback $feedback): array
    {
        return [
            'feedback_ID' => $feedback->feedback_ID,
            'rating' => $feedback->rating,
            'description' => $feedback->description,
            'submitted_at' => $feedback->created_at?->toISOString(),
            'appointment' => $this->serializeAppointment($feedback->appointment),
        ];
    }

    /** @return array<string, mixed> */
    private function serializeAppointment(Appointment $appointment): array
    {
        return [
            'appointment_ID' => $appointment->appointment_ID,
            'appointment_code' => 'PDC-'.$appointment->appointment_ID,
            'PID' => $appointment->PID,
            'patient_name' => $appointment->patient->full_name,
            'patient_contact' => $appointment->patient->contact_number ?? null,
            'branch_ID' => $appointment->branch_ID,
            'branch_name' => $appointment->branch_name,
            'visit_ID' => $appointment->visit_ID,
            'scheduled_at' => $appointment->scheduled_at->toISOString(),
            'appointment_type' => $appointment->appointment_type,
            'concern' => $appointment->concern,
            'services' => $appointment->services->map(fn ($service): array => [
                'service_ID' => $service->service_ID,
                'service_name' => $service->service_name,
            ])->all(),
        ];
    }
}
