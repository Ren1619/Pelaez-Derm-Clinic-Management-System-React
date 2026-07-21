export type FeedbackAppointment = {
    appointment_ID: number;
    appointment_code: string;
    PID: number;
    patient_name: string;
    patient_contact: string | null;
    branch_ID: number | null;
    branch_name: string;
    visit_ID: number | null;
    scheduled_at: string;
    appointment_type: 'consultation' | 'service';
    concern: string | null;
    services: Array<{ service_ID: number | null; service_name: string }>;
};

export type Feedback = {
    feedback_ID: number;
    rating: number;
    description: string | null;
    submitted_at: string;
    appointment: FeedbackAppointment;
};

export type FeedbackPaginator = {
    data: Feedback[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
};

export type FeedbackFilters = {
    search: string;
    date_from: string | null;
    date_to: string | null;
    all_dates: boolean;
    rating: number | null;
    appointment_type: 'all' | 'consultation' | 'service';
    branch_ID: number | null;
    per_page: number;
};
