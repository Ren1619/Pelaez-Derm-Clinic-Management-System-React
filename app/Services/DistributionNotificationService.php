<?php

namespace App\Services;

use App\Models\Distribution;

class DistributionNotificationService
{
    public function __construct(private SystemNotificationService $notifications) {}

    public function inboundCreated(Distribution $distribution): void
    {
        $distribution->loadMissing(['fromBranch:branch_ID,branch_name', 'toBranch:branch_ID,branch_name']);

        $this->notifications->create([
            'sender_id' => $distribution->created_by,
            'sender_type' => 'staff',
            'receiver_id' => null,
            'receiver_type' => 'staff',
            'branch_id' => $distribution->to_branch_ID,
            'appointment_id' => null,
            'type' => 'distribution_inbound',
            'deduplication_key' => "distribution-inbound:{$distribution->distribution_ID}",
            'title' => 'Inbound distribution created',
            'message' => "Distribution #{$distribution->distribution_ID} from {$distribution->fromBranch->branch_name} is inbound to {$distribution->toBranch->branch_name}.",
            'data' => [
                'distribution_id' => $distribution->distribution_ID,
                'from_branch_name' => $distribution->fromBranch->branch_name,
                'to_branch_name' => $distribution->toBranch->branch_name,
            ],
        ]);
    }

    public function received(Distribution $distribution): void
    {
        $distribution->loadMissing(['fromBranch:branch_ID,branch_name', 'toBranch:branch_ID,branch_name']);

        $this->notifications->create([
            'sender_id' => null,
            'sender_type' => 'staff',
            'receiver_id' => null,
            'receiver_type' => 'staff',
            'branch_id' => $distribution->from_branch_ID,
            'appointment_id' => null,
            'type' => 'distribution_received',
            'deduplication_key' => "distribution-received:{$distribution->distribution_ID}",
            'title' => 'Outbound distribution received',
            'message' => "{$distribution->toBranch->branch_name} received distribution #{$distribution->distribution_ID} from {$distribution->fromBranch->branch_name}.",
            'data' => [
                'distribution_id' => $distribution->distribution_ID,
                'from_branch_name' => $distribution->fromBranch->branch_name,
                'to_branch_name' => $distribution->toBranch->branch_name,
            ],
        ]);
    }
}
