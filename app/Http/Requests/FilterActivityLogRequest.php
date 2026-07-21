<?php

namespace App\Http\Requests;

use App\Models\ActivityLog;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FilterActivityLogRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:100'],
            'context' => ['required', Rule::in(['all', ...array_keys(ActivityLog::contextLabels())])],
            'action' => ['required', Rule::in(['all', 'created', 'viewed', 'updated', 'deleted', 'restored'])],
            'actor_type' => ['required', Rule::in(['all', 'staff', 'patient', 'system'])],
            'time_period' => ['required', Rule::in(['all_time', 'today', 'yesterday', 'this_week', 'this_month', 'last_3_months', 'last_year', 'custom'])],
            'date_from' => ['nullable', 'date_format:Y-m-d', 'required_if:time_period,custom'],
            'date_to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:date_from', 'required_if:time_period,custom'],
            'per_page' => ['required', 'integer', Rule::in([10, 25, 50])],
            'page' => ['sometimes', 'integer', 'min:1'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'search' => $this->string('search')->squish()->toString(),
            'context' => $this->input('context', 'all'),
            'action' => $this->input('action', 'all'),
            'actor_type' => $this->input('actor_type', 'all'),
            'time_period' => $this->input('time_period', 'all_time'),
            'per_page' => $this->input('per_page', 10),
        ]);
    }
}
