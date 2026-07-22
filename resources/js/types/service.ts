import type { MajorServiceCategory } from './category';

export type ServiceCategoryOption = {
    category_ID: number;
    category_name: string;
    major_service_category: Pick<
        MajorServiceCategory,
        'major_service_category_ID' | 'name'
    >;
};

export type ClinicService = {
    service_ID: number;
    category_ID: number;
    name: string;
    description: string;
    service_img: string | null;
    image_url: string | null;
    category: ServiceCategoryOption;
    created_at: string | null;
};

export type ServiceFilters = {
    search: string;
    per_page: number;
};

export type ServicePaginator = {
    data: ClinicService[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
};

export type ServiceDialogMode = 'create' | 'edit' | 'view';
