import type { NewRecordTracked } from './new-record';

export type StaffBranchOption = {
    branch_ID: number;
    branch_name: string;
};

export type AccountRole = {
    role_ID: number;
    role_name: string;
};

export type StaffAccount = NewRecordTracked & {
    account_ID: number;
    branch_ID: number | null;
    role_ID: number;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    full_name: string;
    contact_number: string;
    email: string;
    email_verified_at: string | null;
    is_active: boolean;
    created_at: string | null;
    branch: StaffBranchOption | null;
    role: AccountRole;
};

export type StaffFilters = {
    search: string;
    branch_ID: number | null;
    role_ID: number | null;
    verification: 'verified' | 'unverified' | null;
    status: 'active' | 'inactive' | null;
    per_page: number;
};

export type StaffPaginator = {
    data: StaffAccount[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
};

export type StaffSummary = {
    total: number;
    active: number;
    unverified: number;
};

export type StaffDialogMode = 'create' | 'edit' | 'view';
