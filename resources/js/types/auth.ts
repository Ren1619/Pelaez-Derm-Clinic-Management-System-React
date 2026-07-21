export type User = {
    id: number;
    name: string;
    first_name?: string;
    middle_name?: string | null;
    last_name?: string;
    contact_number?: string;
    email: string;
    avatar?: string;
    role: {
        id?: number;
        name: 'super_admin' | 'admin' | 'staff' | 'doctor' | null;
        label: string | null;
    };
    branch: { id: number; name: string } | null;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User | null;
    permissions: {
        modules: Array<
            | 'dashboard'
            | 'branches'
            | 'staff'
            | 'patients'
            | 'appointments'
            | 'feedback'
            | 'categories'
            | 'services'
            | 'inventory'
            | 'distribution'
            | 'reports'
            | 'point_of_sale'
            | 'logs'
            | 'system_settings'
        >;
        can_view_all_branches: boolean;
    };
};

/* @chisel-passkeys */
export type Passkey = {
    id: number;
    name: string;
    authenticator: string | null;
    created_at_diff: string;
    last_used_at_diff: string | null;
};
/* @end-chisel-passkeys */
