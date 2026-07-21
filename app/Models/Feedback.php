<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $feedback_ID
 * @property int $appointment_ID
 * @property int $rating
 * @property string|null $description
 * @property-read Appointment $appointment
 */

class Feedback extends Model
{
    /** @use HasFactory<\Database\Factories\FeedbackFactory> */
    use HasFactory;

    protected $table = 'feedbacks';

    protected $primaryKey = 'feedback_ID';

    protected $fillable = ['appointment_ID', 'rating', 'description'];

    /** @return BelongsTo<Appointment, $this> */
    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class, 'appointment_ID', 'appointment_ID');
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['rating' => 'integer'];
    }
}
