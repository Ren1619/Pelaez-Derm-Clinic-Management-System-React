<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AppointmentService extends Model
{
    /** @use HasFactory<\Database\Factories\AppointmentServiceFactory> */
    use HasFactory;

    protected $primaryKey = 'appointment_service_ID';

    protected $fillable = ['appointment_ID', 'service_ID', 'service_name'];

    /** @return BelongsTo<Appointment, $this> */
    public function appointment(): BelongsTo { return $this->belongsTo(Appointment::class, 'appointment_ID', 'appointment_ID'); }

    /** @return BelongsTo<Service, $this> */
    public function service(): BelongsTo { return $this->belongsTo(Service::class, 'service_ID', 'service_ID'); }
}
