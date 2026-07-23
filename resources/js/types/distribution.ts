export type DistributionStatus =
    'pending' | 'in_transit' | 'delivered' | 'cancelled';

export type DistributionBranch = {
    branch_ID: number;
    branch_name: string;
};

export type DistributionItem = {
    distribution_item_ID: number;
    product_name: string;
    category_name: string;
    measurement_unit: string;
    quantity: number;
    price: string;
    expiration_date: string | null;
};

import type { NewRecordTracked } from './new-record';

export type Distribution = NewRecordTracked & {
    distribution_ID: number;
    status: DistributionStatus;
    from_branch: DistributionBranch;
    to_branch: DistributionBranch;
    created_by: string | null;
    scheduled_date: string | null;
    sent_date: string | null;
    received_date: string | null;
    created_at: string;
    notes: string | null;
    cancellation_reason: string | null;
    total_quantity: number;
    items: DistributionItem[];
    can: {
        send: boolean;
        receive: boolean;
        cancel: boolean;
        delete: boolean;
    };
};

export type DistributionProduct = {
    product_ID: number;
    branch_ID: number;
    name: string;
    category_name: string;
    measurement_unit: string;
    quantity: number;
    price: string;
    expiration_date: string | null;
};

export type DistributionFilters = {
    tab: 'outbound' | 'inbound';
    search: string;
    branch_ID: number | null;
    per_page: number;
};

export type DistributionPaginator = {
    data: Distribution[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: Array<{ url: string | null; label: string; active: boolean }>;
};
