<?php

namespace App\Support;

use Carbon\CarbonImmutable;

class ReportStatisticPeriod
{
    public const PERIODS = ['month', 'quarter', 'biannual', 'annual'];

    public const STATISTICS = [
        'topProducts',
        'topServices',
        'revenueSplit',
        'paymentMethods',
        'discounts',
        'voidTrend',
        'peakHours',
        'patientRetention',
        'visitFrequency',
        'topPatients',
        'serviceTrends',
        'topDiagnoses',
        'reorderSignals',
        'branchComparison',
        'parentCategoryUtilization',
    ];

    /**
     * @param  array{period?: string, month?: int|null, year?: int|null}  $selection
     * @return array{
     *     period: string,
     *     month: int,
     *     selected_year: int|null,
     *     resolved_year: int,
     *     start: CarbonImmutable,
     *     end: CarbonImmutable,
     *     prior_start: CarbonImmutable,
     *     prior_end: CarbonImmutable,
     *     label: string,
     *     comparison_label: string
     * }
     */
    public static function resolve(array $selection, ?CarbonImmutable $now = null): array
    {
        $now ??= CarbonImmutable::now();
        $period = in_array($selection['period'] ?? null, self::PERIODS, true)
            ? $selection['period']
            : 'month';
        $month = min(12, max(1, (int) ($selection['month'] ?? $now->month)));
        $selectedYear = isset($selection['year']) ? (int) $selection['year'] : null;
        $resolvedYear = $selectedYear
            ?? ($period === 'month' && $month > $now->month ? $now->year - 1 : $now->year);
        $anchor = CarbonImmutable::create($resolvedYear, $month, 1);

        $start = match ($period) {
            'quarter' => $anchor->startOfQuarter(),
            'biannual' => $month <= 6 ? $anchor->startOfYear() : $anchor->startOfYear()->addMonths(6),
            'annual' => $anchor->startOfYear(),
            default => $anchor->startOfMonth(),
        };
        $periodEnd = match ($period) {
            'quarter' => $start->endOfQuarter(),
            'biannual' => $start->addMonths(5)->endOfMonth(),
            'annual' => $start->endOfYear(),
            default => $start->endOfMonth(),
        };
        $end = $periodEnd->isAfter($now) && $start->isBefore($now) ? $now : $periodEnd;
        [$priorStart, $priorEnd] = match ($period) {
            'quarter' => [$start->subQuarter()->startOfQuarter(), $start->subQuarter()->endOfQuarter()],
            'biannual' => [$start->subMonths(6), $start->subDay()],
            'annual' => [$start->subYear()->startOfYear(), $start->subYear()->endOfYear()],
            default => [$start->subMonth()->startOfMonth(), $start->subMonth()->endOfMonth()],
        };

        return [
            'period' => $period,
            'month' => $month,
            'selected_year' => $selectedYear,
            'resolved_year' => $resolvedYear,
            'start' => $start,
            'end' => $end,
            'prior_start' => $priorStart,
            'prior_end' => $priorEnd,
            'label' => self::label($period, $start),
            'comparison_label' => 'vs '.$priorStart->format(self::labelFormat($period)),
        ];
    }

    private static function label(string $period, CarbonImmutable $start): string
    {
        return match ($period) {
            'quarter' => 'Q'.$start->quarter.' '.$start->year,
            'biannual' => ($start->month === 1 ? 'Jan - Jun ' : 'Jul - Dec ').$start->year,
            'annual' => (string) $start->year,
            default => $start->format('F Y'),
        };
    }

    private static function labelFormat(string $period): string
    {
        return match ($period) {
            'quarter' => '\Qq Y',
            'biannual' => 'M Y',
            'annual' => 'Y',
            default => 'F Y',
        };
    }
}
