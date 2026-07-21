<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Product;
use App\Models\Sale;
use App\Services\POS\PointOfSalePageService;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\LazyCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ReportsService
{
    public function __construct(private PointOfSalePageService $pointOfSalePageService) {}

    /**
     * @return array<string, mixed>
     */
    public function analytics(
        string $period,
        ?int $branchId,
        bool $canViewAllBranches,
        string $comparisonPeriod,
        bool $anonymizePatients,
    ): array {
        return [
            'summary' => $this->summary($period, $branchId),
            'salesSeries' => [
                'daily' => $this->timeSeries(now()->subDays(6)->startOfDay(), now(), $branchId, 'day'),
                'weekly' => $this->timeSeries(now()->startOfWeek(), now(), $branchId, 'day'),
                'monthly' => $this->monthlySeries($branchId),
                'quarterly' => $this->calendarMonthSeries(now()->startOfQuarter(), now(), $branchId),
                'annual' => $this->calendarMonthSeries(now()->startOfYear(), now(), $branchId),
            ],
            'topProducts' => $this->topItems('product', $period, $branchId),
            'topServices' => $this->topItems('service', $period, $branchId),
            'revenueSplit' => $this->revenueSplit($period, $branchId),
            'paymentMethods' => $this->paymentMethods($period, $branchId),
            'discounts' => $this->discounts($period, $branchId),
            'voidTrend' => $this->voidTrend($branchId),
            'peakHours' => $this->peakHours($period, $branchId),
            'patientRetention' => $this->patientRetention($period, $branchId),
            'visitFrequency' => $this->visitFrequency($period, $branchId),
            'topPatients' => $this->topPatients($period, $branchId, $anonymizePatients),
            'serviceTrends' => $this->serviceTrends($period, $branchId),
            'topDiagnoses' => $this->topDiagnoses($period, $branchId),
            'reorderSignals' => $this->reorderSignals($branchId),
            'branchComparison' => $canViewAllBranches ? $this->branchComparison($comparisonPeriod) : [],
        ];
    }

    /**
     * @param array<string, mixed> $filters
     * @return array{stats: array<string, mixed>, sales: LengthAwarePaginator<int, array<string, mixed>>}
     */
    public function branchSales(int $branchId, array $filters): array
    {
        $baseQuery = $this->salesLedgerQuery($branchId, $filters);
        $sales = (clone $baseQuery)
            ->with([
                'productItems', 'serviceItems', 'returns.items',
                'returns.processedBy:account_ID,first_name,middle_name,last_name',
                'voidedBy:account_ID,first_name,middle_name,last_name',
                'processedBy:account_ID,first_name,middle_name,last_name',
            ])
            ->latest('date')
            ->latest('created_at')
            ->paginate((int) $filters['per_page'], pageName: 'page')
            ->withQueryString()
            ->through(fn (Sale $sale): array => $this->pointOfSalePageService->serializeSale($sale));

        return [
            'stats' => $this->branchSalesStats($branchId, $filters),
            'sales' => $sales,
        ];
    }

    /** @param array<string, mixed> $filters */
    public function exportQuery(?int $branchId, array $filters): Builder
    {
        return $this->salesLedgerQuery($branchId, $filters)
            ->withSum('returns as returned_amount', 'return_amount')
            ->latest('date')
            ->latest('created_at');
    }

    /** @param array<string, mixed> $filters */
    public function exportFilename(Branch $branch, array $filters): string
    {
        return Str::slug($branch->branch_name).'-branch-sales-'.$filters['sales_period'].'-'.today()->toDateString().'.csv';
    }

    /**
     * @param array<string, mixed> $filters
     * @return array{period_label: string, stats: array<string, mixed>, sales: LazyCollection<int, array<string, mixed>>}
     */
    public function printableReport(?int $branchId, array $filters): array
    {
        return [
            'period_label' => $this->salesPeriodLabel($filters),
            'stats' => $this->branchSalesStats($branchId, $filters),
            'sales' => $this->exportQuery($branchId, $filters)->cursor()->map(function (Sale $sale): array {
                $returned = (float) ($sale->returned_amount ?? 0);
                $total = (float) $sale->total_cost;

                return [
                    'invoice_number' => $sale->invoice_number,
                    'date' => $sale->date?->format('M d, Y'),
                    'time' => $sale->created_at?->format('g:i A'),
                    'branch_name' => $sale->branch_name,
                    'customer_name' => $sale->customer_name,
                    'status' => match (true) {
                        $sale->is_voided => 'Voided',
                        $returned >= $total => 'Fully Returned',
                        $returned > 0 => 'Partial Return',
                        default => 'Complete',
                    },
                    'subtotal' => (float) $sale->subtotal_cost,
                    'discount_percentage' => (float) $sale->discount_perc,
                    'discount_amount' => (float) $sale->discount_amount,
                    'total' => $total,
                    'returned' => $returned,
                    'net' => $sale->is_voided ? 0.0 : max(0, $total - $returned),
                    'payment_method' => Str::headline($sale->pay_method),
                ];
            }),
        ];
    }

    /** @return array<string, mixed> */
    public function standardSalesFilters(string $period): array
    {
        return match ($period) {
            'daily' => $this->salesFiltersForRange(now()->subDays(6)->startOfDay(), today()),
            'weekly' => ['sales_period' => 'week', 'search' => ''],
            'monthly' => ['sales_period' => 'month', 'search' => ''],
            'quarterly' => $this->salesFiltersForRange(now()->startOfQuarter(), today()),
            'annual' => ['sales_period' => 'year', 'search' => ''],
        };
    }

    /** @return array<string, mixed> */
    private function summary(string $period, ?int $branchId): array
    {
        $current = $this->summaryForRange($this->periodRange($period), $branchId);
        $prior = $this->summaryForRange($this->priorPeriodRange($period), $branchId);

        return [
            'totalSales' => (float) ($current->total_sales ?? 0),
            'totalTransactions' => (int) ($current->total_transactions ?? 0),
            'averageSale' => (float) ($current->average_sale ?? 0),
            'activeBranches' => $branchId === null ? Branch::query()->count() : 1,
            'growth' => [
                'totalSales' => $this->growth((float) ($current->total_sales ?? 0), (float) ($prior->total_sales ?? 0)),
                'totalTransactions' => $this->growth((float) ($current->total_transactions ?? 0), (float) ($prior->total_transactions ?? 0)),
                'averageSale' => $this->growth((float) ($current->average_sale ?? 0), (float) ($prior->average_sale ?? 0)),
            ],
            'comparisonLabel' => match ($period) {
                'today' => 'vs yesterday',
                'this_week' => 'vs last week',
                'this_month' => 'vs last month',
                'this_year' => 'vs last year',
                default => 'all-time view',
            },
        ];
    }

    private function summaryForRange(array $range, ?int $branchId): object
    {
        return $this->completedSales($branchId)
            ->when($range['start'], fn (Builder $query, CarbonInterface $start) => $query->whereDate('date', '>=', $start))
            ->when($range['end'], fn (Builder $query, CarbonInterface $end) => $query->whereDate('date', '<=', $end))
            ->toBase()
            ->selectRaw('COUNT(*) as total_transactions')
            ->selectRaw('COALESCE(SUM(total_cost), 0) as total_sales')
            ->selectRaw('COALESCE(AVG(total_cost), 0) as average_sale')
            ->first();
    }

    /** @return array{pct: float, direction: string} */
    private function growth(float $current, float $prior): array
    {
        if ($prior <= 0) {
            return ['pct' => $current > 0 ? 100.0 : 0.0, 'direction' => $current > 0 ? 'up' : 'flat'];
        }

        $percentage = round((($current - $prior) / $prior) * 100, 1);

        return [
            'pct' => abs($percentage),
            'direction' => $percentage > 0 ? 'up' : ($percentage < 0 ? 'down' : 'flat'),
        ];
    }

    /** @return list<array<string, mixed>> */
    private function timeSeries(CarbonInterface $start, CarbonInterface $end, ?int $branchId, string $interval): array
    {
        $rows = $this->completedSales($branchId)
            ->whereDate('date', '>=', $start)
            ->whereDate('date', '<=', $end)
            ->toBase()
            ->selectRaw('DATE(date) as period, SUM(total_cost) as total, COUNT(*) as count')
            ->groupByRaw('DATE(date)')
            ->get()
            ->keyBy('period');
        $series = [];
        $cursor = $start->copy();

        while ($cursor->lte($end)) {
            $key = $cursor->toDateString();
            $row = $rows->get($key);
            $series[] = [
                'period' => $key,
                'label' => $cursor->format('M j'),
                'total' => (float) ($row->total ?? 0),
                'count' => (int) ($row->count ?? 0),
            ];
            $cursor = $interval === 'week' ? $cursor->addWeek() : $cursor->addDay();
        }

        return $series;
    }

    /** @return list<array<string, mixed>> */
    private function monthlySeries(?int $branchId): array
    {
        $daily = collect($this->timeSeries(now()->startOfMonth(), now(), $branchId, 'day'));

        return $daily->chunk(7)->values()->map(fn (Collection $week, int $index): array => [
            'period' => $week->first()['period'],
            'label' => 'Week '.($index + 1),
            'total' => (float) $week->sum('total'),
            'count' => (int) $week->sum('count'),
        ])->all();
    }

    /** @return list<array<string, mixed>> */
    private function calendarMonthSeries(CarbonInterface $start, CarbonInterface $end, ?int $branchId): array
    {
        return collect($this->timeSeries($start, $end, $branchId, 'day'))
            ->groupBy(fn (array $point): string => Str::substr($point['period'], 0, 7))
            ->map(fn (Collection $month, string $period): array => [
                'period' => $period,
                'label' => CarbonImmutable::parse($period.'-01')->format('M'),
                'total' => (float) $month->sum('total'),
                'count' => (int) $month->sum('count'),
            ])->values()->all();
    }

    /** @return list<array<string, mixed>> */
    private function topItems(string $type, string $period, ?int $branchId): array
    {
        $table = $type === 'product' ? 'sale_product_items' : 'sale_service_items';
        $nameColumn = $type === 'product' ? 'product_name' : 'service_name';
        $query = DB::table($table)
            ->join('sales', "{$table}.sale_ID", '=', 'sales.sale_ID')
            ->where('sales.finalized', true)
            ->where('sales.is_voided', false)
            ->when($branchId, fn ($builder, int $id) => $builder->where('sales.branch_ID', $id));
        $this->applyPeriod($query, $period, 'sales.date');

        return $query
            ->selectRaw("{$table}.{$nameColumn} as name, SUM({$table}.quantity) as total_qty, SUM({$table}.line_total) as revenue")
            ->groupBy("{$table}.{$nameColumn}")
            ->orderByDesc('revenue')
            ->limit(10)
            ->get()
            ->values()
            ->map(fn (object $item, int $index): array => [
                'rank' => $index + 1,
                'name' => $item->name,
                'total_qty' => (int) $item->total_qty,
                'revenue' => (float) $item->revenue,
            ])->all();
    }

    /** @return array<string, float> */
    private function revenueSplit(string $period, ?int $branchId): array
    {
        $totals = [];

        foreach (['products' => 'sale_product_items', 'services' => 'sale_service_items'] as $key => $table) {
            $query = DB::table($table)
                ->join('sales', "{$table}.sale_ID", '=', 'sales.sale_ID')
                ->where('sales.finalized', true)
                ->where('sales.is_voided', false)
                ->when($branchId, fn ($builder, int $id) => $builder->where('sales.branch_ID', $id));
            $this->applyPeriod($query, $period, 'sales.date');
            $totals[$key] = (float) $query->sum("{$table}.line_total");
        }

        $total = $totals['products'] + $totals['services'];

        return [
            'products_total' => $totals['products'],
            'services_total' => $totals['services'],
            'products_pct' => $total > 0 ? round($totals['products'] / $total * 100, 1) : 0.0,
            'services_pct' => $total > 0 ? round($totals['services'] / $total * 100, 1) : 0.0,
            'total' => $total,
        ];
    }

    /** @return list<array<string, mixed>> */
    private function paymentMethods(string $period, ?int $branchId): array
    {
        $query = $this->completedSales($branchId);
        $this->applyPeriod($query, $period);

        return $query->toBase()
            ->selectRaw('pay_method as method, COUNT(*) as transactions, SUM(total_cost) as revenue')
            ->groupBy('pay_method')
            ->orderByDesc('revenue')
            ->get()
            ->map(fn (object $row): array => [
                'method' => $row->method,
                'label' => Str::headline($row->method),
                'transactions' => (int) $row->transactions,
                'revenue' => (float) $row->revenue,
            ])->all();
    }

    /** @return array<string, mixed> */
    private function discounts(string $period, ?int $branchId): array
    {
        $query = $this->completedSales($branchId);
        $this->applyPeriod($query, $period);
        $summary = $query->toBase()
            ->selectRaw('COUNT(*) as total_transactions')
            ->selectRaw('SUM(CASE WHEN discount_perc > 0 THEN 1 ELSE 0 END) as discounted_transactions')
            ->selectRaw('COALESCE(AVG(CASE WHEN discount_perc > 0 THEN discount_perc END), 0) as average_discount')
            ->selectRaw('COALESCE(SUM(discount_amount), 0) as total_discount')
            ->selectRaw('COALESCE(SUM(subtotal_cost), 0) as gross_revenue')
            ->first();
        $gross = (float) ($summary->gross_revenue ?? 0);
        $discount = (float) ($summary->total_discount ?? 0);

        return [
            'total_transactions' => (int) ($summary->total_transactions ?? 0),
            'discounted_transactions' => (int) ($summary->discounted_transactions ?? 0),
            'average_discount' => (float) ($summary->average_discount ?? 0),
            'total_discount' => $discount,
            'discount_impact_pct' => $gross > 0 ? round($discount / $gross * 100, 1) : 0.0,
        ];
    }

    /** @return list<array<string, mixed>> */
    private function voidTrend(?int $branchId): array
    {
        $start = now()->subDays(29)->startOfDay();
        $sales = Sale::query()
            ->where('finalized', true)
            ->when($branchId, fn (Builder $query, int $id) => $query->where('branch_ID', $id))
            ->whereDate('date', '>=', $start)
            ->toBase()
            ->selectRaw('DATE(date) as period, COUNT(*) as transactions, SUM(CASE WHEN is_voided = 1 THEN 1 ELSE 0 END) as voids')
            ->groupByRaw('DATE(date)')
            ->get()
            ->keyBy('period');
        $returns = DB::table('sale_returns')
            ->join('sales', 'sale_returns.sale_ID', '=', 'sales.sale_ID')
            ->when($branchId, fn ($query, int $id) => $query->where('sales.branch_ID', $id))
            ->whereDate('sale_returns.created_at', '>=', $start)
            ->selectRaw('DATE(sale_returns.created_at) as period, COUNT(DISTINCT sale_returns.sale_ID) as return_count')
            ->groupByRaw('DATE(sale_returns.created_at)')
            ->get()
            ->keyBy('period');
        $result = [];
        $cursor = $start->copy();

        while ($cursor->lte(now())) {
            $key = $cursor->toDateString();
            $saleRow = $sales->get($key);
            $transactions = (int) ($saleRow->transactions ?? 0);
            $issues = (int) ($saleRow->voids ?? 0) + (int) ($returns->get($key)->return_count ?? 0);
            $result[] = [
                'period' => $key,
                'label' => $cursor->format('M j'),
                'transactions' => $transactions,
                'voids' => (int) ($saleRow->voids ?? 0),
                'returns' => (int) ($returns->get($key)->return_count ?? 0),
                'rate' => $transactions > 0 ? round($issues / $transactions * 100, 1) : 0.0,
            ];
            $cursor = $cursor->addDay();
        }

        return $result;
    }

    /** @return array<string, mixed> */
    private function peakHours(string $period, ?int $branchId): array
    {
        $query = $this->completedSales($branchId);
        $this->applyPeriod($query, $period);
        $counts = [];
        $maximum = 0;

        $query->get(['created_at'])->each(function (Sale $sale) use (&$counts, &$maximum): void {
            $day = $sale->created_at?->dayOfWeekIso ?? 1;
            $hour = $sale->created_at?->hour ?? 8;
            $counts[$day][$hour] = ($counts[$day][$hour] ?? 0) + 1;
            $maximum = max($maximum, $counts[$day][$hour]);
        });

        $hours = range(8, 19);
        $days = collect([1 => 'Mon', 2 => 'Tue', 3 => 'Wed', 4 => 'Thu', 5 => 'Fri', 6 => 'Sat', 7 => 'Sun'])
            ->map(fn (string $label, int $day): array => [
                'day' => $label,
                'cells' => collect($hours)->map(fn (int $hour): array => [
                    'hour' => $hour,
                    'label' => now()->startOfDay()->setHour($hour)->format('g A'),
                    'count' => $counts[$day][$hour] ?? 0,
                    'intensity' => $maximum > 0 ? round(($counts[$day][$hour] ?? 0) / $maximum, 2) : 0,
                ])->all(),
            ])->values()->all();

        return [
            'hours' => collect($hours)->map(fn (int $hour): string => now()->startOfDay()->setHour($hour)->format('g A'))->all(),
            'days' => $days,
            'max' => $maximum,
        ];
    }

    /** @return array<string, mixed> */
    private function patientRetention(string $period, ?int $branchId): array
    {
        $query = $this->completedSales($branchId)->whereNotNull('PID');
        $this->applyPeriod($query, $period);
        $patientIds = $query->distinct()->pluck('PID');

        if ($patientIds->isEmpty()) {
            return ['new_count' => 0, 'returning_count' => 0, 'new_pct' => 0.0, 'returning_pct' => 0.0, 'total_unique_patients' => 0];
        }

        $range = $this->periodRange($period);
        $firstSales = $this->completedSales($branchId)
            ->whereIn('PID', $patientIds)
            ->toBase()
            ->selectRaw('PID, MIN(date) as first_visit')
            ->groupBy('PID')
            ->get();
        $newCount = $range['start'] === null ? 0 : $firstSales->filter(fn (object $row): bool =>
            $row->first_visit >= $range['start']->toDateString()
            && $row->first_visit <= $range['end']->toDateString()
        )->count();
        $total = $patientIds->count();
        $returning = $total - $newCount;

        return [
            'new_count' => $newCount,
            'returning_count' => $returning,
            'new_pct' => round($newCount / $total * 100, 1),
            'returning_pct' => round($returning / $total * 100, 1),
            'total_unique_patients' => $total,
        ];
    }

    /** @return array<string, mixed> */
    private function visitFrequency(string $period, ?int $branchId): array
    {
        $query = $this->completedSales($branchId)->whereNotNull('PID');
        $this->applyPeriod($query, $period);
        $visits = $query->toBase()->selectRaw('PID, COUNT(*) as visit_count')->groupBy('PID')->get();
        $buckets = ['1 visit' => 0, '2-3 visits' => 0, '4-6 visits' => 0, '7+ visits' => 0];

        foreach ($visits as $visit) {
            $count = (int) $visit->visit_count;
            $label = match (true) {
                $count === 1 => '1 visit',
                $count <= 3 => '2-3 visits',
                $count <= 6 => '4-6 visits',
                default => '7+ visits',
            };
            $buckets[$label]++;
        }

        $currentRange = $this->periodRange($period);
        $priorRange = $this->priorPeriodRange($period);
        $lapsed = 0;

        if ($currentRange['start'] !== null && $priorRange['start'] !== null) {
            $currentPatients = $this->completedSales($branchId)
                ->whereNotNull('PID')
                ->whereBetween('date', [$currentRange['start'], $currentRange['end']])
                ->select('PID');
            $lapsed = $this->completedSales($branchId)
                ->whereNotNull('PID')
                ->whereBetween('date', [$priorRange['start'], $priorRange['end']])
                ->whereNotIn('PID', $currentPatients)
                ->distinct()
                ->count('PID');
        }

        return [
            'buckets' => collect($buckets)->map(fn (int $count, string $label): array => compact('label', 'count'))->values()->all(),
            'lapsed_patients' => $lapsed,
        ];
    }

    /** @return list<array<string, mixed>> */
    private function topPatients(string $period, ?int $branchId, bool $anonymized): array
    {
        $returns = DB::table('sale_returns')
            ->selectRaw('sale_ID, SUM(return_amount) as returned_amount')
            ->groupBy('sale_ID');
        $query = DB::table('sales')
            ->join('patients', 'sales.PID', '=', 'patients.PID')
            ->leftJoinSub($returns, 'return_totals', fn ($join) => $join->on('sales.sale_ID', '=', 'return_totals.sale_ID'))
            ->where('sales.finalized', true)
            ->where('sales.is_voided', false)
            ->when($branchId, fn ($builder, int $id) => $builder->where('sales.branch_ID', $id));
        $this->applyPeriod($query, $period, 'sales.date');

        return $query
            ->groupBy('sales.PID', 'patients.first_name', 'patients.middle_name', 'patients.last_name')
            ->selectRaw('sales.PID, patients.first_name, patients.middle_name, patients.last_name, SUM(sales.total_cost - COALESCE(return_totals.returned_amount, 0)) as total_spend, COUNT(DISTINCT sales.sale_ID) as visit_count, MAX(sales.date) as last_visit_date')
            ->orderByDesc('total_spend')
            ->limit(10)
            ->get()
            ->values()
            ->map(function (object $patient, int $index) use ($anonymized): array {
                $visits = (int) $patient->visit_count;
                $spend = (float) $patient->total_spend;

                return [
                    'rank' => $index + 1,
                    'name' => $anonymized ? 'Patient #'.($index + 1) : collect([$patient->first_name, $patient->middle_name, $patient->last_name])->filter()->implode(' '),
                    'total_spend' => $spend,
                    'visit_count' => $visits,
                    'average_per_visit' => $visits > 0 ? $spend / $visits : 0,
                    'last_visit_date' => $patient->last_visit_date,
                ];
            })->all();
    }

    /** @return list<array<string, mixed>> */
    private function serviceTrends(string $period, ?int $branchId): array
    {
        $topServices = collect($this->topItems('service', $period, $branchId))->take(5);

        if ($topServices->isEmpty()) {
            return [];
        }

        $start = now()->subDays(29)->startOfDay();
        $rows = DB::table('sale_service_items')
            ->join('sales', 'sale_service_items.sale_ID', '=', 'sales.sale_ID')
            ->where('sales.finalized', true)
            ->where('sales.is_voided', false)
            ->whereIn('sale_service_items.service_name', $topServices->pluck('name'))
            ->whereDate('sales.date', '>=', $start)
            ->when($branchId, fn ($query, int $id) => $query->where('sales.branch_ID', $id))
            ->selectRaw('sale_service_items.service_name, DATE(sales.date) as period, SUM(sale_service_items.quantity) as qty')
            ->groupBy('sale_service_items.service_name')
            ->groupByRaw('DATE(sales.date)')
            ->get()
            ->groupBy('service_name');

        return $topServices->values()->map(function (array $service) use ($rows, $start): array {
            $serviceRows = $rows->get($service['name'], collect())->keyBy('period');
            $data = [];
            $cursor = $start->copy();

            while ($cursor->lte(now())) {
                $key = $cursor->toDateString();
                $data[] = ['label' => $cursor->format('M j'), 'qty' => (int) ($serviceRows->get($key)->qty ?? 0)];
                $cursor = $cursor->addDay();
            }

            return ['service_name' => $service['name'], 'total_qty' => $service['total_qty'], 'data' => $data];
        })->all();
    }

    /** @return list<array<string, mixed>> */
    private function topDiagnoses(string $period, ?int $branchId): array
    {
        $query = DB::table('patient_visit_diagnoses')
            ->join('patient_visits', 'patient_visit_diagnoses.visit_ID', '=', 'patient_visits.visit_ID')
            ->when($branchId, fn ($builder, int $id) => $builder->where('patient_visits.branch_ID', $id));
        $this->applyPeriod($query, $period, 'patient_visits.visited_at');
        $diagnoses = $query
            ->selectRaw('patient_visit_diagnoses.diagnosis as name, COUNT(*) as frequency')
            ->groupBy('patient_visit_diagnoses.diagnosis')
            ->orderByDesc('frequency')
            ->limit(10)
            ->get();

        return $diagnoses->map(fn (object $diagnosis): array => [
            'name' => $diagnosis->name,
            'frequency' => (int) $diagnosis->frequency,
        ])->all();
    }

    /** @return list<array<string, mixed>> */
    private function reorderSignals(?int $branchId): array
    {
        $stock = Product::query()
            ->when($branchId, fn (Builder $query, int $id) => $query->where('branch_ID', $id))
            ->toBase()
            ->selectRaw('LOWER(name) as product_key, name, branch_ID, SUM(quantity) as current_stock')
            ->groupByRaw('LOWER(name), name, branch_ID')
            ->get();
        $velocity = DB::table('sale_product_items')
            ->join('sales', 'sale_product_items.sale_ID', '=', 'sales.sale_ID')
            ->where('sales.finalized', true)
            ->where('sales.is_voided', false)
            ->whereDate('sales.date', '>=', today()->subDays(6))
            ->when($branchId, fn ($query, int $id) => $query->where('sales.branch_ID', $id))
            ->selectRaw('LOWER(sale_product_items.product_name) as product_key, sales.branch_ID, SUM(sale_product_items.quantity) / 7.0 as daily_sales')
            ->groupByRaw('LOWER(sale_product_items.product_name), sales.branch_ID')
            ->get()
            ->keyBy(fn (object $row): string => $row->product_key.'|'.$row->branch_ID);

        return $stock->map(function (object $product) use ($velocity): array {
            $daily = (float) ($velocity->get($product->product_key.'|'.$product->branch_ID)->daily_sales ?? 0);
            $quantity = (int) $product->current_stock;
            $runway = $daily > 0 ? round($quantity / $daily, 1) : null;

            return [
                'product_name' => $product->name,
                'branch_ID' => (int) $product->branch_ID,
                'avg_daily_sales' => $daily,
                'current_stock' => $quantity,
                'runway_days' => $runway,
                'urgency' => match (true) {
                    $runway !== null && $runway < 7 => 'critical',
                    $runway !== null && $runway < 14 => 'warning',
                    default => 'ok',
                },
            ];
        })->sortBy(fn (array $item) => $item['runway_days'] ?? PHP_INT_MAX)->take(10)->values()->all();
    }

    /** @return list<array<string, mixed>> */
    private function branchComparison(string $period): array
    {
        $sales = $this->completedSales(null);
        $this->applyPeriod($sales, $period);
        $rows = $sales->toBase()
            ->selectRaw('branch_ID, SUM(total_cost) as total, COUNT(*) as count, AVG(total_cost) as average')
            ->groupBy('branch_ID')
            ->get()
            ->keyBy('branch_ID');

        return Branch::query()->orderBy('branch_name')->get(['branch_ID', 'branch_name'])
            ->map(function (Branch $branch) use ($rows): array {
                $row = $rows->get($branch->branch_ID);

                return [
                    'branch_ID' => $branch->branch_ID,
                    'label' => $branch->branch_name,
                    'total' => (float) ($row->total ?? 0),
                    'count' => (int) ($row->count ?? 0),
                    'average' => (float) ($row->average ?? 0),
                ];
            })->all();
    }

    /** @param array<string, mixed> $filters */
    private function salesLedgerQuery(?int $branchId, array $filters): Builder
    {
        $query = Sale::query()
            ->where('finalized', true)
            ->when($branchId, fn (Builder $builder, int $id) => $builder->where('branch_ID', $id));
        $this->applySalesPeriod($query, $filters);

        return $query->when($filters['search'], fn (Builder $builder, string $search) => $builder->where(
            fn (Builder $searchQuery) => $searchQuery
                ->where('invoice_number', 'like', "%{$search}%")
                ->orWhere('customer_name', 'like', "%{$search}%")
                ->when(ctype_digit($search), fn (Builder $idQuery) => $idQuery->orWhereKey((int) $search)),
        ));
    }

    /** @param array<string, mixed> $filters */
    private function branchSalesStats(?int $branchId, array $filters): array
    {
        $query = Sale::query()
            ->where('finalized', true)
            ->when($branchId, fn (Builder $builder, int $id) => $builder->where('branch_ID', $id));
        $this->applySalesPeriod($query, $filters);
        $summary = $query->toBase()
            ->selectRaw('COUNT(*) as record_count')
            ->selectRaw('COALESCE(SUM(subtotal_cost), 0) as subtotal_amount')
            ->selectRaw('COALESCE(SUM(discount_amount), 0) as discount_amount')
            ->selectRaw('COALESCE(SUM(total_cost), 0) as gross_sales')
            ->selectRaw('COALESCE(SUM(CASE WHEN is_voided = 1 THEN total_cost ELSE 0 END), 0) as voided_amount')
            ->selectRaw('SUM(CASE WHEN is_voided = 0 THEN 1 ELSE 0 END) as total_transactions')
            ->first();
        $returnQuery = DB::table('sale_returns')->join('sales', 'sale_returns.sale_ID', '=', 'sales.sale_ID')
            ->where('sales.finalized', true)
            ->where('sales.is_voided', false)
            ->when($branchId, fn ($builder, int $id) => $builder->where('sales.branch_ID', $id));
        $this->applySalesPeriod($returnQuery, $filters, 'sales.date');
        $returned = (float) $returnQuery->sum('sale_returns.return_amount');
        $net = (float) $summary->gross_sales - (float) $summary->voided_amount - $returned;
        $transactions = (int) $summary->total_transactions;
        $topDayQuery = $this->completedSales($branchId);
        $this->applySalesPeriod($topDayQuery, $filters);
        $topDay = $topDayQuery->toBase()
            ->selectRaw('DATE(date) as sale_date, SUM(total_cost) as daily_total')
            ->groupByRaw('DATE(date)')->orderByDesc('daily_total')->first();

        return [
            'total_sales' => $net,
            'record_count' => (int) $summary->record_count,
            'subtotal_amount' => (float) $summary->subtotal_amount,
            'discount_amount' => (float) $summary->discount_amount,
            'gross_sales' => (float) $summary->gross_sales,
            'voided_amount' => (float) $summary->voided_amount,
            'returned_amount' => $returned,
            'total_transactions' => $transactions,
            'average_sale' => $transactions > 0 ? $net / $transactions : 0,
            'top_day_sales' => (float) ($topDay->daily_total ?? 0),
            'top_day_date' => $topDay->sale_date ?? null,
        ];
    }

    private function completedSales(?int $branchId): Builder
    {
        return Sale::query()
            ->where('finalized', true)
            ->where('is_voided', false)
            ->when($branchId, fn (Builder $query, int $id) => $query->where('branch_ID', $id));
    }

    private function applyPeriod(mixed $query, string $period, string $column = 'date'): void
    {
        $range = $this->periodRange($period);
        $query
            ->when($range['start'], fn ($builder, CarbonInterface $start) => $builder->whereDate($column, '>=', $start))
            ->when($range['end'], fn ($builder, CarbonInterface $end) => $builder->whereDate($column, '<=', $end));
    }

    /** @param array<string, mixed> $filters */
    private function applySalesPeriod(mixed $query, array $filters, string $column = 'date'): void
    {
        match ($filters['sales_period']) {
            'today' => $query->whereDate($column, today()),
            'week' => $query->whereDate($column, '>=', now()->startOfWeek()),
            'month' => $query->whereDate($column, '>=', now()->startOfMonth()),
            'quarter' => $query->whereDate($column, '>=', now()->startOfQuarter()),
            'year' => $query->whereDate($column, '>=', now()->startOfYear()),
            'specific_date' => $query->whereDate($column, $filters['specific_date'] ?: today()),
            'custom_range' => $query->whereDate($column, '>=', $filters['custom_start_date'] ?: now()->startOfMonth())
                ->whereDate($column, '<=', $filters['custom_end_date'] ?: today()),
            default => null,
        };
    }

    /** @param array<string, mixed> $filters */
    private function salesPeriodLabel(array $filters): string
    {
        return match ($filters['sales_period']) {
            'today' => today()->format('F j, Y'),
            'week' => $this->dateRangeLabel(now()->startOfWeek(), today()),
            'month' => today()->format('F Y'),
            'quarter' => 'Q'.today()->quarter.' '.today()->year,
            'year' => today()->format('Y'),
            'specific_date' => CarbonImmutable::parse($filters['specific_date'] ?: today())->format('F j, Y'),
            'custom_range' => $this->dateRangeLabel(
                CarbonImmutable::parse($filters['custom_start_date'] ?: now()->startOfMonth()),
                CarbonImmutable::parse($filters['custom_end_date'] ?: today()),
            ),
            default => 'All time',
        };
    }

    /** @return array<string, mixed> */
    private function salesFiltersForRange(CarbonInterface $start, CarbonInterface $end): array
    {
        return [
            'sales_period' => 'custom_range',
            'custom_start_date' => $start->toDateString(),
            'custom_end_date' => $end->toDateString(),
            'search' => '',
        ];
    }

    private function dateRangeLabel(CarbonInterface $start, CarbonInterface $end): string
    {
        if ($start->isSameDay($end)) {
            return $start->format('F j, Y');
        }

        if ($start->isSameYear($end)) {
            return $start->format('M j').' - '.$end->format('M j, Y');
        }

        return $start->format('M j, Y').' - '.$end->format('M j, Y');
    }

    /** @return array{start: CarbonInterface|null, end: CarbonInterface|null} */
    private function periodRange(string $period): array
    {
        return match ($period) {
            'today' => ['start' => today(), 'end' => today()],
            'this_week', 'week' => ['start' => now()->startOfWeek(), 'end' => today()],
            'this_month', 'month' => ['start' => now()->startOfMonth(), 'end' => today()],
            'this_year', 'year' => ['start' => now()->startOfYear(), 'end' => today()],
            default => ['start' => null, 'end' => null],
        };
    }

    /** @return array{start: CarbonInterface|null, end: CarbonInterface|null} */
    private function priorPeriodRange(string $period): array
    {
        return match ($period) {
            'today' => ['start' => today()->subDay(), 'end' => today()->subDay()],
            'this_week', 'week' => ['start' => now()->subWeek()->startOfWeek(), 'end' => now()->subWeek()->endOfWeek()],
            'this_month', 'month' => ['start' => now()->subMonthNoOverflow()->startOfMonth(), 'end' => now()->subMonthNoOverflow()->endOfMonth()],
            'this_year', 'year' => ['start' => now()->subYear()->startOfYear(), 'end' => now()->subYear()->endOfYear()],
            default => ['start' => null, 'end' => null],
        };
    }
}
