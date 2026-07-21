<?php

namespace App\Actions;

use App\Models\SystemSetting;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

class UpdateSystemSettings
{
    /** @var array<string, string> */
    private const IMAGE_DIRECTORIES = [
        'business_logo' => 'system-settings/business',
        'landing_hero_image' => 'system-settings/landing/hero',
        'landing_about_image' => 'system-settings/landing/about',
        'services_hero_image' => 'system-settings/services',
        'branches_hero_image' => 'system-settings/branches',
        'privacy_hero_image' => 'system-settings/privacy',
    ];

    /** @param array<string, mixed> $validated */
    public function handle(array $validated): SystemSetting
    {
        $setting = SystemSetting::query()->firstOrNew(['id' => 1]);
        $attributes = collect($validated)
            ->reject(fn (mixed $value, string $key): bool => str_ends_with($key, '_file') || str_starts_with($key, 'remove_'))
            ->all();
        $newPaths = [];
        $oldPaths = [];

        try {
            foreach (self::IMAGE_DIRECTORIES as $field => $directory) {
                $upload = $validated["{$field}_file"] ?? null;
                $shouldRemove = (bool) ($validated["remove_{$field}"] ?? false);

                if ($upload instanceof UploadedFile) {
                    $newPaths[$field] = $upload->store($directory, 'public');
                    $oldPaths[] = $setting->getAttribute($field);
                    $attributes[$field] = $newPaths[$field];
                } elseif ($shouldRemove) {
                    $oldPaths[] = $setting->getAttribute($field);
                    $attributes[$field] = null;
                }
            }

            DB::transaction(function () use ($setting, $attributes): void {
                $setting->fill($attributes);
                $setting->save();
            });
        } catch (Throwable $exception) {
            Storage::disk('public')->delete(array_values($newPaths));

            throw $exception;
        }

        Storage::disk('public')->delete(array_values(array_filter(
            $oldPaths,
            fn (mixed $path): bool => is_string($path) && $path !== '',
        )));

        return $setting->refresh();
    }
}
