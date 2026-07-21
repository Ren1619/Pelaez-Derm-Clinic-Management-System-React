<?php

namespace App\Http\Requests;

use App\Enums\StaffModule;
use App\Models\Branch;
use App\Models\StaffAccount;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DashboardFilterRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        return $user instanceof User
            || ($user instanceof StaffAccount
                && $user->is_active
                && $user->canAccessModule(StaffModule::Dashboard));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'month' => ['nullable', 'date_format:Y-m'],
            'date' => ['nullable', 'date_format:Y-m-d'],
            'branch_ID' => [
                'nullable',
                'integer',
                Rule::exists((new Branch)->getTable(), 'branch_ID'),
            ],
        ];
    }
}
