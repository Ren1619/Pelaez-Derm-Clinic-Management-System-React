<?php

namespace App\Models;

use Database\Factories\AppointmentFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * @property int $appointment_ID
 * @property int|null $branch_ID
 * @property int $PID
 * @property int|null $doctor_account_ID
 * @property int|null $visit_ID
 * @property int|null $created_by
 * @property string $branch_name
 * @property string|null $doctor_name
 * @property Carbon $scheduled_at
 * @property Carbon|null $previous_scheduled_at
 * @property string $appointment_type
 * @property string|null $concern
 * @property string $status
 * @property string|null $remarks
 * @property string|null $cancellation_reason
 * @property string|null $reschedule_reason
 * @property Carbon|null $reschedule_requested_at
 * @property Carbon|null $reschedule_responded_at
 * @property Carbon|null $confirmed_at
 * @property Carbon|null $started_at
 * @property Carbon|null $completed_at
 * @property Carbon|null $cancelled_at
 */
class Appointment extends Model
{
    /** @use HasFactory<AppointmentFactory> */
    use HasFactory;

    public const STATUSES = ['today', 'pending', 'reschedule_requested', 'upcoming', 'completed', 'cancelled', 'incomplete'];

    public const RESERVING_STATUSES = ['pending', 'reschedule_requested', 'upcoming', 'today'];

    public const TYPES = ['consultation', 'service'];

    protected $primaryKey = 'appointment_ID';

    protected $fillable = [
        'branch_ID', 'PID', 'doctor_account_ID', 'visit_ID', 'created_by',
        'branch_name', 'doctor_name', 'scheduled_at', 'previous_scheduled_at',
        'appointment_type', 'concern', 'status', 'remarks', 'reschedule_reason',
        'reschedule_requested_at', 'reschedule_responded_at', 'cancellation_reason',
        'confirmed_at', 'started_at', 'completed_at', 'cancelled_at',
    ];

    /** @return BelongsTo<Branch, $this> */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'branch_ID', 'branch_ID');
    }

    /** @return BelongsTo<Patient, $this> */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'PID', 'PID');
    }

    /** @return BelongsTo<StaffAccount, $this> */
    public function doctor(): BelongsTo
    {
        return $this->belongsTo(StaffAccount::class, 'doctor_account_ID', 'account_ID');
    }

    /** @return BelongsTo<PatientVisit, $this> */
    public function visit(): BelongsTo
    {
        return $this->belongsTo(PatientVisit::class, 'visit_ID', 'visit_ID');
    }

    /** @return BelongsTo<StaffAccount, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(StaffAccount::class, 'created_by', 'account_ID');
    }

    /** @return HasMany<AppointmentService, $this> */
    public function services(): HasMany
    {
        return $this->hasMany(AppointmentService::class, 'appointment_ID', 'appointment_ID');
    }

    /** @return HasOne<Feedback, $this> */
    public function feedback(): HasOne
    {
        return $this->hasOne(Feedback::class, 'appointment_ID', 'appointment_ID');
    }

    /** @param Builder<Appointment> $query */
    public function scopeReservingSlot(Builder $query): void
    {
        $query->whereIn('status', self::RESERVING_STATUSES);
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime', 'previous_scheduled_at' => 'datetime',
            'reschedule_requested_at' => 'datetime', 'reschedule_responded_at' => 'datetime',
            'confirmed_at' => 'datetime',
            'started_at' => 'datetime', 'completed_at' => 'datetime', 'cancelled_at' => 'datetime',
        ];
    }
}
