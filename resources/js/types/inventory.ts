export type InventoryStatus =
    'in-stock' | 'low-stock' | 'out-of-stock' | 'expiring' | 'expired';

export type InventoryView = 'grouped' | 'detailed';

export type InventoryCategoryOption = {
    category_ID: number;
    category_name: string;
};

export type InventoryBranchOption = {
    branch_ID: number;
    branch_name: string;
};

export type ProductBatch = {
    product_ID: number;
    category_ID: number;
    branch_ID: number;
    name: string;
    measurement_unit: string;
    price: string;
    quantity: number;
    expiration_date: string | null;
    days_until_expiration: number | null;
    expiration_status: 'expired' | 'expiring-soon' | null;
    product_img: string | null;
    image_url: string | null;
    batch_number: number | null;
    is_primary: boolean;
    can_restock: boolean;
    category: InventoryCategoryOption;
    branch: InventoryBranchOption;
    created_at: string | null;
};

export type ProductGroup = {
    key: string;
    name: string;
    branch_ID: number;
    category_ID: number;
    measurement_unit: string;
    price: string;
    product_img: string | null;
    image_url: string | null;
    batch_count: number;
    total_quantity: number;
    primary_expiration_date: string | null;
    category: InventoryCategoryOption;
    branch: InventoryBranchOption;
    can_restock: boolean;
    primary_batch: ProductBatch;
    batches: ProductBatch[];
};

export type InventoryPaginator = {
    data: Array<ProductBatch | ProductGroup>;
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
};

export type InventoryFilters = {
    status: InventoryStatus;
    view: InventoryView;
    search: string;
    branch_ID: number | null;
    per_page: number;
};

export type InventoryStatistics = {
    total: number;
    in_stock: number;
    low_stock: number;
    out_of_stock: number;
    expiring: number;
    expired: number;
};

export type ProductDialogMode = 'create' | 'edit' | 'view' | 'restock';

export function isProductGroup(
    item: ProductBatch | ProductGroup,
): item is ProductGroup {
    return 'batches' in item;
}
