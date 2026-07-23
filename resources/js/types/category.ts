export type CategoryType = 'Product' | 'Service';

import type { NewRecordTracked } from './new-record';

export type Category = NewRecordTracked & {
    category_ID: number;
    category_name: string;
    category_type: CategoryType;
    description: string;
    created_at: string | null;
};

export type CategoryFilters = {
    tab: 'products' | 'services';
    search: string;
    per_page: number;
};

export type CategoryPaginator = {
    data: Category[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
};

export type CategorySummary = {
    products: number;
    services: number;
};
