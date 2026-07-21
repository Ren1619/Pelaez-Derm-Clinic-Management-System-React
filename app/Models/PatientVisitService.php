<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PatientVisitService extends Model
{
    /** @use HasFactory<\Database\Factories\PatientVisitServiceFactory> */
    use HasFactory;

    protected $primaryKey = 'visit_service_ID';

    protected $fillable = ['visit_ID', 'service_ID', 'service_name', 'quantity', 'note'];

    /** @return BelongsTo<PatientVisit, $this> */
    public function visit(): BelongsTo
    {
        return $this->belongsTo(PatientVisit::class, 'visit_ID', 'visit_ID');
    }

    /** @return BelongsTo<Service, $this> */
    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class, 'service_ID', 'service_ID');
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['quantity' => 'integer'];
    }
}
