<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatientMedication extends Model
{
    /** @use HasFactory<\Database\Factories\PatientMedicationFactory> */
    use HasFactory;

    protected $primaryKey = 'medication_ID';

    protected $fillable = ['PID', 'medication', 'dosage', 'frequency', 'duration', 'note'];

    /** @return BelongsTo<Patient, $this> */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'PID', 'PID');
    }
}
