<?php

namespace App\Console\Commands;

use App\Services\Appointments\AppointmentStatusService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('appointments:sync-statuses')]
#[Description('Update appointment statuses based on their scheduled dates')]
class SyncAppointmentStatuses extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(AppointmentStatusService $statusService): int
    {
        $statusService->sync();
        $this->info('Appointment statuses synchronized.');

        return self::SUCCESS;
    }
}
