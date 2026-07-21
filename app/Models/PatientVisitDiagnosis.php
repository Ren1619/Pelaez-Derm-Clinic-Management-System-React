<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatientVisitDiagnosis extends Model
{
    /** @use HasFactory<\Database\Factories\PatientVisitDiagnosisFactory> */
    use HasFactory;

    protected $primaryKey = 'diagnosis_ID';

    protected $fillable = ['visit_ID', 'diagnosis', 'note'];

    /** @return BelongsTo<PatientVisit, $this> */
    public function visit(): BelongsTo
    {
        return $this->belongsTo(PatientVisit::class, 'visit_ID', 'visit_ID');
    }
}
