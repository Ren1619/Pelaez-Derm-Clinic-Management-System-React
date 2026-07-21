export type ServiceCategoryOption = {
    category_ID: number;
    category_name: string;
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
