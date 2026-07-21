<?php

namespace App\Http\Requests;

use App\Models\Appointment;
use App\Models\Feedback;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StorePatientFeedbackRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $patientId = Auth::guard('patient')->id();

        return $patientId !== null
            && Appointment::query()
                ->whereKey($this->integer('appointment_ID'))
                ->where('PID', $patientId)
                ->exists();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'appointment_ID' => [
                'required',
                'integer',
                Rule::exists((new Appointment)->getTable(), 'appointment_ID'),
                Rule::unique((new Feedback)->getTable(), 'appointment_ID'),
            ],
            'rating' => ['required', 'integer', 'between:1,5'],
            'description' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /** @return array<int, callable(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            if (! $this->filled('appointment_ID')) {
                return;
            }

            $appointment = Appointment::query()
                ->whereKey($this->integer('appointment_ID'))
                ->where('PID', Auth::guard('patient')->id())
                ->first();

            if ($appointment !== null && $appointment->status !== 'completed') {
                $validator->errors()->add('appointment_ID', 'Feedback can only be submitted for a completed appointment.');
            }
        }];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'appointment_ID.unique' => 'Feedback has already been submitted for this appointment.',
            'rating.between' => 'Choose a rating from 1 to 5 stars.',
            'description.max' => 'Comments cannot exceed 1000 characters.',
        ];
    }
}
