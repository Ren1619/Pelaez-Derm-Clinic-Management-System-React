export type AppointmentStatus =
    | 'today'
    | 'pending'
    | 'reschedule_requested'
    | 'upcoming'
    | 'completed'
    | 'cancelled'
    | 'incomplete';
export type AppointmentType = 'consultation' | 'service';

export type AppointmentTimeSlot = {
    value: string;
    label: string;
    booked_count?: number;
    remaining_capacity?: number;
    is_available?: boolean;
};

export type Appointment = {
    appointment_ID: number;
    PID: number;
    patient_name: string;
    patient_contact: string | null;
    branch_ID: number | null;
    branch_name: string;
    doctor_account_ID: number | null;
    doctor_name: string | null;
    visit_ID: number | null;
    scheduled_at: string;
    previous_scheduled_at: string | null;
    appointment_type: AppointmentType;
    concern: string | null;
    services: Array<{
        appointment_service_ID: number;
        service_ID: number | null;
        service_name: string;
    }>;
    status: AppointmentStatus;
    remarks: string | null;
    reschedule_reason: string | null;
    reschedule_requested_at: string | null;
    reschedule_responded_at: string | null;
    cancellation_reason: string | null;
    confirmed_at: string | null;
    started_at: string | null;
    completed_at: string | null;
    can_approve: boolean;
    can_edit: boolean;
    can_patient_edit: boolean;
    can_accept_reschedule: boolean;
    can_cancel: boolean;
    can_start: boolean;
    can_complete: boolean;
};

export type AppointmentPaginator = {
    data: Appointment[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
};

export type AppointmentFilters = {
    status: AppointmentStatus | 'all';
    branch_ID: number | null;
    appointment_type: AppointmentType | 'all';
    search: string;
    month: string;
    per_page: number;
};

export type AppointmentOptions = {
    branches: Array<{ branch_ID: number; branch_name: string }>;
    patients: Array<{ PID: number; full_name: string; contact_number: string }>;
    doctors: Array<{
        account_ID: number;
        full_name: string;
        branch_ID: number | null;
    }>;
    services: Array<{
        service_ID: number;
        name: string;
        category_name: string;
    }>;
    timeSlots: AppointmentTimeSlot[];
};
