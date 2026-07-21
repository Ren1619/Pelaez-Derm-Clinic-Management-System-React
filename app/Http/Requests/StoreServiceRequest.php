<?php

namespace App\Http\Requests;

use App\Models\Service;

class StoreServiceRequest extends ServiceRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Service::class) ?? false;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return $this->serviceRules($this->uniqueNameRule());
    }
}
