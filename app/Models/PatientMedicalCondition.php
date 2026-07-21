<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatientMedicalCondition extends Model
{
    /** @use HasFactory<\Database\Factories\PatientMedicalConditionFactory> */
    use HasFactory;

    protected $primaryKey = 'medical_condition_ID';

    protected $fillable = ['PID', 'condition', 'note'];

    /** @return BelongsTo<Patient, $this> */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'PID', 'PID');
    }
}
