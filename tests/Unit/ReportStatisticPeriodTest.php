<?php

use App\Support\ReportStatisticPeriod;
use Carbon\CarbonImmutable;

test('an automatic year uses the latest occurrence of the selected month', function (
    int $month,
    int $expectedYear,
) {
    $range = ReportStatisticPeriod::resolve(
        ['period' => 'month', 'month' => $month],
        CarbonImmutable::parse('2026-07-15'),
    );

    expect($range['resolved_year'])->toBe($expectedYear)
        ->and($range['label'])->toBe(CarbonImmutable::create($expectedYear, $month)->format('F Y'));
})->with([
    'month already reached this year' => [6, 2026],
    'current month' => [7, 2026],
    'month not reached this year' => [9, 2025],
]);

test('an explicit year always takes precedence over the automatic year', function () {
    $range = ReportStatisticPeriod::resolve(
        ['period' => 'month', 'month' => 9, 'year' => 2024],
        CarbonImmutable::parse('2026-07-15'),
    );

    expect($range['resolved_year'])->toBe(2024)
        ->and($range['start']->toDateString())->toBe('2024-09-01')
        ->and($range['end']->toDateString())->toBe('2024-09-30');
});

test('fixed reporting periods use calendar boundaries', function (
    string $period,
    string $expectedStart,
    string $expectedEnd,
) {
    $range = ReportStatisticPeriod::resolve(
        ['period' => $period, 'month' => 11, 'year' => 2025],
        CarbonImmutable::parse('2026-07-15'),
    );

    expect($range['start']->toDateString())->toBe($expectedStart)
        ->and($range['end']->toDateString())->toBe($expectedEnd);
})->with([
    'quarterly' => ['quarter', '2025-10-01', '2025-12-31'],
    'bi-annual' => ['biannual', '2025-07-01', '2025-12-31'],
    'annual' => ['annual', '2025-01-01', '2025-12-31'],
]);
