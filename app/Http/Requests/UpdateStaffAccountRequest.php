<?php

namespace App\Http\Requests;

use App\Models\AccountRole;
use App\Models\StaffAccount;
use Illuminate\Validation\Rule;

class UpdateStaffAccountRequest extends StaffAccountRequest
{
    public function authorize(): bool
    {
        $staffAccount = $this->route('staffAccount');
        $roleName = AccountRole::query()->whereKey($this->integer('role_ID'))->value('role_name');

        return $staffAccount instanceof StaffAccount
            && is_string($roleName)
            && ($this->user()?->can('update', $staffAccount) ?? false)
            && ($this->user()?->can('assign', [StaffAccount::class, $roleName, $this->integer('branch_ID') ?: null]) ?? false);
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        /** @var StaffAccount $staffAccount */
        $staffAccount = $this->route('staffAccount');

        return $this->staffRules(
            Rule::unique((new StaffAccount)->getTable(), 'email')->ignore($staffAccount),
            true,
        );
    }
}
