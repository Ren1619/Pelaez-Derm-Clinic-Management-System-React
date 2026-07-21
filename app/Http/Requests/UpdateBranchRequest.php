<?php

namespace App\Http\Requests;

use App\Models\Branch;
use Illuminate\Validation\Rule;

class UpdateBranchRequest extends BranchRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $branch = $this->route('branch');

        return $branch instanceof Branch
            && ($this->user()?->can('update', $branch) ?? false);
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        /** @var Branch $branch */
        $branch = $this->route('branch');

        return $this->branchRules(
            Rule::unique((new Branch)->getTable(), 'branch_name')->ignore($branch),
        );
    }
}
