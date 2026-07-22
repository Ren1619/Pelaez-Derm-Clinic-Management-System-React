<?php

use Illuminate\Support\Facades\File;

test('the shared theme exposes the original clinic palette through semantic tokens', function () {
    $stylesheet = File::get(resource_path('css/app.css'));

    expect($stylesheet)
        ->toContain('--color-brand: #f91d7c;')
        ->toContain('--color-brand-bright: #ff006e;')
        ->toContain('--color-brand-mid: #e0005e;')
        ->toContain('--color-brand-deep: #c0005a;')
        ->toContain('--primary: #f91d7c;')
        ->toContain('--ring: #ff006e;')
        ->toContain('--sidebar-primary: #f91d7c;');
});

test('react views use the shared theme instead of duplicating the legacy pink colors', function () {
    $reactSource = collect(File::allFiles(resource_path('js')))
        ->filter(fn (SplFileInfo $file): bool => in_array($file->getExtension(), ['ts', 'tsx'], true))
        ->map(fn (SplFileInfo $file): string => strtolower($file->getContents()))
        ->implode("\n");

    expect($reactSource)
        ->not->toContain('#f91d7c')
        ->not->toContain('#e01a70');
});
