<?php

namespace App\Models;

use App\Enums\AccountType;
use App\Notifications\AccountPasswordResetNotification;
use App\Notifications\PatientAccountInvitation;
use Database\Factories\PatientFactory;
use Illuminate\Auth\MustVerifyEmail as MustVerifyEmailTrait;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;

/**
 * @property int $PID
 * @property string $password
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string $contact_number
 * @property string $first_name
 * @property string|null $middle_name
 * @property string $last_name
 * @property string $address
 * @property string $sex
 * @property Carbon $date_of_birth
 * @property string $civil_status
 * @property-read string $full_name
 * @property-read int $age
 */
class Patient extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<PatientFactory> */
    use HasFactory, MustVerifyEmailTrait, Notifiable;

    protected $primaryKey = 'PID';

    protected $fillable = [
        'password',
        'email',
        'email_verified_at',
        'contact_number',
        'first_name',
        'middle_name',
        'last_name',
        'address',
        'sex',
        'date_of_birth',
        'civil_status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    public function getFullNameAttribute(): string
    {
        return collect([$this->first_name, $this->middle_name, $this->last_name])
            ->filter()
            ->implode(' ');
    }

    public function getAgeAttribute(): int
    {
        return $this->date_of_birth->age;
    }

    public function sendEmailVerificationNotification(): void
    {
        $this->notify(new PatientAccountInvitation);
    }

    /**
     * Send the patient account's queued password reset email.
     */
    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new AccountPasswordResetNotification((string) $token, AccountType::Patient));
    }

    /** @return HasMany<PatientVisit, $this> */
    public function visits(): HasMany
    {
        return $this->hasMany(PatientVisit::class, 'PID', 'PID');
    }

    /** @return HasOne<PatientVisit, $this> */
    public function latestVisit(): HasOne
    {
        return $this->hasOne(PatientVisit::class, 'PID', 'PID')->latestOfMany('visited_at');
    }

    /** @return HasMany<PatientAllergy, $this> */
    public function allergies(): HasMany
    {
        return $this->hasMany(PatientAllergy::class, 'PID', 'PID');
    }

    /** @return HasMany<PatientMedicalCondition, $this> */
    public function medicalConditions(): HasMany
    {
        return $this->hasMany(PatientMedicalCondition::class, 'PID', 'PID');
    }

    /** @return HasMany<PatientMedication, $this> */
    public function medications(): HasMany
    {
        return $this->hasMany(PatientMedication::class, 'PID', 'PID');
    }

    /** @return HasMany<Sale, $this> */
    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class, 'PID', 'PID');
    }

    /** @return HasMany<Appointment, $this> */
    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'PID', 'PID');
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'date_of_birth' => 'date',
            'password' => 'hashed',
        ];
    }
}
