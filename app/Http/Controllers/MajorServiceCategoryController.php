<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMajorServiceCategoryRequest;
use App\Http\Requests\UpdateMajorServiceCategoryRequest;
use App\Models\MajorServiceCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class MajorServiceCategoryController extends Controller
{
    public function store(StoreMajorServiceCategoryRequest $request): RedirectResponse
    {
        MajorServiceCategory::query()->create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Parent category created successfully.']);

        return back();
    }

    public function update(
        UpdateMajorServiceCategoryRequest $request,
        MajorServiceCategory $majorServiceCategory,
    ): RedirectResponse {
        $majorServiceCategory->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Parent category updated successfully.']);

        return back();
    }

    public function destroy(MajorServiceCategory $majorServiceCategory): RedirectResponse
    {
        Gate::authorize('delete', $majorServiceCategory);

        if ($majorServiceCategory->categories()->exists()) {
            return back()->withErrors([
                'major_service_category' => 'Move or delete its service categories before deleting this parent category.',
            ]);
        }

        $majorServiceCategory->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Parent category deleted successfully.']);

        return back();
    }
}
