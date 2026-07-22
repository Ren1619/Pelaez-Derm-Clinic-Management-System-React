<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Patient;
use App\Models\StaffAccount;
use App\Models\User;
use Illuminate\Contracts\Auth\Authenticatable;

class AppointmentNotificationService
{
    public function __construct(private SystemNotificationService $notifications) {}

    public function patientCreated(Appointment $appointment, Patient $patient): void
    {
        $this->notifyBranchOfPatientAction($appointment, $patient, 'appointment_created_by_patient');
    }

    public function patientUpdated(Appointment $appointment, Patient $patient, ?string $reason = null): void
    {
        $this->clearReminder($appointment);
        $this->notifyBranchOfPatientAction($appointment, $patient, 'appointment_updated_by_patient', $reason);
    }

    public function staffRequestedReschedule(
        Appointment $appointment,
        ?Authenticatable $staff,
        ?string $reason = null,
    ): void {
        $this->clearReminder($appointment);
        $this->notifyPatient(
            $appointment,
            $staff,
            'appointment_reschedule_requested',
            'Appointment reschedule requested',
            "The clinic requested a new schedule for appointment #{$appointment->appointment_ID}. The proposed schedule is {$appointment->scheduled_at->format('M d, Y g:i A')}.",
            $reason,
        );
    }

    public function staffRejected(Appointment $appointment, ?Authenticatable $staff, ?string $reason = null): void
    {
        $this->clearReminder($appointment);
        $this->notifyPatient(
            $appointment,
            $staff,
            'appointment_rejected',
            'Appointment request rejected',
            "Your appointment request #{$appointment->appointment_ID} at {$appointment->branch_name} was rejected.",
            $reason,
        );
    }

    public function clearReminder(Appointment $appointment): void
    {
        $this->notifications->removeByDeduplicationKey($this->reminderKey($appointment));
    }

    public function createDueReminders(?Patient $patient = null): int
    {
        $appointments = Appointment::query()
            ->with('patient:PID,first_name,middle_name,last_name')
            ->whereIn('status', ['today', 'upcoming'])
            ->where('scheduled_at', '>', now())
            ->where('scheduled_at', '<=', now()->addDay())
            ->when($patient, fn ($query) => $query->where('PID', $patient->PID))
            ->get();

        foreach ($appointments as $appointment) {
            $this->notifications->create([
                'sender_id' => null,
                'sender_type' => 'system',
                'receiver_id' => $appointment->PID,
                'receiver_type' => 'patient',
                'branch_id' => $appointment->branch_ID,
                'appointment_id' => $appointment->appointment_ID,
                'type' => 'appointment_reminder',
                'deduplication_key' => $this->reminderKey($appointment),
                'title' => 'Appointment approaching',
                'message' => "Your appointment at {$appointment->branch_name} is scheduled for {$appointment->scheduled_at->format('M d, Y g:i A')}.",
                'data' => [
                    'scheduled_at' => $appointment->scheduled_at->toISOString(),
                    'patient_name' => $appointment->patient->full_name,
                ],
            ]);
        }

        return $appointments->count();
    }

    private function notifyBranchOfPatientAction(
        Appointment $appointment,
        Patient $patient,
        string $type,
        ?string $reason = null,
    ): void {
        $schedule = $appointment->scheduled_at->format('M d, Y g:i A');
        $isCreated = $type === 'appointment_created_by_patient';

        $this->notifications->create([
            'sender_id' => $patient->PID,
            'sender_type' => 'patient',
            'receiver_id' => null,
            'receiver_type' => 'staff',
            'branch_id' => $appointment->branch_ID,
            'appointment_id' => $appointment->appointment_ID,
            'type' => $type,
            'title' => $isCreated ? 'New patient appointment' : 'Patient updated appointment',
            'message' => $isCreated
                ? "{$patient->full_name} requested an appointment for {$schedule}."
                : "{$patient->full_name} updated appointment #{$appointment->appointment_ID} for {$schedule}.",
            'reason' => $reason,
            'data' => [
                'patient_name' => $patient->full_name,
                'appointment_status' => $appointment->status,
                'scheduled_at' => $appointment->scheduled_at->toISOString(),
            ],
        ]);
    }

    private function notifyPatient(
        Appointment $appointment,
        ?Authenticatable $staff,
        string $type,
        string $title,
        string $message,
        ?string $reason,
    ): void {
        $staffName = match (true) {
            $staff instanceof StaffAccount => $staff->full_name,
            $staff instanceof User => $staff->name,
            default => 'Clinic Staff',
        };

        $this->notifications->create([
            'sender_id' => match (true) {
                $staff instanceof StaffAccount => $staff->account_ID,
                $staff instanceof User => $staff->id,
                default => null,
            },
            'sender_type' => 'staff',
            'receiver_id' => $appointment->PID,
            'receiver_type' => 'patient',
            'branch_id' => $appointment->branch_ID,
            'appointment_id' => $appointment->appointment_ID,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'reason' => $reason,
            'data' => [
                'staff_name' => $staffName,
                'appointment_status' => $appointment->status,
                'scheduled_at' => $appointment->scheduled_at->toISOString(),
            ],
        ]);
    }

    private function reminderKey(Appointment $appointment): string
    {
        return "appointment-reminder:{$appointment->appointment_ID}";
    }
}
