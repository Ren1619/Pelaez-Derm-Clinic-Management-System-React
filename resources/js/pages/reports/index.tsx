import { Head, router } from '@inertiajs/react';
import {
    Activity,
    BarChart3,
    Building2,
    CalendarRange,
    Download,
    Printer,
    Search,
    WalletCards,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { ClickableTableRow } from '@/components/clickable-table-row';
import { DataTableEmptyState } from '@/components/data-table-empty-state';
import { DataTableLayout } from '@/components/data-table-layout';
import { DataTablePagination } from '@/components/data-table-pagination';
import Heading from '@/components/heading';
import { TooltipIconButton } from '@/components/tooltip-icon-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { exportMethod, index } from '@/routes/reports';
import {
    branchSales as branchSalesPrint,
    sales as salesPrint,
} from '@/routes/reports/print';
import type {
    BranchSalesReport,
    PosSale,
    RankedReportItem,
    ReportAnalytics,
    ReportBranch,
    ReportFilters,
    ReportSeriesPoint,
    StatisticKey,
    StatisticPeriodSelection,
} from '@/types';
import { SaleDetailsDialog } from '../pos/components/sale-details-dialog';

type ReportsIndexProps = {
    analytics: ReportAnalytics;
    branchSales: BranchSalesReport;
    branches: ReportBranch[];
    currentBranch: ReportBranch;
    filters: ReportFilters;
    canViewAllBranches: boolean;
};

const currency = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
});
const compactCurrency = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    notation: 'compact',
    maximumFractionDigits: 1,
});
const number = new Intl.NumberFormat('en-PH');
const statisticPeriodOptions: Array<{
    value: StatisticPeriodSelection['period'];
    label: string;
}> = [
    { value: 'month', label: 'Specific month' },
    { value: 'quarter', label: 'Quarterly' },
    { value: 'biannual', label: 'Bi-annual' },
    { value: 'annual', label: 'Annual' },
];
const monthOptions = Array.from({ length: 12 }, (_, index) => ({
    value: index + 1,
    label: new Intl.DateTimeFormat('en-PH', { month: 'short' }).format(
        new Date(2020, index, 1),
    ),
}));
const yearOptions = Array.from(
    { length: 12 },
    (_, index) => new Date().getFullYear() - index,
);

export default function ReportsIndex({
    analytics,
    branchSales,
    branches,
    currentBranch,
    filters,
    canViewAllBranches,
}: ReportsIndexProps) {
    const [search, setSearch] = useState(filters.search);
    const [selectedSale, setSelectedSale] = useState<PosSale | null>(null);

    const visit = (
        changes: Partial<ReportFilters>,
        only?: Array<'analytics' | 'branchSales' | 'filters' | 'currentBranch'>,
    ) => {
        const next = { ...filters, ...changes };
        router.get(index.url(), reportQuery(next), {
            only,
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };
    const changeStatisticPeriod = (
        statistic: StatisticKey,
        selection: StatisticPeriodSelection,
    ) =>
        visit(
            {
                statistic_periods: {
                    ...filters.statistic_periods,
                    [statistic]: selection,
                },
            },
            ['analytics', 'filters'],
        );

    useEffect(() => {
        if (search === filters.search) {
            return;
        }

        const timeout = window.setTimeout(() => {
            const next = { ...filters, search };
            router.get(index.url(), reportQuery(next), {
                only: ['branchSales', 'filters'],
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 350);

        return () => window.clearTimeout(timeout);
    }, [filters, search]);

    const exportUrl = exportMethod({
        query: reportQuery(filters),
    }).url;
    const branchSalesPrintUrl = branchSalesPrint({
        query: reportQuery(filters),
    }).url;
    const overviewPrintQuery = canViewAllBranches
        ? undefined
        : { branch_ID: filters.branch_ID };
    const statisticActions = (statistic: StatisticKey, printTarget: string) => (
        <StatisticCardActions
            printTarget={printTarget}
            selection={filters.statistic_periods[statistic]}
            resolvedLabel={analytics.statisticPeriods[statistic].label}
            onChange={(selection) =>
                changeStatisticPeriod(statistic, selection)
            }
        />
    );
    const overviewActions = (printTarget: string) => (
        <AllTimeStatisticActions printTarget={printTarget} />
    );

    return (
        <>
            <Head title="Reports" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-4 md:p-6 print:p-0">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between print:hidden">
                    <Heading
                        title="Reports"
                        description="Sales performance, patient activity, clinical trends, and branch operations."
                    />
                    <Button variant="outline" onClick={() => window.print()}>
                        <Printer /> Print report
                    </Button>
                </div>

                <section className="grid gap-4">
                    <SectionHeading title="Overview" />

                    <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                        <MetricCard
                            label="Total sales"
                            value={currency.format(
                                analytics.summary.totalSales,
                            )}
                            icon={BarChart3}
                            printTarget="total-sales"
                            actions={overviewActions('total-sales')}
                        />
                        <MetricCard
                            label="Transactions"
                            value={number.format(
                                analytics.summary.totalTransactions,
                            )}
                            icon={WalletCards}
                            printTarget="transactions"
                            actions={overviewActions('transactions')}
                        />
                        <MetricCard
                            label={
                                canViewAllBranches
                                    ? 'Active branches'
                                    : 'Current branch'
                            }
                            value={
                                canViewAllBranches
                                    ? number.format(
                                          analytics.summary.activeBranches,
                                      )
                                    : currentBranch.branch_name
                            }
                            icon={Building2}
                            printTarget="active-branches"
                            actions={overviewActions('active-branches')}
                        />
                        <MetricCard
                            label="Average sale"
                            value={currency.format(
                                analytics.summary.averageSale,
                            )}
                            icon={Activity}
                            printTarget="average-sale"
                            actions={overviewActions('average-sale')}
                        />
                    </div>
                </section>

                <section className="grid gap-4">
                    <SectionHeading
                        title={
                            canViewAllBranches
                                ? 'Overall Sales Reports'
                                : `${currentBranch.branch_name} Sales Reports`
                        }
                    />
                    <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                        <SeriesCard
                            title="Daily Report"
                            series={analytics.salesSeries.daily}
                            printUrl={
                                salesPrint(
                                    { reportPeriod: 'daily' },
                                    { query: overviewPrintQuery },
                                ).url
                            }
                        />
                        <SeriesCard
                            title="Weekly Report"
                            series={analytics.salesSeries.weekly}
                            printUrl={
                                salesPrint(
                                    { reportPeriod: 'weekly' },
                                    { query: overviewPrintQuery },
                                ).url
                            }
                        />
                        <SeriesCard
                            title="Monthly Report"
                            series={analytics.salesSeries.monthly}
                            printUrl={
                                salesPrint(
                                    { reportPeriod: 'monthly' },
                                    { query: overviewPrintQuery },
                                ).url
                            }
                        />
                        <SeriesCard
                            title="Quarterly Report"
                            series={analytics.salesSeries.quarterly}
                            printUrl={
                                salesPrint(
                                    { reportPeriod: 'quarterly' },
                                    { query: overviewPrintQuery },
                                ).url
                            }
                        />
                        <SeriesCard
                            title="Annual Report"
                            series={analytics.salesSeries.annual}
                            className="lg:col-span-2 2xl:col-span-2"
                            printUrl={
                                salesPrint(
                                    { reportPeriod: 'annual' },
                                    { query: overviewPrintQuery },
                                ).url
                            }
                        />
                    </div>
                </section>

                <section className="grid gap-4">
                    <SectionHeading title="Revenue Intelligence" />

                    <div className="grid gap-4 2xl:grid-cols-2">
                        <RankingCard
                            title="Top Products"
                            subtitle="Revenue ranked"
                            items={analytics.topProducts}
                            printTarget="top-products"
                            actions={statisticActions(
                                'topProducts',
                                'top-products',
                            )}
                        />
                        <RankingCard
                            title="Top Services"
                            subtitle="Revenue ranked"
                            items={analytics.topServices}
                            printTarget="top-services"
                            actions={statisticActions(
                                'topServices',
                                'top-services',
                            )}
                        />
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                        <Card
                            className="h-full"
                            data-statistic-card="revenue-split"
                            data-statistic-title="Product vs Service Revenue"
                        >
                            <CardHeader className="grid gap-3">
                                <CardTitle>
                                    Product vs Service Revenue
                                </CardTitle>
                                {statisticActions(
                                    'revenueSplit',
                                    'revenue-split',
                                )}
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                <SplitBar
                                    first={analytics.revenueSplit.products_pct}
                                    second={analytics.revenueSplit.services_pct}
                                />
                                <KeyValue
                                    label={`Products (${analytics.revenueSplit.products_pct}%)`}
                                    value={currency.format(
                                        analytics.revenueSplit.products_total,
                                    )}
                                />
                                <KeyValue
                                    label={`Services (${analytics.revenueSplit.services_pct}%)`}
                                    value={currency.format(
                                        analytics.revenueSplit.services_total,
                                    )}
                                />
                            </CardContent>
                        </Card>

                        <Card
                            className="h-full"
                            data-statistic-card="payment-methods"
                            data-statistic-title="Payment Methods"
                        >
                            <CardHeader className="grid gap-3">
                                <CardTitle>Payment Methods</CardTitle>
                                {statisticActions(
                                    'paymentMethods',
                                    'payment-methods',
                                )}
                            </CardHeader>
                            <CardContent className="grid gap-3">
                                {analytics.paymentMethods.map((method) => (
                                    <div
                                        key={method.method}
                                        className="grid gap-1 border-b pb-2 last:border-0"
                                    >
                                        <KeyValue
                                            label={method.label}
                                            value={currency.format(
                                                method.revenue,
                                            )}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            {number.format(method.transactions)}{' '}
                                            transactions
                                        </p>
                                    </div>
                                ))}
                                <Empty
                                    show={analytics.paymentMethods.length === 0}
                                />
                            </CardContent>
                        </Card>

                        <Card
                            className="h-full lg:col-span-2 2xl:col-span-1"
                            data-statistic-card="discounts"
                            data-statistic-title="Discount Analytics"
                        >
                            <CardHeader className="grid gap-3">
                                <CardTitle>Discount Analytics</CardTitle>
                                {statisticActions('discounts', 'discounts')}
                            </CardHeader>
                            <CardContent className="grid gap-3">
                                <KeyValue
                                    label="Discounted transactions"
                                    value={`${number.format(analytics.discounts.discounted_transactions)} / ${number.format(analytics.discounts.total_transactions)}`}
                                />
                                <KeyValue
                                    label="Average discount"
                                    value={`${analytics.discounts.average_discount.toFixed(1)}%`}
                                />
                                <KeyValue
                                    label="Total discounts"
                                    value={currency.format(
                                        analytics.discounts.total_discount,
                                    )}
                                />
                                <KeyValue
                                    label="Revenue impact"
                                    value={`${analytics.discounts.discount_impact_pct.toFixed(1)}%`}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 2xl:grid-cols-2">
                        <VoidTrendCard
                            data={analytics.voidTrend.slice(-7)}
                            actions={statisticActions(
                                'voidTrend',
                                'void-trend',
                            )}
                        />
                        <PeakHoursCard
                            data={analytics.peakHours}
                            actions={statisticActions(
                                'peakHours',
                                'peak-hours',
                            )}
                        />
                    </div>
                </section>

                <section className="grid gap-4">
                    <SectionHeading title="Patient Analytics" />
                    <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                        <Card
                            className="h-full"
                            data-statistic-card="patient-retention"
                            data-statistic-title="New vs Returning Patients"
                        >
                            <CardHeader className="grid gap-3">
                                <CardTitle>New vs Returning Patients</CardTitle>
                                {statisticActions(
                                    'patientRetention',
                                    'patient-retention',
                                )}
                            </CardHeader>
                            <CardContent className="grid gap-4">
                                <SplitBar
                                    first={analytics.patientRetention.new_pct}
                                    second={
                                        analytics.patientRetention.returning_pct
                                    }
                                />
                                <KeyValue
                                    label={`New (${analytics.patientRetention.new_pct}%)`}
                                    value={number.format(
                                        analytics.patientRetention.new_count,
                                    )}
                                />
                                <KeyValue
                                    label={`Returning (${analytics.patientRetention.returning_pct}%)`}
                                    value={number.format(
                                        analytics.patientRetention
                                            .returning_count,
                                    )}
                                />
                                <KeyValue
                                    label="Unique patients"
                                    value={number.format(
                                        analytics.patientRetention
                                            .total_unique_patients,
                                    )}
                                />
                            </CardContent>
                        </Card>

                        <ProgressListCard
                            title="Visit Frequency"
                            subtitle={`${number.format(analytics.visitFrequency.lapsed_patients)} lapsed`}
                            items={analytics.visitFrequency.buckets.map(
                                (bucket) => ({
                                    label: bucket.label,
                                    value: bucket.count,
                                }),
                            )}
                            printTarget="visit-frequency"
                            actions={statisticActions(
                                'visitFrequency',
                                'visit-frequency',
                            )}
                        />

                        <Card
                            className="h-full lg:col-span-2 2xl:col-span-1"
                            data-statistic-card="top-patients"
                            data-statistic-title="Top Patients by Lifetime Value"
                        >
                            <CardHeader className="grid gap-3">
                                <div className="flex items-center justify-between gap-3">
                                    <CardTitle>
                                        Top Patients by Lifetime Value
                                    </CardTitle>
                                    <label className="flex items-center gap-2 text-xs print:hidden">
                                        <Checkbox
                                            checked={filters.anonymize}
                                            onCheckedChange={(checked) =>
                                                visit(
                                                    {
                                                        anonymize:
                                                            checked === true,
                                                    },
                                                    ['analytics', 'filters'],
                                                )
                                            }
                                        />
                                        Privacy
                                    </label>
                                </div>
                                {statisticActions(
                                    'topPatients',
                                    'top-patients',
                                )}
                            </CardHeader>
                            <CardContent className="grid max-h-72 gap-3 overflow-y-auto">
                                {analytics.topPatients.map((patient) => (
                                    <div
                                        key={patient.rank}
                                        className="flex justify-between gap-3 border-b pb-2"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">
                                                #{patient.rank} {patient.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {patient.visit_count} visits ·
                                                avg{' '}
                                                {currency.format(
                                                    patient.average_per_visit,
                                                )}
                                            </p>
                                        </div>
                                        <p className="text-sm font-medium">
                                            {currency.format(
                                                patient.total_spend,
                                            )}
                                        </p>
                                    </div>
                                ))}
                                <Empty
                                    show={analytics.topPatients.length === 0}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </section>

                <section className="grid gap-4">
                    <SectionHeading title="Clinical Intelligence" />
                    <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                        <ServiceTrendsCard
                            data={analytics.serviceTrends}
                            actions={statisticActions(
                                'serviceTrends',
                                'service-trends',
                            )}
                        />
                        <ProgressListCard
                            title="Diagnosis Frequency"
                            items={analytics.topDiagnoses.map((diagnosis) => ({
                                label: diagnosis.name,
                                value: diagnosis.frequency,
                            }))}
                            printTarget="diagnosis-frequency"
                            actions={statisticActions(
                                'topDiagnoses',
                                'diagnosis-frequency',
                            )}
                        />
                        <ReorderSignalsCard
                            data={analytics.reorderSignals}
                            actions={statisticActions(
                                'reorderSignals',
                                'reorder-signals',
                            )}
                        />
                    </div>
                </section>

                {canViewAllBranches && (
                    <section className="grid gap-4">
                        <SectionHeading title="Branch Analytics" />

                        <div className="grid gap-4 2xl:grid-cols-2">
                            <Card
                                className="h-full"
                                data-statistic-card="branch-comparison"
                                data-statistic-title="Branch Comparison"
                            >
                                <CardHeader className="grid gap-3">
                                    <CardTitle>Branch Comparison</CardTitle>
                                    {statisticActions(
                                        'branchComparison',
                                        'branch-comparison',
                                    )}
                                </CardHeader>
                                <CardContent>
                                    <BranchComparison
                                        data={analytics.branchComparison}
                                    />
                                </CardContent>
                            </Card>

                            <ParentCategoryUtilizationCard
                                data={analytics.parentCategoryUtilization}
                                actions={statisticActions(
                                    'parentCategoryUtilization',
                                    'parent-category-utilization',
                                )}
                            />
                        </div>
                    </section>
                )}

                <section className="grid gap-4 print:break-before-page">
                    <SectionHeading
                        title={
                            canViewAllBranches
                                ? 'Branch Sales'
                                : `${currentBranch.branch_name} Branch Sales Details`
                        }
                    >
                        <div className="flex flex-wrap gap-2 print:hidden">
                            <Button variant="outline" asChild>
                                <a
                                    href={branchSalesPrintUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <Printer /> Print / Save PDF
                                </a>
                            </Button>
                            <Button variant="outline" asChild>
                                <a href={exportUrl}>
                                    <Download /> Export CSV
                                </a>
                            </Button>
                        </div>
                    </SectionHeading>

                    <BranchSalesFilters
                        filters={filters}
                        branches={branches}
                        canViewAllBranches={canViewAllBranches}
                        search={search}
                        onSearch={setSearch}
                        onChange={(changes) =>
                            visit(changes, [
                                'branchSales',
                                'filters',
                                'currentBranch',
                            ])
                        }
                    />

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <SimpleMetric
                            label="Net sales"
                            value={currency.format(
                                branchSales.stats.total_sales,
                            )}
                        />
                        <SimpleMetric
                            label="Transactions"
                            value={number.format(
                                branchSales.stats.total_transactions,
                            )}
                        />
                        <SimpleMetric
                            label="Average sale"
                            value={currency.format(
                                branchSales.stats.average_sale,
                            )}
                        />
                        <SimpleMetric
                            label="Best day"
                            value={currency.format(
                                branchSales.stats.top_day_sales,
                            )}
                            note={branchSales.stats.top_day_date}
                        />
                    </div>

                    <SalesLedger
                        report={branchSales}
                        filters={filters}
                        onChange={visit}
                        onSelect={setSelectedSale}
                    />
                </section>
            </div>

            <SaleDetailsDialog
                sale={selectedSale}
                open={selectedSale !== null}
                onOpenChange={(open) => !open && setSelectedSale(null)}
            />
        </>
    );
}

function reportQuery(filters: ReportFilters) {
    return {
        statistic_periods: filters.statistic_periods,
        branch_ID: filters.branch_ID,
        sales_period: filters.sales_period,
        specific_date: filters.specific_date ?? undefined,
        custom_start_date: filters.custom_start_date ?? undefined,
        custom_end_date: filters.custom_end_date ?? undefined,
        search: filters.search || undefined,
        per_page: filters.per_page,
        anonymize: filters.anonymize ? 1 : 0,
    };
}

function SectionHeading({
    title,
    children,
}: {
    title: string;
    children?: React.ReactNode;
}) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">{title}</h2>
            {children}
        </div>
    );
}

function StatisticCardActions({
    printTarget,
    selection,
    resolvedLabel,
    onChange,
}: {
    printTarget: string;
    selection: StatisticPeriodSelection;
    resolvedLabel: string;
    onChange: (selection: StatisticPeriodSelection) => void;
}) {
    const periodLabel =
        statisticPeriodOptions.find(
            (option) => option.value === selection.period,
        )?.label ?? 'Period';

    return (
        <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
            <Badge
                variant="secondary"
                className="max-w-full truncate font-normal"
                title={resolvedLabel}
            >
                {resolvedLabel}
            </Badge>

            <div className="flex shrink-0 items-center gap-1">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5"
                        >
                            <CalendarRange className="size-3.5" />
                            {periodLabel}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-72">
                        <div className="grid gap-4">
                            <div className="grid gap-1">
                                <p className="text-sm font-medium">
                                    Statistic period
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Choose the range used by this card.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-1.5">
                                    <Label>Month</Label>
                                    <Select
                                        value={String(selection.month)}
                                        onValueChange={(value) =>
                                            onChange({
                                                ...selection,
                                                month: Number(value),
                                            })
                                        }
                                    >
                                        <SelectTrigger
                                            className="w-full"
                                            aria-label="Statistic month"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {monthOptions.map((month) => (
                                                <SelectItem
                                                    key={month.value}
                                                    value={String(month.value)}
                                                >
                                                    {month.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-1.5">
                                    <Label>Year</Label>
                                    <Select
                                        value={
                                            selection.year === null
                                                ? 'auto'
                                                : String(selection.year)
                                        }
                                        onValueChange={(value) =>
                                            onChange({
                                                ...selection,
                                                year:
                                                    value === 'auto'
                                                        ? null
                                                        : Number(value),
                                            })
                                        }
                                    >
                                        <SelectTrigger
                                            className="w-full"
                                            aria-label="Statistic year"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="auto">
                                                Auto year
                                            </SelectItem>
                                            {yearOptions.map((year) => (
                                                <SelectItem
                                                    key={year}
                                                    value={String(year)}
                                                >
                                                    {year}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="col-span-2 grid gap-1.5">
                                    <Label>Range</Label>
                                    <Select
                                        value={selection.period}
                                        onValueChange={(value) =>
                                            onChange({
                                                ...selection,
                                                period: value as StatisticPeriodSelection['period'],
                                            })
                                        }
                                    >
                                        <SelectTrigger
                                            className="w-full"
                                            aria-label="Statistic period"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {statisticPeriodOptions.map(
                                                (option) => (
                                                    <SelectItem
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                                Showing {resolvedLabel}
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                <TooltipIconButton
                    variant="outline"
                    size="icon"
                    className="size-8"
                    tooltip={`Print / Save PDF for ${resolvedLabel}`}
                    aria-label={`Print or save PDF for ${resolvedLabel}`}
                    onClick={() =>
                        printStatisticCard(printTarget, resolvedLabel)
                    }
                >
                    <Printer />
                </TooltipIconButton>
            </div>
        </div>
    );
}

function AllTimeStatisticActions({ printTarget }: { printTarget: string }) {
    return (
        <div className="flex items-center justify-between gap-2 print:hidden">
            <Badge variant="secondary" className="font-normal">
                All time
            </Badge>
            <TooltipIconButton
                variant="outline"
                size="icon"
                className="size-8"
                tooltip="Print / Save PDF for all-time data"
                aria-label="Print or save PDF for all-time data"
                onClick={() => printStatisticCard(printTarget, 'All time')}
            >
                <Printer />
            </TooltipIconButton>
        </div>
    );
}

function printStatisticCard(printTarget: string, resolvedLabel: string) {
    const source = document.querySelector<HTMLElement>(
        `[data-statistic-card="${printTarget}"]`,
    );

    if (source === null) {
        return;
    }

    const printRoot = document.createElement('main');
    const heading = document.createElement('header');
    const title = document.createElement('h1');
    const period = document.createElement('p');
    printRoot.className = 'statistic-print-root';
    heading.className = 'statistic-print-heading';
    title.textContent = source.dataset.statisticTitle ?? 'Report statistic';
    period.textContent = resolvedLabel;
    heading.append(title, period);
    printRoot.append(heading);
    printRoot.append(source.cloneNode(true));
    document.body.append(printRoot);
    document.body.classList.add('printing-statistic');

    const cleanup = () => {
        document.body.classList.remove('printing-statistic');
        printRoot.remove();
    };

    window.addEventListener('afterprint', cleanup, { once: true });
    window.print();
    window.setTimeout(cleanup, 1000);
}

function MetricCard({
    label,
    value,
    icon: Icon,
    actions,
    printTarget,
}: {
    label: string;
    value: string;
    icon: React.ComponentType<{ className?: string }>;
    actions?: React.ReactNode;
    printTarget: string;
}) {
    return (
        <Card
            className="h-full"
            data-statistic-card={printTarget}
            data-statistic-title={label}
        >
            <CardContent className="grid gap-3 p-5">
                <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <Icon className="size-5 text-muted-foreground" />
                </div>
                <p className="truncate text-xl font-semibold">{value}</p>
                {actions}
            </CardContent>
        </Card>
    );
}

function SeriesCard({
    title,
    series,
    printUrl,
    className,
}: {
    title: string;
    series: ReportSeriesPoint[];
    printUrl: string;
    className?: string;
}) {
    const maximum = Math.max(...series.map((point) => point.total), 1);

    return (
        <Card className={className}>
            <CardHeader className="flex-row items-center justify-between gap-3">
                <CardTitle>{title}</CardTitle>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                        {currency.format(
                            series.reduce((sum, point) => sum + point.total, 0),
                        )}
                    </span>
                    <TooltipIconButton
                        variant="ghost"
                        size="icon"
                        asChild
                        className="print:hidden"
                        tooltip={`Print ${title}`}
                    >
                        <a
                            href={printUrl}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Print ${title}`}
                        >
                            <Printer />
                        </a>
                    </TooltipIconButton>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex h-48 items-end gap-2 border-b">
                    {series.map((point) => (
                        <div
                            key={point.period}
                            className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
                            title={`${point.label}: ${currency.format(point.total)}`}
                        >
                            <div
                                className="w-full rounded-t bg-primary/75"
                                style={{
                                    height: `${Math.max(4, (point.total / maximum) * 150)}px`,
                                }}
                            />
                            <span className="max-w-full truncate text-[10px] text-muted-foreground">
                                {point.label}
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function RankingCard({
    title,
    subtitle,
    items,
    actions,
    printTarget,
}: {
    title: string;
    subtitle: string;
    items: RankedReportItem[];
    actions?: React.ReactNode;
    printTarget: string;
}) {
    const maximum = Math.max(...items.map((item) => item.revenue), 1);

    return (
        <Card
            className="h-full"
            data-statistic-card={printTarget}
            data-statistic-title={title}
        >
            <CardHeader className="grid gap-3">
                <div className="flex items-center justify-between gap-3">
                    <CardTitle>{title}</CardTitle>
                    <span className="text-sm text-muted-foreground">
                        {subtitle}
                    </span>
                </div>
                {actions}
            </CardHeader>
            <CardContent className="grid gap-3">
                {items.map((item) => (
                    <div
                        key={item.name}
                        className="grid grid-cols-[2rem_1fr_auto] items-center gap-3"
                    >
                        <span className="text-sm text-muted-foreground">
                            #{item.rank}
                        </span>
                        <div className="min-w-0">
                            <div className="flex justify-between gap-2 text-sm">
                                <span className="truncate font-medium">
                                    {item.name}
                                </span>
                                <span className="text-muted-foreground">
                                    {number.format(item.total_qty)} sold
                                </span>
                            </div>
                            <div className="mt-1 h-2 overflow-hidden rounded bg-muted">
                                <div
                                    className="h-full rounded bg-primary"
                                    style={{
                                        width: `${(item.revenue / maximum) * 100}%`,
                                    }}
                                />
                            </div>
                        </div>
                        <span className="text-sm font-medium">
                            {currency.format(item.revenue)}
                        </span>
                    </div>
                ))}
                <Empty show={items.length === 0} />
            </CardContent>
        </Card>
    );
}

function SplitBar({ first, second }: { first: number; second: number }) {
    return (
        <div className="flex h-3 overflow-hidden rounded bg-muted">
            <div className="bg-primary" style={{ width: `${first}%` }} />
            <div className="bg-primary/35" style={{ width: `${second}%` }} />
        </div>
    );
}

function KeyValue({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium">{value}</span>
        </div>
    );
}

function VoidTrendCard({
    data,
    actions,
}: {
    data: ReportAnalytics['voidTrend'];
    actions?: React.ReactNode;
}) {
    const maximum = Math.max(...data.map((point) => point.rate), 0);

    return (
        <Card
            className="h-full"
            data-statistic-card="void-trend"
            data-statistic-title="Voids & Returns"
        >
            <CardHeader className="grid gap-3">
                <div className="flex items-center justify-between">
                    <CardTitle>Voids & Returns</CardTitle>
                    <span className="text-sm text-muted-foreground">
                        Last 7 days
                    </span>
                </div>
                {actions}
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col">
                <div className="flex min-h-24 flex-1 items-end gap-2 border-b">
                    {data.map((point) => (
                        <div
                            key={point.period}
                            className="flex h-full min-w-0 flex-1 items-end"
                            title={`${point.voids} voids, ${point.returns} returns`}
                        >
                            <div
                                className="w-full rounded-t bg-destructive/35"
                                style={{
                                    height:
                                        maximum > 0 && point.rate > 0
                                            ? `${Math.max(2, (point.rate / maximum) * 100)}%`
                                            : '3px',
                                }}
                            />
                        </div>
                    ))}
                </div>
                <div className="mt-1 flex gap-2">
                    {data.map((point) => (
                        <div
                            key={point.period}
                            className="min-w-0 flex-1 text-center"
                        >
                            <span className="block truncate text-[10px] text-muted-foreground">
                                {point.label}
                            </span>
                            <span className="block text-[10px] font-medium">
                                {point.rate}%
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function PeakHoursCard({
    data,
    actions,
}: {
    data: ReportAnalytics['peakHours'];
    actions?: React.ReactNode;
}) {
    return (
        <Card
            data-statistic-card="peak-hours"
            data-statistic-title="Traffic Patterns"
        >
            <CardHeader className="grid gap-3">
                <div className="flex items-center justify-between">
                    <CardTitle>Traffic Patterns</CardTitle>
                    <span className="text-sm text-muted-foreground">
                        Peak hours
                    </span>
                </div>
                {actions}
            </CardHeader>
            <CardContent className="overflow-x-auto">
                <div className="grid min-w-[620px] grid-cols-[3rem_repeat(12,minmax(2.5rem,1fr))] gap-1">
                    <div />
                    {data.hours.map((hour) => (
                        <div
                            key={hour}
                            className="text-center text-[10px] text-muted-foreground"
                        >
                            {hour}
                        </div>
                    ))}
                    {data.days.map((day) => (
                        <div key={day.day} className="contents">
                            <div className="flex items-center text-xs text-muted-foreground">
                                {day.day}
                            </div>
                            {day.cells.map((cell) => (
                                <div
                                    key={cell.hour}
                                    className="flex h-8 items-center justify-center rounded bg-primary text-[11px] text-primary-foreground"
                                    style={{
                                        opacity: Math.max(0.08, cell.intensity),
                                    }}
                                    title={`${day.day} ${cell.label}: ${cell.count} transactions`}
                                >
                                    {cell.count || ''}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function ProgressListCard({
    title,
    subtitle,
    items,
    actions,
    printTarget,
}: {
    title: string;
    subtitle?: string;
    items: Array<{ label: string; value: number }>;
    actions?: React.ReactNode;
    printTarget: string;
}) {
    const maximum = Math.max(...items.map((item) => item.value), 1);

    return (
        <Card data-statistic-card={printTarget} data-statistic-title={title}>
            <CardHeader className="grid gap-3">
                <div className="flex items-center justify-between gap-3">
                    <CardTitle>{title}</CardTitle>
                    {subtitle && (
                        <span className="text-sm text-muted-foreground">
                            {subtitle}
                        </span>
                    )}
                </div>
                {actions}
            </CardHeader>
            <CardContent className="grid max-h-80 gap-3 overflow-y-auto">
                {items.map((item) => (
                    <div key={item.label}>
                        <KeyValue
                            label={item.label}
                            value={number.format(item.value)}
                        />
                        <div className="mt-1 h-2 overflow-hidden rounded bg-muted">
                            <div
                                className="h-full rounded bg-primary"
                                style={{
                                    width: `${(item.value / maximum) * 100}%`,
                                }}
                            />
                        </div>
                    </div>
                ))}
                <Empty show={items.length === 0} />
            </CardContent>
        </Card>
    );
}

function ServiceTrendsCard({
    data,
    actions,
}: {
    data: ReportAnalytics['serviceTrends'];
    actions?: React.ReactNode;
}) {
    return (
        <Card
            className="h-full"
            data-statistic-card="service-trends"
            data-statistic-title="Service Trends"
        >
            <CardHeader className="grid gap-3">
                <CardTitle>Service Trends</CardTitle>
                {actions}
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
                {data.map((service) => {
                    const recent = service.data.slice(-14);
                    const maximum = Math.max(
                        ...recent.map((point) => point.qty),
                        1,
                    );

                    return (
                        <div
                            key={service.service_name}
                            className="flex min-h-20 flex-1 flex-col"
                        >
                            <KeyValue
                                label={service.service_name}
                                value={`${number.format(service.total_qty)} sold`}
                            />
                            <div className="mt-3 flex min-h-10 flex-1 items-end gap-1">
                                {recent.map((point) => (
                                    <div
                                        key={point.label}
                                        className="flex-1 rounded-t bg-primary/70"
                                        style={{
                                            height:
                                                point.qty > 0
                                                    ? `${Math.max(2, (point.qty / maximum) * 100)}%`
                                                    : '3px',
                                        }}
                                        title={`${point.label}: ${point.qty}`}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
                <Empty show={data.length === 0} />
            </CardContent>
        </Card>
    );
}

function ReorderSignalsCard({
    data,
    actions,
}: {
    data: ReportAnalytics['reorderSignals'];
    actions?: React.ReactNode;
}) {
    return (
        <Card
            data-statistic-card="reorder-signals"
            data-statistic-title="Product Reorder Signals"
        >
            <CardHeader className="grid gap-3">
                <CardTitle>Product Reorder Signals</CardTitle>
                {actions}
            </CardHeader>
            <CardContent className="grid max-h-80 gap-3 overflow-y-auto">
                {data.map((item) => (
                    <div
                        key={`${item.branch_ID}-${item.product_name}`}
                        className="flex justify-between gap-3 border-b pb-2"
                    >
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                                {item.product_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {item.avg_daily_sales.toFixed(2)} units/day ·
                                stock {item.current_stock}
                            </p>
                        </div>
                        <div className="text-right">
                            <Badge
                                variant={
                                    item.urgency === 'critical'
                                        ? 'destructive'
                                        : 'secondary'
                                }
                            >
                                {item.urgency}
                            </Badge>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {item.runway_days === null
                                    ? 'No recent sales'
                                    : `${item.runway_days} days`}
                            </p>
                        </div>
                    </div>
                ))}
                <Empty show={data.length === 0} />
            </CardContent>
        </Card>
    );
}

function BranchComparison({
    data,
}: {
    data: ReportAnalytics['branchComparison'];
}) {
    const maximum = Math.max(...data.map((branch) => branch.total), 1);
    const { scaleMaximum, ticks } = branchChartScale(maximum);
    const chartWidth = Math.max(640, data.length * 220);
    const barColors = [
        'bg-chart-1',
        'bg-chart-2',
        'bg-chart-3',
        'bg-chart-4',
        'bg-chart-5',
    ];

    if (data.length === 0) {
        return <Empty show />;
    }

    return (
        <div className="overflow-x-auto pb-2">
            <div
                className="grid w-full grid-cols-[4.5rem_1fr]"
                style={{ minWidth: `${chartWidth}px` }}
            >
                <div className="relative h-64">
                    {ticks.map((tick) => (
                        <span
                            key={tick}
                            className="absolute right-3 text-[11px] text-muted-foreground"
                            style={{
                                bottom: `${(tick / scaleMaximum) * 100}%`,
                                transform: 'translateY(50%)',
                            }}
                        >
                            {compactCurrency.format(tick)}
                        </span>
                    ))}
                </div>

                <div className="relative h-64 border-b border-l">
                    {ticks.map((tick) => (
                        <div
                            key={tick}
                            className="absolute inset-x-0 border-t border-border/70"
                            style={{
                                bottom: `${(tick / scaleMaximum) * 100}%`,
                            }}
                        />
                    ))}

                    <div className="absolute inset-0 flex items-end gap-8 px-8">
                        {data.map((branch, index) => (
                            <div
                                key={branch.branch_ID}
                                className="flex h-full min-w-32 flex-1 items-end justify-center"
                            >
                                <div
                                    className={`w-full max-w-2xl rounded-t ${barColors[index % barColors.length]}`}
                                    style={{
                                        height:
                                            branch.total > 0
                                                ? `${Math.max(2, (branch.total / scaleMaximum) * 100)}%`
                                                : '0%',
                                    }}
                                    title={`${branch.label}: ${currency.format(branch.total)} (${number.format(branch.count)} transactions)`}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div />
                <div className="flex gap-8 px-8 pt-3">
                    {data.map((branch) => (
                        <div
                            key={branch.branch_ID}
                            className="min-w-32 flex-1 text-center"
                        >
                            <p className="truncate text-sm font-medium">
                                {branch.label}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {currency.format(branch.total)} ·{' '}
                                {number.format(branch.count)} transactions
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function ParentCategoryUtilizationCard({
    data,
    actions,
}: {
    data: ReportAnalytics['parentCategoryUtilization'];
    actions?: React.ReactNode;
}) {
    const categoryColors = [
        'bg-chart-1',
        'bg-chart-2',
        'bg-chart-3',
        'bg-chart-4',
        'bg-chart-5',
    ];
    const branches = data.branches.map((branch) => ({
        ...branch,
        total: data.categories.reduce(
            (total, category) =>
                total +
                (category.branches.find(
                    (item) => item.branch_ID === branch.branch_ID,
                )?.quantity ?? 0),
            0,
        ),
    }));
    const highestTotal = Math.max(...branches.map((branch) => branch.total), 0);
    const scaleMaximum = Math.max(highestTotal, 1);

    return (
        <Card
            className="h-full"
            data-statistic-card="parent-category-utilization"
            data-statistic-title="Parent Category Service Utilization"
        >
            <CardHeader className="grid gap-3">
                <div className="grid gap-1">
                    <CardTitle>Parent Category Service Utilization</CardTitle>
                    <p className="text-xs text-muted-foreground">
                        Parent category mix per branch during{' '}
                        {data.period_label}.
                    </p>
                </div>
                {actions}
            </CardHeader>
            <CardContent className="grid gap-6">
                {data.categories.length === 0 || data.branches.length === 0 ? (
                    <Empty show />
                ) : (
                    <>
                        <div
                            className="flex flex-wrap gap-x-4 gap-y-2"
                            aria-label="Parent category legend"
                        >
                            {data.categories.map((category, index) => (
                                <div
                                    key={category.parent_category_ID}
                                    className="flex min-w-0 items-center gap-2 text-xs"
                                >
                                    <span
                                        className={`size-2.5 shrink-0 rounded-sm ${categoryColors[index % categoryColors.length]}`}
                                        aria-hidden="true"
                                    />
                                    <span className="max-w-40 truncate font-medium">
                                        {category.label}
                                    </span>
                                    <span className="text-muted-foreground tabular-nums">
                                        {number.format(category.total)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <figure className="grid gap-5">
                            <figcaption className="sr-only">
                                Stacked bar graph of parent category service
                                utilization by branch for {data.period_label}.
                            </figcaption>

                            {branches.map((branch) => (
                                <div
                                    key={branch.branch_ID}
                                    className="grid gap-2"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="truncate text-sm font-medium">
                                            {branch.label}
                                        </span>
                                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                                            {number.format(branch.total)}{' '}
                                            services
                                        </span>
                                    </div>

                                    <div className="relative h-9 overflow-hidden rounded-md bg-muted/70">
                                        <div
                                            className="absolute inset-0 grid grid-cols-4 divide-x divide-border/70"
                                            aria-hidden="true"
                                        >
                                            <span />
                                            <span />
                                            <span />
                                            <span />
                                        </div>

                                        <div className="relative flex h-full">
                                            {data.categories.map(
                                                (category, index) => {
                                                    const quantity =
                                                        category.branches.find(
                                                            (item) =>
                                                                item.branch_ID ===
                                                                branch.branch_ID,
                                                        )?.quantity ?? 0;

                                                    if (quantity === 0) {
                                                        return null;
                                                    }

                                                    return (
                                                        <Tooltip
                                                            key={
                                                                category.parent_category_ID
                                                            }
                                                        >
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <button
                                                                    type="button"
                                                                    className={`h-full min-w-px border-r border-background/40 outline-none last:border-r-0 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring ${categoryColors[index % categoryColors.length]}`}
                                                                    style={{
                                                                        width: `${(quantity / scaleMaximum) * 100}%`,
                                                                    }}
                                                                    aria-label={`${branch.label}, ${category.label}: ${number.format(quantity)} services`}
                                                                />
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                {category.label}
                                                                :{' '}
                                                                {number.format(
                                                                    quantity,
                                                                )}{' '}
                                                                services
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    );
                                                },
                                            )}
                                        </div>
                                    </div>

                                    <p className="sr-only">
                                        {data.categories
                                            .map((category) => {
                                                const quantity =
                                                    category.branches.find(
                                                        (item) =>
                                                            item.branch_ID ===
                                                            branch.branch_ID,
                                                    )?.quantity ?? 0;

                                                return `${category.label}: ${number.format(quantity)}`;
                                            })
                                            .join(', ')}
                                    </p>
                                </div>
                            ))}

                            <div
                                className="flex justify-between border-t pt-2 text-[11px] text-muted-foreground tabular-nums"
                                aria-hidden="true"
                            >
                                <span>0</span>
                                <span>
                                    {number.format(
                                        Math.round(highestTotal / 2),
                                    )}
                                </span>
                                <span>
                                    {number.format(highestTotal)} services
                                </span>
                            </div>
                        </figure>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

function branchChartScale(maximum: number) {
    const roughStep = maximum / 8;
    const magnitude = 10 ** Math.floor(Math.log10(roughStep));
    const normalizedStep = roughStep / magnitude;
    const stepFactor =
        normalizedStep <= 1
            ? 1
            : normalizedStep <= 2
              ? 2
              : normalizedStep <= 5
                ? 5
                : 10;
    const step = stepFactor * magnitude;
    const scaleMaximum = Math.max(step, Math.ceil(maximum / step) * step);
    const tickCount = Math.round(scaleMaximum / step);

    return {
        scaleMaximum,
        ticks: Array.from(
            { length: tickCount + 1 },
            (_, index) => index * step,
        ),
    };
}

function BranchSalesFilters({
    filters,
    branches,
    canViewAllBranches,
    search,
    onSearch,
    onChange,
}: {
    filters: ReportFilters;
    branches: ReportBranch[];
    canViewAllBranches: boolean;
    search: string;
    onSearch: (value: string) => void;
    onChange: (changes: Partial<ReportFilters>) => void;
}) {
    return (
        <Card className="print:hidden">
            <CardContent className="flex flex-wrap items-end gap-3 p-4">
                {canViewAllBranches && (
                    <div className="grid w-full gap-1.5 sm:w-44">
                        <Label htmlFor="branch-sales-branch">Branch</Label>
                        <Select
                            value={filters.branch_ID.toString()}
                            onValueChange={(value) =>
                                onChange({ branch_ID: Number(value) })
                            }
                        >
                            <SelectTrigger
                                id="branch-sales-branch"
                                className="w-full"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {branches.map((branch) => (
                                    <SelectItem
                                        key={branch.branch_ID}
                                        value={branch.branch_ID.toString()}
                                    >
                                        {branch.branch_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                <div className="grid w-full gap-1.5 sm:w-44">
                    <Label htmlFor="branch-sales-period">Time period</Label>
                    <Select
                        value={filters.sales_period}
                        onValueChange={(value) =>
                            onChange({
                                sales_period:
                                    value as ReportFilters['sales_period'],
                            })
                        }
                    >
                        <SelectTrigger
                            id="branch-sales-period"
                            className="w-full"
                        >
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">Daily</SelectItem>
                            <SelectItem value="week">Weekly</SelectItem>
                            <SelectItem value="month">Monthly</SelectItem>
                            <SelectItem value="quarter">Quarterly</SelectItem>
                            <SelectItem value="year">Annually</SelectItem>
                            <SelectItem value="all">All time</SelectItem>
                            <SelectItem value="specific_date">
                                Specific date
                            </SelectItem>
                            <SelectItem value="custom_range">
                                Custom range
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                {filters.sales_period === 'specific_date' && (
                    <div className="grid w-full gap-1.5 sm:w-40">
                        <Label htmlFor="branch-sales-date">Date</Label>
                        <Input
                            id="branch-sales-date"
                            type="date"
                            value={filters.specific_date ?? ''}
                            onChange={(event) =>
                                onChange({ specific_date: event.target.value })
                            }
                        />
                    </div>
                )}
                {filters.sales_period === 'custom_range' && (
                    <>
                        <div className="grid w-full gap-1.5 sm:w-40">
                            <Label htmlFor="branch-sales-start-date">
                                Start date
                            </Label>
                            <Input
                                id="branch-sales-start-date"
                                type="date"
                                value={filters.custom_start_date ?? ''}
                                onChange={(event) =>
                                    onChange({
                                        custom_start_date: event.target.value,
                                    })
                                }
                            />
                        </div>
                        <div className="grid w-full gap-1.5 sm:w-40">
                            <Label htmlFor="branch-sales-end-date">
                                End date
                            </Label>
                            <Input
                                id="branch-sales-end-date"
                                type="date"
                                value={filters.custom_end_date ?? ''}
                                min={filters.custom_start_date ?? undefined}
                                onChange={(event) =>
                                    onChange({
                                        custom_end_date: event.target.value,
                                    })
                                }
                            />
                        </div>
                    </>
                )}
                <div className="grid w-full gap-1.5 sm:w-72">
                    <Label htmlFor="branch-sales-search">Search</Label>
                    <div className="relative">
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            id="branch-sales-search"
                            value={search}
                            onChange={(event) => onSearch(event.target.value)}
                            placeholder="Invoice or customer..."
                            className="pl-9"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function SimpleMetric({
    label,
    value,
    note,
}: {
    label: string;
    value: string;
    note?: string | null;
}) {
    return (
        <Card>
            <CardContent className="grid gap-1 p-5">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-xl font-semibold">{value}</p>
                {note && (
                    <p className="text-xs text-muted-foreground">{note}</p>
                )}
            </CardContent>
        </Card>
    );
}

function SalesLedger({
    report,
    filters,
    onChange,
    onSelect,
}: {
    report: BranchSalesReport;
    filters: ReportFilters;
    onChange: (changes: Partial<ReportFilters>) => void;
    onSelect: (sale: PosSale) => void;
}) {
    return (
        <DataTableLayout>
            <Table className="min-w-5xl">
                <TableHeader>
                    <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {report.sales.data.map((sale) => (
                        <ClickableTableRow
                            key={sale.sale_ID}
                            accessibleLabel={`View invoice ${sale.invoice_number}`}
                            onActivate={() => onSelect(sale)}
                        >
                            <TableCell className="font-medium">
                                {sale.invoice_number}
                            </TableCell>
                            <TableCell>
                                {new Date(sale.created_at).toLocaleString(
                                    'en-PH',
                                )}
                            </TableCell>
                            <TableCell>{sale.customer_name}</TableCell>
                            <TableCell>
                                <Badge
                                    variant={
                                        sale.is_voided
                                            ? 'destructive'
                                            : Number(sale.total_returned) > 0
                                              ? 'secondary'
                                              : 'outline'
                                    }
                                >
                                    {sale.is_voided
                                        ? 'Voided'
                                        : Number(sale.total_returned) >=
                                            Number(sale.total_cost)
                                          ? 'Returned'
                                          : Number(sale.total_returned) > 0
                                            ? 'Partial return'
                                            : 'Complete'}
                                </Badge>
                            </TableCell>
                            <TableCell>{sale.total_items}</TableCell>
                            <TableCell className="text-right font-medium">
                                {currency.format(Number(sale.net_total))}
                            </TableCell>
                        </ClickableTableRow>
                    ))}
                    {report.sales.data.length === 0 && (
                        <DataTableEmptyState
                            colSpan={6}
                            title="No sales found"
                            description="No sales found for the selected filters."
                        />
                    )}
                </TableBody>
            </Table>
            <DataTablePagination
                paginator={report.sales}
                itemLabel="sales"
                className="print:hidden"
                onPageChange={(page) =>
                    router.get(
                        index.url(),
                        { ...reportQuery(filters), page },
                        {
                            only: ['branchSales', 'filters'],
                            preserveState: true,
                            preserveScroll: true,
                        },
                    )
                }
                onPerPageChange={(perPage) => onChange({ per_page: perPage })}
            />
        </DataTableLayout>
    );
}

function Empty({ show }: { show: boolean }) {
    return show ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
            No data for this period.
        </p>
    ) : null;
}
