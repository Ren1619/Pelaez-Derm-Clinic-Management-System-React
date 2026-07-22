<?php

namespace App\Console\Commands;

use App\Services\AppointmentNotificationService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('appointments:generate-reminders')]
#[Description('Create patient notifications for appointments occurring within 24 hours')]
class GenerateAppointmentReminders extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(AppointmentNotificationService $notifications): int
    {
        $count = $notifications->createDueReminders();
        $this->info("Appointment reminders are current for {$count} appointment(s).");

        return self::SUCCESS;
    }
}
