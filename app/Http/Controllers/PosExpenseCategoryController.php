<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreExpenseCategoryRequest;
use App\Models\ExpenseCategory;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class PosExpenseCategoryController extends Controller
{
    public function __invoke(StoreExpenseCategoryRequest $request): RedirectResponse
    {
        ExpenseCategory::create($request->validated());
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Expense category added successfully.']);

        return back();
    }
}
