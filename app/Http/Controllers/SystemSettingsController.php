<?php

namespace App\Http\Controllers;

use App\Actions\UpdateSystemSettings;
use App\Http\Requests\UpdateSystemSettingsRequest;
use App\Models\SystemSetting;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SystemSettingsController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('system-settings/index', [
            'settings' => SystemSetting::current()->toPublicArray(),
        ]);
    }

    public function update(
        UpdateSystemSettingsRequest $request,
        string $section,
        UpdateSystemSettings $updateSystemSettings,
    ): RedirectResponse {
        $updateSystemSettings->handle($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => ucfirst($section).' settings saved successfully.',
        ]);

        return back();
    }
}
