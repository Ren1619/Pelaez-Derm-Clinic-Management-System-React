<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatientVisitPrescription extends Model
{
    /** @use HasFactory<\Database\Factories\PatientVisitPrescriptionFactory> */
    use HasFactory;

    protected $primaryKey = 'prescription_ID';

    protected $fillable = ['visit_ID', 'prescription', 'dosage', 'frequency', 'duration', 'note'];

    /** @return BelongsTo<PatientVisit, $this> */
    public function visit(): BelongsTo
    {
        return $this->belongsTo(PatientVisit::class, 'visit_ID', 'visit_ID');
    }
}
