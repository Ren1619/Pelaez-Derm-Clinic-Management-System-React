<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatientAllergy extends Model
{
    /** @use HasFactory<\Database\Factories\PatientAllergyFactory> */
    use HasFactory;

    protected $primaryKey = 'allergy_ID';

    protected $fillable = ['PID', 'allergy', 'note'];

    /** @return BelongsTo<Patient, $this> */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class, 'PID', 'PID');
    }
}
