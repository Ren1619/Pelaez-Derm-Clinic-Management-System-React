<?php

test('the appointments page has balanced data table layout tags', function () {
    $source = file_get_contents(
        dirname(__DIR__, 2).DIRECTORY_SEPARATOR.'resources/js/pages/appointments/index.tsx',
    );

    preg_match_all('/<DataTableLayout(?:\s|>)/', $source, $openingTags);
    preg_match_all('/<\/DataTableLayout>/', $source, $closingTags);

    expect($openingTags[0])
        ->toHaveCount(1)
        ->and($closingTags[0])->toHaveCount(1);
});
