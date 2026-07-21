<?php

namespace App\Services;

use App\Models\Patient;
use App\Models\PatientVisit;
use App\Notifications\PatientAccountInvitation;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PatientManagementService
{
    /**
     * @param  array{search: string, verification: string|null, per_page: int}  $filters
     * @return LengthAwarePaginator<int, Patient>
     */
    public function paginate(array $filters): LengthAwarePaginator
    {
        $searchWords = preg_split('/\s+/', $filters['search'], -1, PREG_SPLIT_NO_EMPTY) ?: [];

        return Patient::query()
            ->select([
                'PID',
                'first_name',
                'middle_name',
                'last_name',
                'email',
                'email_verified_at',
                'contact_number',
                'address',
                'sex',
                'date_of_birth',
                'civil_status',
                'created_at',
            ])
            ->addSelect([
                'last_visit_at' => PatientVisit::query()
                    ->select('visited_at')
                    ->whereColumn('PID', 'patients.PID')
                    ->latest('visited_at')
                    ->limit(1),
            ])
            ->withCasts(['last_visit_at' => 'datetime'])
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
            ->when($filters['verification'] === 'verified', fn (Builder $query): Builder => $query->whereNotNull('email_verified_at'))
            ->when($filters['verification'] === 'unverified', fn (Builder $query): Builder => $query->whereNull('email_verified_at'))
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->paginate($filters['per_page'])
            ->withQueryString();
    }

    /** @param array<string, mixed> $attributes */
    public function create(array $attributes): Patient
    {
        $temporaryPassword = Str::password(16, true, true, true, false);

        $patient = DB::transaction(fn (): Patient => Patient::create([
            ...$attributes,
            'password' => $temporaryPassword,
            'email_verified_at' => null,
        ]));

        $patient->notify(new PatientAccountInvitation($temporaryPassword));

        return $patient;
    }

    /** @param array<string, mixed> $attributes */
    public function update(Patient $patient, array $attributes): Patient
    {
        $emailChanged = $patient->email !== $attributes['email'];

        if ($emailChanged) {
            $attributes['email_verified_at'] = null;
        }

        $patient->update($attributes);
        $patient->refresh();

        if ($emailChanged) {
            $patient->notify(new PatientAccountInvitation);
        }

        return $patient;
    }

    public function delete(Patient $patient): void
    {
        $patient->delete();
    }
}
