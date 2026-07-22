<?php

namespace App\Services;

use App\Models\StaffAccount;
use App\Notifications\StaffAccountInvitation;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class StaffAccountService
{
    /**
     * @param  array{search: string, branch_ID: int|null, role_ID: int|null, verification: string|null, status: string|null, per_page: int}  $filters
     * @return LengthAwarePaginator<int, StaffAccount>
     */
    public function paginate(array $filters): LengthAwarePaginator
    {
        return $this->filteredQuery($filters)
            ->orderByDesc('is_active')
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->paginate($filters['per_page'])
            ->withQueryString();
    }

    /** @param array<string, mixed> $attributes */
    public function create(array $attributes): StaffAccount
    {
        $initialPassword = Str::password(40, true, true, true, false);

        $staffAccount = DB::transaction(fn (): StaffAccount => StaffAccount::create([
            ...$attributes,
            'password' => $initialPassword,
            'email_verified_at' => null,
            'is_active' => true,
        ]));

        $passwordResetToken = Password::broker('staff_accounts')->createToken($staffAccount);
        $staffAccount->notify(new StaffAccountInvitation($passwordResetToken));

        return $staffAccount;
    }

    /** @param array<string, mixed> $attributes */
    public function update(StaffAccount $staffAccount, array $attributes): StaffAccount
    {
        $emailChanged = $staffAccount->email !== $attributes['email'];

        if (blank($attributes['password'] ?? null)) {
            unset($attributes['password']);
        }

        unset($attributes['password_confirmation']);

        if ($emailChanged) {
            $attributes['email_verified_at'] = null;
        }

        $staffAccount->update($attributes);
        $staffAccount->refresh();

        if ($emailChanged) {
            $staffAccount->notify(new StaffAccountInvitation);
        }

        return $staffAccount;
    }

    public function toggleStatus(StaffAccount $staffAccount): StaffAccount
    {
        return DB::transaction(function () use ($staffAccount): StaffAccount {
            $lockedStaff = StaffAccount::query()
                ->with('role:role_ID,role_name')
                ->whereKey($staffAccount->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedStaff->is_active && $this->isLastProtectedAccount($lockedStaff)) {
                $roleLabel = $lockedStaff->role->role_name === 'super_admin'
                    ? 'Super Admin'
                    : 'Admin for this branch';

                throw ValidationException::withMessages([
                    'status' => "The last active {$roleLabel} account cannot be disabled.",
                ]);
            }

            $lockedStaff->update(['is_active' => ! $lockedStaff->is_active]);

            return $lockedStaff->refresh();
        });
    }

    /**
     * @param  array{search: string, branch_ID: int|null, role_ID: int|null, verification: string|null, status: string|null, per_page: int}  $filters
     * @return Builder<StaffAccount>
     */
    private function filteredQuery(array $filters): Builder
    {
        $searchWords = preg_split('/\s+/', $filters['search'], -1, PREG_SPLIT_NO_EMPTY) ?: [];

        return StaffAccount::query()
            ->select([
                'account_ID',
                'branch_ID',
                'role_ID',
                'first_name',
                'middle_name',
                'last_name',
                'contact_number',
                'email',
                'email_verified_at',
                'is_active',
                'created_at',
            ])
            ->with([
                'branch:branch_ID,branch_name',
                'role:role_ID,role_name',
            ])
            ->when($filters['search'], function (Builder $query, string $search) use ($searchWords): void {
                $query->where(function (Builder $searchQuery) use ($search, $searchWords): void {
                    $searchQuery
                        ->whereLike('first_name', "%{$search}%")
                        ->orWhereLike('middle_name', "%{$search}%")
                        ->orWhereLike('last_name', "%{$search}%")
                        ->orWhereLike('email', "%{$search}%")
                        ->orWhereLike('contact_number', "%{$search}%");

                    if (count($searchWords) >= 2) {
                        $searchQuery->orWhere(function (Builder $nameQuery) use ($searchWords): void {
                            $nameQuery
                                ->whereLike('first_name', "%{$searchWords[0]}%")
                                ->whereLike('last_name', '%'.$searchWords[array_key_last($searchWords)].'%');
                        });
                    }
                });
            })
            ->when($filters['branch_ID'], fn (Builder $query, int $branchId): Builder => $query->where('branch_ID', $branchId))
            ->when($filters['role_ID'], fn (Builder $query, int $roleId): Builder => $query->where('role_ID', $roleId))
            ->when($filters['verification'] === 'verified', fn (Builder $query): Builder => $query->whereNotNull('email_verified_at'))
            ->when($filters['verification'] === 'unverified', fn (Builder $query): Builder => $query->whereNull('email_verified_at'))
            ->when($filters['status'] === 'active', fn (Builder $query): Builder => $query->where('is_active', true))
            ->when($filters['status'] === 'inactive', fn (Builder $query): Builder => $query->where('is_active', false));
    }

    private function isLastProtectedAccount(StaffAccount $staffAccount): bool
    {
        if (! in_array($staffAccount->role->role_name, ['super_admin', 'admin'], true)) {
            return false;
        }

        return StaffAccount::query()
            ->whereHas('role', fn (Builder $query): Builder => $query->where('role_name', $staffAccount->role->role_name))
            ->when(
                $staffAccount->role->role_name === 'admin',
                fn (Builder $query): Builder => $query->where('branch_ID', $staffAccount->branch_ID),
            )
            ->where('is_active', true)
            ->whereKeyNot($staffAccount->getKey())
            ->lockForUpdate()
            ->first() === null;
    }
}
