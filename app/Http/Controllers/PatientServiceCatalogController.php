<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Patient;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PatientServiceCatalogController extends Controller
{
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'category_ID' => ['nullable', 'integer', Rule::exists('categories', 'category_ID')],
        ]);
        $patient = $request->user('patient');

        abort_unless($patient instanceof Patient, 401);

        $services = Service::query()
            ->select(['service_ID', 'category_ID', 'name', 'description', 'service_img'])
            ->with('category:category_ID,category_name')
            ->whereHas('category', fn ($query) => $query->where('category_type', 'Service'))
            ->when($validated['category_ID'] ?? null, fn ($query, int $categoryId) => $query->where('category_ID', $categoryId))
            ->when($validated['search'] ?? null, function ($query, string $search): void {
                $query->where(function ($nested) use ($search): void {
                    $nested->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->get()
            ->map(fn (Service $service): array => [
                'id' => $service->service_ID,
                'name' => $service->name,
                'description' => $service->description,
                'category' => $service->category?->category_name,
                'image_url' => $service->service_img === null ? null : Storage::disk('public')->url($service->service_img),
            ])
            ->all();

        return Inertia::render('patient/services/index', [
            'patient' => ['PID' => $patient->PID, 'name' => $patient->full_name, 'email' => $patient->email],
            'services' => $services,
            'categories' => Category::query()
                ->where('category_type', 'Service')
                ->orderBy('category_name')
                ->get(['category_ID', 'category_name']),
            'filters' => [
                'search' => $validated['search'] ?? '',
                'category_ID' => isset($validated['category_ID']) ? (int) $validated['category_ID'] : null,
            ],
        ]);
    }
}
