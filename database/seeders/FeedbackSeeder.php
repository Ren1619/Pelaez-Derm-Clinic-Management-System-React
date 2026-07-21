<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Feedback;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class FeedbackSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $comments = [
            'Very professional staff and a thorough consultation.',
            'The doctor explained everything clearly and answered my questions.',
            'The service was comfortable and the staff were attentive.',
        ];

        Appointment::query()->where('status', 'completed')->doesntHave('feedback')->latest('scheduled_at')->limit(3)->get()
            ->each(function (Appointment $appointment, int $index) use ($comments): void {
                Feedback::query()->create([
                    'appointment_ID' => $appointment->appointment_ID,
                    'rating' => $index === 1 ? 4 : 5,
                    'description' => $comments[$index],
                ]);
            });
    }
}
