<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Feedback;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class FeedbackSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $comments = [
            'Very professional staff and a thorough consultation.',
            'The doctor explained the treatment plan clearly.',
            'The service was comfortable and the staff were attentive.',
            'Booking and check-in were smooth and efficient.',
            'I am happy with the progress after the procedure.',
        ];

        Appointment::query()->where('status', 'completed')->orderBy('scheduled_at')->get()
            ->each(function (Appointment $appointment, int $index) use ($comments): void {
                $feedback = Feedback::query()->updateOrCreate(
                    ['appointment_ID' => $appointment->appointment_ID],
                    [
                        'rating' => 3 + ($index % 3),
                        'description' => $comments[$index % count($comments)],
                    ],
                );

                $feedback->forceFill([
                    'created_at' => $appointment->completed_at?->copy()->addDay() ?? now(),
                    'updated_at' => $appointment->completed_at?->copy()->addDay() ?? now(),
                ])->saveQuietly();
            });
    }
}
