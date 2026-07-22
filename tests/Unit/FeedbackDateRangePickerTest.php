<?php

test('feedback filters use the shadcn date range picker', function () {
    $source = file_get_contents(
        dirname(__DIR__, 2).DIRECTORY_SEPARATOR.'resources/js/pages/feedback/index.tsx',
    );

    expect($source)
        ->toContain("import { Calendar } from '@/components/ui/calendar';")
        ->toContain("from '@/components/ui/popover';")
        ->toContain('mode="range"')
        ->toContain('onSelect={selectDateRange}')
        ->toContain('resetOnSelect')
        ->not->toContain('type="date"');
});

test('the shared calendar styles every date range state', function () {
    $source = file_get_contents(
        dirname(__DIR__, 2).DIRECTORY_SEPARATOR.'resources/js/components/ui/calendar.tsx',
    );

    expect($source)
        ->toContain('data-range-start={modifiers.range_start}')
        ->toContain('data-range-middle={modifiers.range_middle}')
        ->toContain('data-range-end={modifiers.range_end}')
        ->toContain('data-[range-start=true]:bg-primary')
        ->toContain('data-[range-middle=true]:bg-accent')
        ->toContain('data-[range-middle=true]:rounded-none')
        ->toContain('data-[range-end=true]:bg-primary');
});
