<?php

namespace App\Http\Requests;

use App\Models\AccountRole;
use App\Models\StaffAccount;
use Illuminate\Validation\Rule;

class StoreStaffAccountRequest extends StaffAccountRequest
{
    public function authorize(): bool
    {
        $roleName = AccountRole::query()->whereKey($this->integer('role_ID'))->value('role_name');

        return is_string($roleName)
            && ($this->user()?->can('assign', [StaffAccount::class, $roleName, $this->integer('branch_ID') ?: null]) ?? false);
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return $this->staffRules(
            Rule::unique((new StaffAccount)->getTable(), 'email'),
            false,
        );
    }
}
