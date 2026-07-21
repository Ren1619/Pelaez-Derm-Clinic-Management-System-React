<?php

namespace App\Models;

use App\Enums\StaffModule;
use App\Enums\StaffRole;
use App\Notifications\StaffAccountInvitation;
use Database\Factories\StaffAccountFactory;
use Illuminate\Auth\MustVerifyEmail as MustVerifyEmailTrait;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;

/**
 * @property int $account_ID
 * @property int|null $branch_ID
 * @property int $role_ID
 * @property string $first_name
 * @property string|null $middle_name
 * @property string $last_name
 * @property string $contact_number
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property bool $is_active
 * @property string $password
 * @property-read string $full_name
 * @property-read string $name
 * @property-read Branch|null $branch
 * @property-read AccountRole $role
 */
class StaffAccount extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<StaffAccountFactory> */
    use HasFactory, MustVerifyEmailTrait, Notifiable;

    protected $primaryKey = 'account_ID';

    protected $fillable = [
        'branch_ID',
        'role_ID',
        'first_name',
        'middle_name',
        'last_name',
        'contact_number',
        'email',
        'email_verified_at',
        'is_active',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    /** @return BelongsTo<Branch, $this> */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_ID', 'branch_ID');
    }

    /** @return BelongsTo<AccountRole, $this> */
    public function role(): BelongsTo
    {
        return $this->belongsTo(AccountRole::class, 'role_ID', 'role_ID');
    }

    /** @return HasMany<PatientVisit, $this> */
    public function patientVisits(): HasMany
    {
        return $this->hasMany(PatientVisit::class, 'doctor_account_ID', 'account_ID');
    }

    /** @return HasMany<Appointment, $this> */
    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'doctor_account_ID', 'account_ID');
    }

    /** @return HasMany<Distribution, $this> */
    public function createdDistributions(): HasMany
    {
        return $this->hasMany(Distribution::class, 'created_by', 'account_ID');
    }

    public function getFullNameAttribute(): string
    {
        return collect([$this->first_name, $this->middle_name, $this->last_name])
            ->filter()
            ->implode(' ');
    }

    public function getNameAttribute(): string
    {
        return $this->full_name;
    }

    public function roleKey(): ?StaffRole
    {
        return StaffRole::tryFrom($this->role?->role_name ?? '');
    }

    public function isSuperAdmin(): bool
    {
        return $this->roleKey() === StaffRole::SuperAdmin;
    }

    public function isAdmin(): bool
    {
        return $this->roleKey() === StaffRole::Admin;
    }

    public function isStaff(): bool
    {
        return $this->roleKey() === StaffRole::Staff;
    }

    public function isDoctor(): bool
    {
        return $this->roleKey() === StaffRole::Doctor;
    }

    public function canAccessModule(StaffModule $module): bool
    {
        return in_array($module, $this->roleKey()?->modules() ?? [], true);
    }

    public function canAccessBranch(?int $branchId): bool
    {
        return $this->isSuperAdmin()
            || ($branchId !== null && $this->branch_ID === $branchId);
    }

    public function sendEmailVerificationNotification(): void
    {
        $this->notify(new StaffAccountInvitation);
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'is_active' => 'boolean',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }
}
