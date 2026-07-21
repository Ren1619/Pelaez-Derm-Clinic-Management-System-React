<?php

namespace App\Http\Controllers;

use App\Http\Requests\SavePatientVisitProductRequest;
use App\Models\Patient;
use App\Models\PatientVisit;
use App\Models\PatientVisitProduct;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class PatientVisitProductController extends Controller
{
    public function store(SavePatientVisitProductRequest $request, Patient $patient, PatientVisit $visit): RedirectResponse
    {
        Gate::authorize('update', $patient);

        DB::transaction(function () use ($request, $visit): void {
            $validated = $request->validated();
            $product = Product::query()->lockForUpdate()->findOrFail($request->integer('product_ID'));
            $quantity = $request->integer('quantity');
            $this->ensureStock($product, $quantity);
            $product->decrement('quantity', $quantity);
            $visit->products()->create([
                ...$validated,
                'product_name' => $product->name,
                'unit_price' => $product->price,
            ]);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Visit product added successfully.']);

        return back();
    }

    public function update(SavePatientVisitProductRequest $request, Patient $patient, PatientVisit $visit, PatientVisitProduct $product): RedirectResponse
    {
        Gate::authorize('update', $patient);

        DB::transaction(function () use ($request, $product): void {
            $validated = $request->validated();
            $selectedProductId = $request->integer('product_ID');
            $quantity = $request->integer('quantity');
            $catalogProducts = Product::query()
                ->whereIn('product_ID', array_filter([$product->product_ID, $selectedProductId]))
                ->orderBy('product_ID')
                ->lockForUpdate()
                ->get()
                ->keyBy('product_ID');
            $selectedProduct = $catalogProducts->get($selectedProductId);

            if ($selectedProduct === null) {
                throw ValidationException::withMessages(['product_ID' => 'The selected product is no longer available.']);
            }

            $availableQuantity = $selectedProduct->quantity
                + ($product->product_ID === $selectedProduct->product_ID ? $product->quantity : 0);
            $this->ensureStock($selectedProduct, $quantity, $availableQuantity);

            if ($product->product_ID !== null) {
                $catalogProducts->get($product->product_ID)?->increment('quantity', $product->quantity);
            }

            $selectedProduct->decrement('quantity', $quantity);
            $product->update([
                ...$validated,
                'product_name' => $selectedProduct->name,
                'unit_price' => $selectedProduct->price,
            ]);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Visit product updated successfully.']);

        return back();
    }

    public function destroy(Patient $patient, PatientVisit $visit, PatientVisitProduct $product): RedirectResponse
    {
        Gate::authorize('update', $patient);

        DB::transaction(function () use ($product): void {
            if ($product->product_ID !== null) {
                Product::query()->lockForUpdate()->find($product->product_ID)?->increment('quantity', $product->quantity);
            }

            $product->delete();
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Visit product deleted successfully.']);

        return back();
    }

    private function ensureStock(Product $product, int $requestedQuantity, ?int $availableQuantity = null): void
    {
        if ($requestedQuantity > ($availableQuantity ?? $product->quantity)) {
            throw ValidationException::withMessages([
                'quantity' => "Only {$product->quantity} unit(s) are currently available.",
            ]);
        }
    }
}
