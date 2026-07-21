<?php

namespace App\Http\Requests;

use App\Models\Appointment;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreAppointmentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('createForBranch', [Appointment::class, $this->integer('branch_ID')]) ?? false;
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
            'PID' => ['required', 'integer', Rule::exists('patients', 'PID')],
            'doctor_account_ID' => ['nullable', 'integer', Rule::exists('staff_accounts', 'account_ID')],
            'scheduled_date' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'scheduled_time' => ['required', Rule::in(Appointment::TIME_SLOTS)],
            'appointment_type' => ['required', Rule::in(Appointment::TYPES)],
            'concern' => ['nullable', 'required_if:appointment_type,consultation', 'string', 'max:1000'],
            'service_ids' => ['nullable', 'required_if:appointment_type,service', 'array', 'min:1'],
            'service_ids.*' => ['integer', 'distinct', Rule::exists('services', 'service_ID')],
            'remarks' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /** @return array<int, callable(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            if ($this->filled('scheduled_date') && CarbonImmutable::parse($this->string('scheduled_date'))->isSunday()) {
                $validator->errors()->add('scheduled_date', 'Appointments are available Monday through Saturday only.');
            }
        }];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'concern.required_if' => 'Describe the concern for a consultation appointment.',
            'service_ids.required_if' => 'Select at least one service.',
            'scheduled_date.after_or_equal' => 'The appointment date must be today or later.',
        ];
    }
}
