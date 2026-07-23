<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Branch;
use App\Models\Feedback;
use Illuminate\Database\Eloquent\Builder;

class FeedbackService
{
    /** @param array<string, mixed> $filters
     *  @return array<string, mixed>
     */
    public function payload(array $filters): array
    {
        $feedbackQuery = $this->feedbackQuery($filters);
        $feedbacks = (clone $feedbackQuery)->latest()->paginate($filters['per_page'])->withQueryString();

        return [
            'feedbacks' => $feedbacks->through(fn (Feedback $feedback): array => $this->serializeFeedback($feedback)),
            'branches' => Branch::query()
                ->when(! $filters['can_view_all_branches'], fn (Builder $query) => $query->whereKey($filters['branch_ID']))
                ->orderBy('branch_name')
                ->get(['branch_ID', 'branch_name']),
            'filters' => $filters,
        ];
    }

    /** @param array<string, mixed> $filters
     *  @return Builder<Feedback>
     */
    private function feedbackQuery(array $filters): Builder
    {
        return Feedback::query()
            ->with(['appointment.patient:PID,first_name,middle_name,last_name,contact_number', 'appointment.services'])
            ->when($filters['branch_ID'], fn (Builder $query, int $branchId) => $query->whereHas('appointment', fn (Builder $appointment) => $appointment->where('branch_ID', $branchId)))
            ->when($filters['date_from'], fn (Builder $query, string $date) => $query->whereDate('created_at', '>=', $date))
            ->when($filters['date_to'], fn (Builder $query, string $date) => $query->whereDate('created_at', '<=', $date))
            ->when($filters['rating'], fn (Builder $query, int $rating) => $query->where('rating', $rating))
            ->when($filters['appointment_type'] !== 'all', fn (Builder $query) => $query->whereHas('appointment', fn (Builder $appointment) => $appointment->where('appointment_type', $filters['appointment_type'])))
            ->when($filters['search'], fn (Builder $query, string $search) => $this->applySearch($query, $search));
    }

    /** @return Builder<Feedback> */
    private function applySearch(Builder $query, string $search): Builder
    {
        if (preg_match('/^PDC-(\d+)$/i', $search, $matches) === 1) {
            return $query->where('appointment_ID', (int) $matches[1]);
        }

        return $query->where(function (Builder $nested) use ($search): void {
            $nested->where('description', 'like', '%'.$search.'%')
                ->orWhereHas('appointment', fn (Builder $appointment) => $appointment
                    ->where('appointment_ID', 'like', '%'.$search.'%')
                    ->orWhere('concern', 'like', '%'.$search.'%')
                    ->orWhereHas('patient', fn (Builder $patient) => $patient
                        ->where('first_name', 'like', '%'.$search.'%')
                        ->orWhere('middle_name', 'like', '%'.$search.'%')
                        ->orWhere('last_name', 'like', '%'.$search.'%'))
                    ->orWhereHas('services', fn (Builder $service) => $service->where('service_name', 'like', '%'.$search.'%')));
        });
    }

    /** @return array<string, mixed> */
    private function serializeFeedback(Feedback $feedback): array
    {
        return [
            ...app(NewRecordService::class)->metadata($feedback),
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
