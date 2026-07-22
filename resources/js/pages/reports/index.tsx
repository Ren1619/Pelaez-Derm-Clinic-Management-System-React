import { Head, router } from '@inertiajs/react';
import {
    Activity,
    ArrowDown,
    ArrowUp,
    BarChart3,
    Building2,
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
                    <SectionHeading title="Overview">
                        <Select
                            value={filters.summary_period}
                            onValueChange={(value) =>
                                visit(
                                    {
                                        summary_period:
                                            value as ReportFilters['summary_period'],
                                    },
                                    ['analytics', 'filters'],
                                )
                            }
                        >
                            <SelectTrigger className="w-44 print:hidden">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="this_week">
                                    This week
                                </SelectItem>
                                <SelectItem value="this_month">
                                    This month
                                </SelectItem>
                                <SelectItem value="this_year">
                                    This year
                                </SelectItem>
                                <SelectItem value="all_time">
                                    All time
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </SectionHeading>

                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <MetricCard
                            label="Total sales"
                            value={currency.format(
                                analytics.summary.totalSales,
                            )}
                            growth={analytics.summary.growth.totalSales}
                            comparison={analytics.summary.comparisonLabel}
                            icon={BarChart3}
                        />
                        <MetricCard
                            label="Transactions"
                            value={number.format(
                                analytics.summary.totalTransactions,
                            )}
                            growth={analytics.summary.growth.totalTransactions}
                            comparison={analytics.summary.comparisonLabel}
                            icon={WalletCards}
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
                        />
                        <MetricCard
                            label="Average sale"
                            value={currency.format(
                                analytics.summary.averageSale,
                            )}
                            growth={analytics.summary.growth.averageSale}
                            comparison={analytics.summary.comparisonLabel}
                            icon={Activity}
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
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
                            printUrl={
                                salesPrint(
                                    { reportPeriod: 'annual' },
                                    { query: overviewPrintQuery },
                                ).url
                            }
                        />
                    </div>
                </section>

                <section className="grid gap-4 xl:grid-cols-2">
                    <RankingCard
                        title="Top Products"
                        subtitle="Revenue ranked"
                        items={analytics.topProducts}
                    />
                    <RankingCard
                        title="Top Services"
                        subtitle="Revenue ranked"
                        items={analytics.topServices}
                    />
                </section>

                <section className="grid gap-4 xl:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Product vs Service Revenue</CardTitle>
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

                    <Card>
                        <CardHeader>
                            <CardTitle>Payment Methods</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3">
                            {analytics.paymentMethods.map((method) => (
                                <div
                                    key={method.method}
                                    className="grid gap-1 border-b pb-2 last:border-0"
                                >
                                    <KeyValue
                                        label={method.label}
                                        value={currency.format(method.revenue)}
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

                    <Card>
                        <CardHeader>
                            <CardTitle>Discount Analytics</CardTitle>
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
                </section>

                <section className="grid gap-4 xl:grid-cols-2">
                    <VoidTrendCard data={analytics.voidTrend.slice(-7)} />
                    <PeakHoursCard data={analytics.peakHours} />
                </section>

                <section className="grid gap-4">
                    <SectionHeading title="Patient Analytics" />
                    <div className="grid gap-4 xl:grid-cols-3">
                        <Card>
                            <CardHeader>
                                <CardTitle>New vs Returning Patients</CardTitle>
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
                        />

                        <Card>
                            <CardHeader className="flex-row items-center justify-between gap-3">
                                <CardTitle>
                                    Top Patients by Lifetime Value
                                </CardTitle>
                                <label className="flex items-center gap-2 text-xs print:hidden">
                                    <Checkbox
                                        checked={filters.anonymize}
                                        onCheckedChange={(checked) =>
                                            visit(
                                                {
                                                    anonymize: checked === true,
                                                },
                                                ['analytics', 'filters'],
                                            )
                                        }
                                    />
                                    Privacy
                                </label>
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
                    <div className="grid gap-4 xl:grid-cols-3">
                        <ServiceTrendsCard data={analytics.serviceTrends} />
                        <ProgressListCard
                            title="Diagnosis Frequency"
                            items={analytics.topDiagnoses.map((diagnosis) => ({
                                label: diagnosis.name,
                                value: diagnosis.frequency,
                            }))}
                        />
                        <ReorderSignalsCard data={analytics.reorderSignals} />
                    </div>
                </section>

                {canViewAllBranches && (
                    <Card>
                        <CardHeader className="flex-row items-center justify-between gap-3">
                            <CardTitle>Branch Comparison</CardTitle>
                            <Select
                                value={filters.comparison_period}
                                onValueChange={(value) =>
                                    visit(
                                        {
                                            comparison_period:
                                                value as ReportFilters['comparison_period'],
                                        },
                                        ['analytics', 'filters'],
                                    )
                                }
                            >
                                <SelectTrigger className="w-36 print:hidden">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="week">
                                        This week
                                    </SelectItem>
                                    <SelectItem value="month">
                                        This month
                                    </SelectItem>
                                    <SelectItem value="year">
                                        This year
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </CardHeader>
                        <CardContent>
                            <BranchComparison
                                data={analytics.branchComparison}
                            />
                        </CardContent>
                    </Card>
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
        summary_period: filters.summary_period,
        comparison_period: filters.comparison_period,
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

function MetricCard({
    label,
    value,
    growth,
    comparison,
    icon: Icon,
}: {
    label: string;
    value: string;
    growth?: { pct: number; direction: 'up' | 'down' | 'flat' };
    comparison?: string;
    icon: React.ComponentType<{ className?: string }>;
}) {
    return (
        <Card>
            <CardContent className="grid gap-3 p-5">
                <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <Icon className="size-5 text-muted-foreground" />
                </div>
                <p className="truncate text-xl font-semibold">{value}</p>
                {growth && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        {growth.direction === 'up' ? (
                            <ArrowUp className="size-3" />
                        ) : growth.direction === 'down' ? (
                            <ArrowDown className="size-3" />
                        ) : null}
                        {growth.pct.toFixed(1)}% {comparison}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

function SeriesCard({
    title,
    series,
    printUrl,
}: {
    title: string;
    series: ReportSeriesPoint[];
    printUrl: string;
}) {
    const maximum = Math.max(...series.map((point) => point.total), 1);

    return (
        <Card>
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
}: {
    title: string;
    subtitle: string;
    items: RankedReportItem[];
}) {
    const maximum = Math.max(...items.map((item) => item.revenue), 1);

    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between gap-3">
                <CardTitle>{title}</CardTitle>
                <span className="text-sm text-muted-foreground">
                    {subtitle}
                </span>
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

function VoidTrendCard({ data }: { data: ReportAnalytics['voidTrend'] }) {
    const maximum = Math.max(...data.map((point) => point.rate), 0);

    return (
        <Card className="h-full">
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Voids & Returns</CardTitle>
                <span className="text-sm text-muted-foreground">
                    Last 7 days
                </span>
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

function PeakHoursCard({ data }: { data: ReportAnalytics['peakHours'] }) {
    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Traffic Patterns</CardTitle>
                <span className="text-sm text-muted-foreground">
                    Peak hours
                </span>
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
}: {
    title: string;
    subtitle?: string;
    items: Array<{ label: string; value: number }>;
}) {
    const maximum = Math.max(...items.map((item) => item.value), 1);

    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between gap-3">
                <CardTitle>{title}</CardTitle>
                {subtitle && (
                    <span className="text-sm text-muted-foreground">
                        {subtitle}
                    </span>
                )}
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
}: {
    data: ReportAnalytics['serviceTrends'];
}) {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Service Trends</CardTitle>
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
}: {
    data: ReportAnalytics['reorderSignals'];
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Product Reorder Signals</CardTitle>
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
