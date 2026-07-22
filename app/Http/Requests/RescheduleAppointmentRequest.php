<?php

namespace App\Http\Requests;

use App\Models\Appointment;
use App\Services\Appointments\AppointmentScheduleService;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class RescheduleAppointmentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $appointment = $this->route('appointment');

        return $appointment instanceof Appointment
            && ($this->user()?->can('update', $appointment) ?? false);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(AppointmentScheduleService $scheduleService): array
    {
        return [
            'scheduled_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'scheduled_time' => ['required', Rule::in($scheduleService->slotValues())],
            'reschedule_reason' => ['required', 'string', 'max:1000'],
        ];
    }

    /** @return array<int, callable(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            if (
                $validator->errors()->hasAny(['scheduled_date', 'scheduled_time'])
                || ! $this->filled(['scheduled_date', 'scheduled_time'])
            ) {
                return;
            }

            $scheduledAt = CarbonImmutable::createFromFormat(
                'Y-m-d H:i',
                $this->string('scheduled_date').' '.$this->string('scheduled_time'),
            );

            if ($scheduledAt->isSunday()) {
                $validator->errors()->add('scheduled_date', 'Appointments are available Monday through Saturday only.');
            }

            $appointment = $this->route('appointment');

            if ($appointment instanceof Appointment && $appointment->scheduled_at->equalTo($scheduledAt)) {
                $validator->errors()->add('scheduled_time', 'Select a different date or time for the reschedule.');
            }
        }];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'reschedule_reason.required' => 'Explain why this appointment needs to be rescheduled.',
            'scheduled_date.after_or_equal' => 'The proposed date must be today or later.',
        ];
    }
}
