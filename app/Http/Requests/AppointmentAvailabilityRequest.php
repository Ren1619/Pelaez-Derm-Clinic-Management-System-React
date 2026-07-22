<?php

namespace App\Http\Requests;

use App\Models\Appointment;
use App\Models\Patient;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class AppointmentAvailabilityRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $excludedAppointmentId = $this->integer('exclude_appointment_ID') ?: null;
        $excludedAppointment = $excludedAppointmentId === null
            ? null
            : Appointment::query()->find($excludedAppointmentId);
        $patient = $this->user('patient');

        if ($patient instanceof Patient) {
            return $excludedAppointment === null || $excludedAppointment->PID === $patient->PID;
        }

        $staff = $this->user();

        return $staff->can('createForBranch', [Appointment::class, $this->integer('branch_ID')])
            && ($excludedAppointment === null || $staff->can('view', $excludedAppointment));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'branch_ID' => ['required', 'integer', Rule::exists('branches', 'branch_ID')],
            'date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'exclude_appointment_ID' => ['nullable', 'integer', Rule::exists('appointments', 'appointment_ID')],
        ];
    }

    /** @return array<int, callable(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            if (
                ! $validator->errors()->has('date')
                && $this->filled('date')
                && CarbonImmutable::parse($this->string('date'))->isSunday()
            ) {
                $validator->errors()->add('date', 'Appointments are available Monday through Saturday only.');
            }
        }];
    }
}
