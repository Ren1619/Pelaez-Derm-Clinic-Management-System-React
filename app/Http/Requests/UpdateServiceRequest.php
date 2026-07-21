<?php

namespace App\Http\Requests;

use App\Models\Service;

class UpdateServiceRequest extends ServiceRequest
{
    public function authorize(): bool
    {
        $service = $this->route('service');

        return $service instanceof Service
            && ($this->user()?->can('update', $service) ?? false);
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        /** @var Service $service */
        $service = $this->route('service');

        return $this->serviceRules($this->uniqueNameRule($service));
    }
}
