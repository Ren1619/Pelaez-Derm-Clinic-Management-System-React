<?php

namespace App\Http\Requests;

use App\Enums\StaffModule;
use App\Models\Branch;
use App\Models\StaffAccount;
use App\Models\User;
use App\Support\ReportStatisticPeriod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReportFilterRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        return $user instanceof User
            || ($user instanceof StaffAccount && $user->is_active && $user->canAccessModule(StaffModule::Reports));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'statistic_periods' => ['nullable', 'array'],
            'statistic_periods.*' => ['array'],
            'statistic_periods.*.period' => ['nullable', Rule::in(ReportStatisticPeriod::PERIODS)],
            'statistic_periods.*.month' => ['nullable', 'integer', 'between:1,12'],
            'statistic_periods.*.year' => ['nullable', 'integer', 'between:2000,'.now()->year],
            'branch_ID' => ['nullable', 'integer', Rule::exists((new Branch)->getTable(), 'branch_ID')],
            'sales_period' => ['nullable', Rule::in(['today', 'week', 'month', 'quarter', 'year', 'all', 'specific_date', 'custom_range'])],
            'specific_date' => ['nullable', 'date'],
            'custom_start_date' => ['nullable', 'date'],
            'custom_end_date' => ['nullable', 'date', 'after_or_equal:custom_start_date'],
            'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', Rule::in([10, 25, 50])],
            'anonymize' => ['nullable', 'boolean'],
        ];
    }
}
