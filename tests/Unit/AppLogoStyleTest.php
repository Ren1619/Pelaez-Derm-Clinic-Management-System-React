<?php

test('custom logos use a transparent background while the fallback keeps its background', function () {
    $source = file_get_contents(
        dirname(__DIR__, 2).DIRECTORY_SEPARATOR.'resources/js/components/app-logo.tsx',
    );

    expect($source)->toMatch(
        "/branding\\.logo_url\\s*\\?\\s*'bg-transparent'\\s*:\\s*'bg-sidebar-primary text-sidebar-primary-foreground'/s",
    );
});
