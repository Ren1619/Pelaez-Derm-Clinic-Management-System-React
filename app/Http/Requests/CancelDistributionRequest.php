<?php

namespace App\Http\Requests;

use App\Models\Distribution;
use Illuminate\Foundation\Http\FormRequest;

class CancelDistributionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $distribution = $this->route('distribution');

        return $distribution instanceof Distribution
            && ($this->user()?->can('cancel', $distribution) ?? false);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'cancellation_reason' => ['required', 'string', 'max:500'],
        ];
    }
}
