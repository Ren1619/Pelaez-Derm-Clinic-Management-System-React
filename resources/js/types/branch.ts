export type Branch = {
    branch_ID: number;
    branch_name: string;
    branch_location: string;
    contact_number: string;
    map_link: string;
    fb_link: string | null;
    branch_img: string | null;
    image_url: string | null;
    created_at: string | null;
};

export type BranchFilters = {
    search: string;
    per_page: number;
};

export type BranchPaginator = {
    data: Branch[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
};

export type BranchDialogMode = 'create' | 'edit' | 'view';
