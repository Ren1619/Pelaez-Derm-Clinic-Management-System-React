<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreExpenseRequest;
use App\Models\Branch;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class PosExpenseController extends Controller
{
    public function store(StoreExpenseRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $branch = Branch::query()->findOrFail((int) $validated['branch_ID']);
        $category = ExpenseCategory::query()->findOrFail((int) $validated['category_ID']);

        Expense::create([
            ...$validated,
            'branch_name' => $branch->branch_name,
            'category_name' => $category->category_name,
            'account_ID' => $request->user()?->getAuthIdentifier(),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Expense added successfully.']);

        return back();
    }

    public function destroy(Expense $expense): RedirectResponse
    {
        Gate::authorize('delete', $expense);
        $expense->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Expense removed successfully.']);

        return back();
    }
}
