<?php

test('public branch pages load maps only through view map links', function () {
    $root = dirname(__DIR__, 2).DIRECTORY_SEPARATOR;
    $pages = [
        $root.'resources/js/pages/welcome.tsx',
        $root.'resources/js/pages/public/branches.tsx',
    ];

    foreach ($pages as $page) {
        $source = file_get_contents($page);

        expect($source)
            ->not->toContain('BranchLocationMap')
            ->and($source)->toContain('href={branch.map_link}')
            ->and($source)->toContain('target="_blank"');
    }
});

test('the dedicated branch page uses image and detail columns without changing the landing cards', function () {
    $root = dirname(__DIR__, 2).DIRECTORY_SEPARATOR;
    $branchPage = file_get_contents(
        $root.'resources/js/pages/public/branches.tsx',
    );
    $landingPage = file_get_contents($root.'resources/js/pages/welcome.tsx');

    expect($branchPage)
        ->toContain(
            'lg:grid-cols-2',
            'sm:grid-cols-[minmax(0,48%)_minmax(0,52%)]',
            'sm:[clip-path:ellipse(92%_115%_at_0%_50%)]',
            'branch.image_url ??',
            'settings.business_logo_url',
        )
        ->and($landingPage)->not->toContain(
            'sm:[clip-path:ellipse(92%_115%_at_0%_50%)]',
        );
});

test('the landing page uses the requested luxury section sequence', function () {
    $source = file_get_contents(
        dirname(__DIR__, 2).DIRECTORY_SEPARATOR.'resources/js/pages/welcome.tsx',
    );

    expect($source)
        ->toContain(
            'className="relative order-1 scroll-mt-20',
            'className="order-2 scroll-mt-20',
            'The art of',
            'className="relative order-3 scroll-mt-20',
            'className="order-4 scroll-mt-20',
            'className="relative order-5 overflow-hidden',
            'rounded-2xl border border-primary/15 bg-card',
        );
});
