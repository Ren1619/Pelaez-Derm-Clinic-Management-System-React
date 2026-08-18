<?php

test('public branch pages load maps only through view map links', function () {
    $root = dirname(__DIR__, 2).DIRECTORY_SEPARATOR;
    $landingPage = file_get_contents($root.'resources/js/pages/welcome.tsx');
    $branchPage = file_get_contents(
        $root.'resources/js/pages/public/branches.tsx',
    );

    expect($landingPage)
        ->not->toContain('BranchLocationMap', 'BranchLocatorMap')
        ->toContain('href={branchesRoute()}')
        ->and($branchPage)
        ->not->toContain('BranchLocationMap', 'BranchLocatorMap')
        ->toContain('href={branch.map_link}', 'target="_blank"');
});

test('the dedicated branch page uses service-style cards without changing the landing cards', function () {
    $root = dirname(__DIR__, 2).DIRECTORY_SEPARATOR;
    $branchPage = file_get_contents(
        $root.'resources/js/pages/public/branches.tsx',
    );
    $servicePage = file_get_contents(
        $root.'resources/js/pages/public/services.tsx',
    );
    $titleComponent = file_get_contents(
        $root.'resources/js/components/public-page-title.tsx',
    );
    $landingPage = file_get_contents($root.'resources/js/pages/welcome.tsx');

    expect($branchPage)
        ->toContain(
            '<PublicPageTitle title={settings.branches_title} />',
            'mx-auto grid w-full max-w-[58rem] min-w-0 grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4',
            'group flex min-w-0 flex-col overflow-hidden rounded-md bg-card',
            'branch.image_url ??',
            'settings.business_logo_url',
        )
        ->and($servicePage)->toContain(
            '<PublicPageTitle title={settings.services_title} />',
        )
        ->and($titleComponent)->toContain(
            'font-sans text-sm font-black tracking-[0.24em] text-amber-700',
            'font-serif text-4xl font-normal tracking-tight',
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
            'className="relative order-1 flex min-h-[calc(100svh-5rem)]',
            'className="relative order-2 flex min-h-[calc(100svh-5rem)]',
            'Years of experience,',
            'className="order-3 flex min-h-[calc(100svh-5rem)]',
            'className="order-4 flex min-h-[calc(100svh-5rem)]',
            'className="relative order-5 overflow-hidden',
            'aspect-[16/7] overflow-hidden bg-muted sm:aspect-[5/1]',
        );
});

test('the landing hero and services use mobile-first responsive layouts', function () {
    $source = file_get_contents(
        dirname(__DIR__, 2).DIRECTORY_SEPARATOR.'resources/js/pages/welcome.tsx',
    );

    expect($source)->toContain(
        'min-h-svh scroll-mt-20 items-center',
        'text-4xl leading-[0.95] font-black',
        'grid max-w-sm grid-cols-1 gap-3 sm:mt-8 sm:flex',
        'grid min-w-0 grid-cols-2 items-start gap-2',
        'md:flex md:justify-center',
        'aspect-square w-full',
        'const previewServices = categoryServices.slice(0, 4)',
        'previewServices.map((service, index)',
        'md:pb-8',
        'mt-4 text-center sm:mt-6',
        'View All Services',
    );

    expect(substr_count(
        $source,
        'group inline-flex items-center gap-3 rounded-full bg-background',
    ))->toBe(2);
});

test('the landing about section follows the responsive editorial layout', function () {
    $source = file_get_contents(
        dirname(__DIR__, 2).DIRECTORY_SEPARATOR.'resources/js/pages/welcome.tsx',
    );

    expect($source)
        ->not->toContain('<HeroStat')
        ->not->toContain('About us', 'About the clinic')
        ->not->toContain(
            'bg-[#fbfaf8]',
            'bg-[#fbf5f7]',
            'pointer-events-none absolute bottom-10 -left-24',
            'pointer-events-none absolute -top-28 right-[-7rem]',
            'size-2 rotate-45 bg-primary',
            'first-letter:float-left',
            'bg-primary/[0.07]',
        )
        ->toMatch(
            '/Years of experience,.*?<figure.*?<picture.*?landing_about_description.*?<dl/s',
        )
        ->toContain(
            'relative order-2 flex min-h-[calc(100svh-5rem)]',
            'overflow-hidden bg-background',
            'relative z-10 mx-auto grid w-full max-w-7xl gap-7 px-4 sm:gap-9 sm:px-6',
            'lg:min-h-[30rem] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]',
            'lg:grid-rows-[auto_auto] lg:content-center lg:items-start',
            'xl:min-h-[33rem]',
            'Years of experience,',
            'devoted to you.',
            'mx-auto w-full max-w-5xl text-center lg:col-span-2',
            'lg:whitespace-nowrap',
            'lg:self-start',
            'text-primary italic lg:mt-2 lg:self-end',
            'aspect-[3/2]',
            'lg:col-start-2 lg:row-start-2 lg:self-start',
            'aspect-[3/2] overflow-hidden bg-background shadow-xl ring-1 ring-foreground/10',
            'flex flex-col gap-10 lg:col-start-1 lg:row-start-2 lg:justify-between lg:self-stretch',
            'lg:text-lg lg:leading-8',
            'grid grid-cols-3 gap-4 text-center',
            'after:mx-auto after:mt-2 after:block after:h-px after:w-6 after:bg-primary/50',
            'value={stats.years_experience}',
            'value={stats.branch_count}',
            'value={stats.service_count}',
        );

    expect(substr_count($source, 'min-h-[calc(100svh-5rem)]'))->toBe(4);
});

test('the landing branch section uses the responsive editorial collage', function () {
    $source = file_get_contents(
        dirname(__DIR__, 2).DIRECTORY_SEPARATOR.'resources/js/pages/welcome.tsx',
    );

    expect($source)->toContain(
        'Find Us',
        'Near You.',
        'settings.landing_branches_image_url',
        "landingBranchesImage ? 'bg-[#f8f8f6]' : 'bg-white'",
        'aspect-[4/5]',
        'lg:grid-cols-12 lg:grid-rows-[auto_1fr_auto]',
        'lg:col-span-4 lg:col-start-1 lg:row-span-2',
        'lg:aspect-[5/8]',
        'branches.map((branch)',
        'grid grid-cols-3 gap-2',
        'lg:col-span-10 lg:col-start-3',
        'aspect-[3/2]',
        'shadow-md shadow-foreground/10',
        'bg-[#f8f8f6] py-12 sm:py-16 lg:py-28 dark:bg-background',
        "branch.image_url ? 'bg-[#f8f8f6]' : 'bg-white'",
        'bottom-0 h-2/3 bg-linear-to-t from-primary/80 via-primary/35 to-transparent',
        'absolute inset-x-3 bottom-2 z-10',
        'text-left text-xs',
        'sm:group-hover:opacity-100',
        'justify-center lg:col-span-10 lg:col-start-3',
        'rounded-full bg-background py-2 pr-2 pl-6',
        'rounded-full bg-primary text-primary-foreground',
        'group-hover:translate-x-0.5',
        'View All Branches',
        'max-w-7xl px-4 sm:px-6 lg:px-8',
    )->not->toContain('<DecorativeGlow');
});

test('the landing contact section uses the responsive overlapping card composition', function () {
    $source = file_get_contents(
        dirname(__DIR__, 2).DIRECTORY_SEPARATOR.'resources/js/pages/welcome.tsx',
    );

    expect($source)
        ->toContain(
            'Connect{\' \'}',
            'With Us',
            'order-4 flex min-h-[calc(100svh-5rem)]',
            'max-w-7xl px-4 sm:px-6 lg:px-8',
            'relative z-10 mt-3 grid gap-3 px-3',
            'md:grid-cols-3 md:items-start',
            'className="-mt-7 min-h-44 sm:min-h-48 md:mt-0 md:-translate-y-8"',
            'className="min-h-28 sm:min-h-32 md:translate-y-3"',
            'className="min-h-44 sm:min-h-48 md:-translate-y-8"',
            'title="Contact Number"',
            'title="Email"',
            'title="Follow Us"',
            'bg-brand-deep px-5 py-4 font-sans text-white',
            'srcSet={aboutDesktopImage}',
            'src={aboutMobileImage}',
            'expandable={contactBranches.length > 2}',
            'expandable={socialBranches.length > 2}',
            "{expanded ? 'Show less' : 'Show more'}",
            'aria-expanded={expanded}',
        )
        ->not->toContain(
            'ChevronDown',
            '<SectionHeader',
            '01 / Direct lines',
            '02 / Private inquiries',
            '03 / Social channels',
            'w-fit font-serif',
            'pb-3 font-serif',
            'Send us a message and our clinic team',
        );
});
