export type PosBranch = { branch_ID: number; branch_name: string };

import type { NewRecordTracked } from './new-record';

export type PosProduct = {
    product_ID: number;
    name: string;
    category: string | null;
    measurement_unit: string;
    price: string;
    quantity: number;
    status: 'in stock' | 'low stock';
    expiration_date: string | null;
    image_url: string | null;
};

export type PosService = {
    service_ID: number;
    name: string;
    description: string | null;
    category: string | null;
    image_url: string | null;
};

export type PosPatient = {
    PID: number;
    full_name: string;
    contact_number: string;
};

export type PosSaleItem = {
    item_ID: number;
    type: 'product' | 'service';
    name: string;
    measurement_unit: string | null;
    quantity: number;
    returned_quantity: number;
    returnable_quantity: number;
    price: string;
    subtotal: string;
};

export type PosSaleReturn = {
    return_ID: number;
    return_type: 'full' | 'partial';
    return_amount: string;
    return_reason: string;
    refund_method: string;
    processed_by: string;
    notes: string | null;
    created_at: string;
};

export type PosSale = NewRecordTracked & {
    sale_ID: number;
    invoice_number: string;
    branch_ID: number | null;
    branch_name: string;
    PID: number | null;
    customer_name: string;
    date: string;
    created_at: string;
    processed_by: string;
    subtotal_cost: string;
    discount_perc: string;
    discount_amount: string;
    total_cost: string;
    pay_method: 'cash' | 'card' | 'ewallet';
    amount_received: string | null;
    change_amount: string | null;
    total_items: number;
    is_voided: boolean;
    void_reason: string | null;
    voided_at: string | null;
    voided_by: string | null;
    total_returned: string;
    net_total: string;
    items: PosSaleItem[];
    returns: PosSaleReturn[];
    can_return: boolean;
    can_void: boolean;
};

export type PosExpenseCategory = { category_ID: number; category_name: string };

export type PosExpense = NewRecordTracked & {
    expense_ID: number;
    description: string;
    amount: string;
    category: string;
    branch: string;
    created_by: string;
    expense_date: string;
    created_at: string;
};

export type PosFilters = {
    branch_ID: number;
    sales_date: string;
    expense_month: number;
    expense_year: number;
};

export type ProductCartItem = {
    key: string;
    type: 'product';
    id: number;
    name: string;
    price: number;
    quantity: number;
    available: number;
};

export type ServiceCartItem = {
    key: string;
    type: 'service';
    id: number;
    name: string;
    price: number;
    quantity: number;
};

export type PosCartItem = ProductCartItem | ServiceCartItem;
