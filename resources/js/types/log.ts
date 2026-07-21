export type ActivityLogAction =
    'created' | 'viewed' | 'updated' | 'deleted' | 'restored';

export type ActivityLogActorType = 'staff' | 'patient' | 'system';

export type ActivityLog = {
    activity_log_ID: number;
    actor: {
        type: ActivityLogActorType;
        id: number | null;
        name: string;
        email: string | null;
        role: string | null;
        branch_ID: number | null;
    };
    action: ActivityLogAction;
    context: string;
    subject: {
        type: string;
        id: string | null;
        label: string | null;
    };
    description: string;
    old_values: Record<string, unknown> | null;
    new_values: Record<string, unknown> | null;
    request: {
        method: string | null;
        route: string | null;
        url: string | null;
        ip_address: string | null;
        user_agent: string | null;
    };
    created_at: string;
};

export type ActivityLogFilters = {
    search: string;
    context: string;
    action: 'all' | ActivityLogAction;
    actor_type: 'all' | ActivityLogActorType;
    time_period:
        | 'all_time'
        | 'today'
        | 'yesterday'
        | 'this_week'
        | 'this_month'
        | 'last_3_months'
        | 'last_year'
        | 'custom';
    date_from: string | null;
    date_to: string | null;
    per_page: number;
};

export type ActivityLogPaginator = {
    data: ActivityLog[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
};
