<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * @property int $visit_ID
 * @property int $PID
 * @property int|null $branch_ID
 * @property int|null $doctor_account_ID
 * @property string $branch_name
 * @property string|null $doctor_name
 * @property Carbon $visited_at
 * @property string|null $blood_pressure
 * @property string|null $weight
 * @property string|null $height
 * @property string $status
 * @property Carbon|null $finalized_at
 * @property-read Patient $patient
 * @property-read Branch|null $branch
 * @property-read StaffAccount|null $doctor
 */

class PatientVisit extends Model
{
    /** @use HasFactory<\Database\Factories\PatientVisitFactory> */
    use HasFactory;

    protected $primaryKey = 'visit_ID';

    protected $attributes = ['status' => 'in_progress'];

    protected $fillable = [
        'PID',
        'branch_ID',
        'doctor_account_ID',
        'branch_name',
        'doctor_name',
        'visited_at',
        'blood_pressure',
        'weight',
        'height',
        'status',
        'finalized_at',
    ];

    /** @return BelongsTo<Patient, $this> */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'PID', 'PID');
    }

    /** @return BelongsTo<Branch, $this> */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_ID', 'branch_ID');
    }

    /** @return BelongsTo<StaffAccount, $this> */
    public function doctor(): BelongsTo
    {
        return $this->belongsTo(StaffAccount::class, 'doctor_account_ID', 'account_ID');
    }

    /** @return HasMany<PatientVisitService, $this> */
    public function services(): HasMany
    {
        return $this->hasMany(PatientVisitService::class, 'visit_ID', 'visit_ID');
    }

    /** @return HasMany<PatientVisitProduct, $this> */
    public function products(): HasMany
    {
        return $this->hasMany(PatientVisitProduct::class, 'visit_ID', 'visit_ID');
    }

    /** @return HasMany<PatientVisitDiagnosis, $this> */
    public function diagnoses(): HasMany
    {
        return $this->hasMany(PatientVisitDiagnosis::class, 'visit_ID', 'visit_ID');
    }

    /** @return HasMany<PatientVisitPrescription, $this> */
    public function prescriptions(): HasMany
    {
        return $this->hasMany(PatientVisitPrescription::class, 'visit_ID', 'visit_ID');
    }

    /** @return HasOne<Appointment, $this> */
    public function appointment(): HasOne
    {
        return $this->hasOne(Appointment::class, 'visit_ID', 'visit_ID');
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'visited_at' => 'datetime',
            'finalized_at' => 'datetime',
            'weight' => 'decimal:2',
            'height' => 'decimal:2',
        ];
    }
}
