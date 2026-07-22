<?php

test('module links close the mobile sidebar when selected', function () {
    $source = file_get_contents(
        dirname(__DIR__, 2).DIRECTORY_SEPARATOR.'resources/js/components/nav-main.tsx',
    );

    expect($source)
        ->toContain('const { setOpenMobile } = useSidebar();')
        ->and($source)->toMatch(
            '/<Link\s+href=\{item\.href\}\s+prefetch\s+onClick=\{\(\) => setOpenMobile\(false\)\}/s',
        );
});
