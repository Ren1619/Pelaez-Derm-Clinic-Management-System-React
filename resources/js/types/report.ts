import type { PosBranch, PosSale } from './pos';

export type ReportPeriod =
    'today' | 'this_week' | 'this_month' | 'this_year' | 'all_time';

export type ReportFilters = {
    summary_period: ReportPeriod;
    comparison_period: 'week' | 'month' | 'year';
    branch_ID: number;
    sales_period:
        | 'today'
        | 'week'
        | 'month'
        | 'quarter'
        | 'year'
        | 'all'
        | 'specific_date'
        | 'custom_range';
    specific_date: string | null;
    custom_start_date: string | null;
    custom_end_date: string | null;
    search: string;
    per_page: number;
    anonymize: boolean;
};

export type ReportSeriesPoint = {
    period: string;
    label: string;
    total: number;
    count: number;
};

export type RankedReportItem = {
    rank: number;
    name: string;
    total_qty: number;
    revenue: number;
};

export type ReportAnalytics = {
    summary: {
        totalSales: number;
        totalTransactions: number;
        averageSale: number;
        activeBranches: number;
        growth: Record<
            'totalSales' | 'totalTransactions' | 'averageSale',
            { pct: number; direction: 'up' | 'down' | 'flat' }
        >;
        comparisonLabel: string;
    };
    salesSeries: {
        daily: ReportSeriesPoint[];
        weekly: ReportSeriesPoint[];
        monthly: ReportSeriesPoint[];
        quarterly: ReportSeriesPoint[];
        annual: ReportSeriesPoint[];
    };
    topProducts: RankedReportItem[];
    topServices: RankedReportItem[];
    revenueSplit: {
        products_total: number;
        services_total: number;
        products_pct: number;
        services_pct: number;
        total: number;
    };
    paymentMethods: Array<{
        method: string;
        label: string;
        transactions: number;
        revenue: number;
    }>;
    discounts: {
        total_transactions: number;
        discounted_transactions: number;
        average_discount: number;
        total_discount: number;
        discount_impact_pct: number;
    };
    voidTrend: Array<{
        period: string;
        label: string;
        transactions: number;
        voids: number;
        returns: number;
        rate: number;
    }>;
    peakHours: {
        hours: string[];
        days: Array<{
            day: string;
            cells: Array<{
                hour: number;
                label: string;
                count: number;
                intensity: number;
            }>;
        }>;
        max: number;
    };
    patientRetention: {
        new_count: number;
        returning_count: number;
        new_pct: number;
        returning_pct: number;
        total_unique_patients: number;
    };
    visitFrequency: {
        buckets: Array<{ label: string; count: number }>;
        lapsed_patients: number;
    };
    topPatients: Array<{
        rank: number;
        name: string;
        total_spend: number;
        visit_count: number;
        average_per_visit: number;
        last_visit_date: string;
    }>;
    serviceTrends: Array<{
        service_name: string;
        total_qty: number;
        data: Array<{ label: string; qty: number }>;
    }>;
    topDiagnoses: Array<{ name: string; frequency: number }>;
    reorderSignals: Array<{
        product_name: string;
        branch_ID: number;
        avg_daily_sales: number;
        current_stock: number;
        runway_days: number | null;
        urgency: 'critical' | 'warning' | 'ok';
    }>;
    branchComparison: Array<{
        branch_ID: number;
        label: string;
        total: number;
        count: number;
        average: number;
    }>;
};

export type ReportSalePaginator = {
    data: PosSale[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

export type BranchSalesReport = {
    stats: {
        total_sales: number;
        record_count: number;
        subtotal_amount: number;
        discount_amount: number;
        gross_sales: number;
        voided_amount: number;
        returned_amount: number;
        total_transactions: number;
        average_sale: number;
        top_day_sales: number;
        top_day_date: string | null;
    };
    sales: ReportSalePaginator;
};

export type ReportBranch = PosBranch;
