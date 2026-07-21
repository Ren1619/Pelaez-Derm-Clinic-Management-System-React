export type DashboardWelcome = {
    name: string;
    branch_name: string | null;
    business_name: string;
    banner_image_url: string | null;
};

export type DashboardFilters = {
    month: string;
    date: string;
    branch_ID: number | null;
    can_view_all_branches: boolean;
};

export type DashboardCalendarDay = {
    date: string;
    day: number;
    is_current_month: boolean;
    is_today: boolean;
    appointment_count: number;
};

export type DashboardCalendar = {
    month_name: string;
    year: number;
    days: DashboardCalendarDay[];
};

export type DashboardAppointment = {
    appointment_ID: number;
    PID: number;
    patient_name: string;
    time: string;
    status: 'today' | 'upcoming';
    branch_name: string;
};
