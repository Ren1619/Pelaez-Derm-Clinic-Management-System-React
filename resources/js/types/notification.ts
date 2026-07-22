export type SystemNotificationItem = {
    id: number;
    type:
        | 'appointment_reminder'
        | 'appointment_rejected'
        | 'appointment_reschedule_requested'
        | 'appointment_created_by_patient'
        | 'appointment_updated_by_patient'
        | 'inventory_low_stock'
        | 'distribution_inbound'
        | 'distribution_received'
        | 'feedback_submitted';
    title: string;
    message: string;
    is_read: boolean;
    branch_id: number | null;
    appointment_id: number | null;
    data: Record<string, unknown>;
    created_at: string | null;
};

export type NotificationSummary = {
    unread_count: number;
    items: SystemNotificationItem[];
};
