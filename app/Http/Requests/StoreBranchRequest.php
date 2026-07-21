<?php

namespace App\Http\Requests;

use App\Models\Branch;
use Illuminate\Validation\Rule;

class StoreBranchRequest extends BranchRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('create', Branch::class) ?? false;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return $this->branchRules(
            Rule::unique((new Branch)->getTable(), 'branch_name'),
        );
    }
}
