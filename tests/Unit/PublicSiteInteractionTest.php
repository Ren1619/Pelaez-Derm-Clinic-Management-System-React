<?php

test('landing sections use distinct replayable item animations', function () {
    $root = dirname(__DIR__, 2).DIRECTORY_SEPARATOR;
    $landingPage = file_get_contents($root.'resources/js/pages/welcome.tsx');
    $package = json_decode(
        file_get_contents($root.'package.json'),
        true,
        flags: JSON_THROW_ON_ERROR,
    );

    expect($package['dependencies'])->toHaveKey('framer-motion')
        ->and($landingPage)
        ->toContain(
            '<MotionConfig reducedMotion="user">',
            '<LazyMotion features={domAnimation} strict>',
            '<m.section',
            'staggerChildren: 0.06',
            'variants={heroItemVariants}',
            'variants={servicesHeadingVariants}',
            'variants={servicesNavigationVariants}',
            'variants={serviceCardVariants}',
            'variants={aboutHeadingVariants}',
            'variants={aboutImageVariants}',
            'variants={aboutCopyVariants}',
            'variants={branchesHeadingVariants}',
            'variants={branchesImageVariants}',
            'variants={branchCardVariants}',
            'variants={contactHeadingVariants}',
            'variants={contactCardVariants}',
            'variants={ctaTitleVariants}',
            'variants={ctaButtonVariants}',
            'initial="hidden"',
            'whileInView="visible"',
            'viewport={{ once: false, amount: 0.45 }}',
        )
        ->not->toContain('IntersectionObserver', 'data-reveal');

    expect(substr_count($landingPage, '<RevealSection'))->toBe(6);
});

test('landing service tabs transition reliably and images use loading hints', function () {
    $landingPage = file_get_contents(
        dirname(__DIR__, 2).DIRECTORY_SEPARATOR.'resources/js/pages/welcome.tsx',
    );

    expect($landingPage)->toContain(
        '<AnimatePresence initial={false} mode="sync">',
        "key={activeServiceCategory ?? 'available-soon'}",
        'variants={serviceListVariants}',
        'animate="visible"',
        'exit="exit"',
        'aria-live="polite"',
        'rel="preload"',
        'fetchPriority="high"',
        'loading="eager"',
        'loading="lazy"',
        'decoding="async"',
    )->not->toContain(
        'import { AnimatePresence, motion, MotionConfig }',
        'rotate: -2',
    );
});

test('public navigation and scrollbars reflect the active public destination', function () {
    $root = dirname(__DIR__, 2).DIRECTORY_SEPARATOR;
    $layout = file_get_contents(
        $root.'resources/js/components/public-site-layout.tsx',
    );
    $styles = file_get_contents($root.'resources/css/app.css');

    expect($layout)
        ->toContain(
            'currentPath === servicesRoute().url',
            'currentPath === branchesRoute().url',
            "activeSection === 'services'",
            "activeSection === 'branches'",
            "setActiveSection('home')",
            "setActiveSection('about')",
            "setActiveSection('contact')",
            "aria-current={active ? 'page' : undefined}",
            "classList.add('public-site-scrollbar')",
        )
        ->and($styles)->toContain(
            'html.public-site-scrollbar',
            'scrollbar-color: var(--primary) var(--background)',
            'background: var(--primary)',
        );
});
