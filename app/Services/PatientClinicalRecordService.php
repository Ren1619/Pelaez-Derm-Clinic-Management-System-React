<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Patient;
use App\Models\PatientVisit;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Service;
use App\Models\StaffAccount;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;

class PatientClinicalRecordService
{
    /** @return array{allergies: array<int, array<string, int|string|null>>, medical_conditions: array<int, array<string, int|string|null>>, medications: array<int, array<string, int|string|null>>} */
    public function medicalSummary(Patient $patient): array
    {
        $patient->load([
            'allergies' => fn ($query) => $query->orderBy('allergy'),
            'medicalConditions' => fn ($query) => $query->orderBy('condition'),
            'medications' => fn ($query) => $query->orderBy('medication'),
        ]);

        return [
            'allergies' => $patient->allergies->map(fn ($allergy): array => [
                'allergy_ID' => $allergy->allergy_ID,
                'allergy' => $allergy->allergy,
                'note' => $allergy->note,
            ])->all(),
            'medical_conditions' => $patient->medicalConditions->map(fn ($condition): array => [
                'medical_condition_ID' => $condition->medical_condition_ID,
                'condition' => $condition->condition,
                'note' => $condition->note,
            ])->all(),
            'medications' => $patient->medications->map(fn ($medication): array => [
                'medication_ID' => $medication->medication_ID,
                'medication' => $medication->medication,
                'dosage' => $medication->dosage,
                'frequency' => $medication->frequency,
                'duration' => $medication->duration,
                'note' => $medication->note,
            ])->all(),
        ];
    }

    /** @return array<string, mixed>|null */
    public function latestVisit(Patient $patient): ?array
    {
        $visit = $this->visitQuery($patient)
            ->latest('visited_at')
            ->first();

        return $visit === null ? null : $this->serializeVisit($visit);
    }

    /** @return LengthAwarePaginator<int, array<string, mixed>> */
    public function visits(Patient $patient, int $perPage, ?string $dateFrom = null, ?string $dateTo = null): LengthAwarePaginator
    {
        return $this->visitQuery($patient)
            ->when($dateFrom, fn (Builder $query, string $date): Builder => $query->whereDate('visited_at', '>=', $date))
            ->when($dateTo, fn (Builder $query, string $date): Builder => $query->whereDate('visited_at', '<=', $date))
            ->latest('visited_at')
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (PatientVisit $visit): array => $this->serializeVisit($visit));
    }

    /** @return array{branches: array<int, array{id: int, name: string}>, doctors: array<int, array{id: int, name: string, branch_ID: int|null}>, services: array<int, array{id: int, name: string}>, products: array<int, array{id: int, name: string, branch_ID: int, price: string, quantity: int}>} */
    public function options(): array
    {
        return [
            'branches' => Branch::query()->orderBy('branch_name')->get()->map(fn (Branch $branch): array => [
                'id' => $branch->branch_ID,
                'name' => $branch->branch_name,
            ])->all(),
            'doctors' => StaffAccount::query()
                ->where('is_active', true)
                ->whereHas('role', fn ($query) => $query->where('role_name', 'doctor'))
                ->orderBy('last_name')
                ->get()
                ->map(fn (StaffAccount $doctor): array => [
                    'id' => $doctor->account_ID,
                    'name' => $doctor->full_name,
                    'branch_ID' => $doctor->branch_ID,
                ])->all(),
            'services' => Service::query()->orderBy('name')->get()->map(fn (Service $service): array => [
                'id' => $service->service_ID,
                'name' => $service->name,
            ])->all(),
            'products' => Product::query()->orderBy('name')->get()->map(fn (Product $product): array => [
                'id' => $product->product_ID,
                'name' => $product->name,
                'branch_ID' => $product->branch_ID,
                'price' => $product->price,
                'quantity' => $product->quantity,
            ])->all(),
        ];
    }

    /** @return array<int, array<string, mixed>> */
    public function posTransactions(Patient $patient): array
    {
        return Sale::query()
            ->whereBelongsTo($patient, 'patient')
            ->where('finalized', true)
            ->with(['productItems', 'serviceItems', 'returns'])
            ->latest('created_at')
            ->limit(100)
            ->get()
            ->map(fn (Sale $sale): array => [
                'sale_ID' => $sale->sale_ID,
                'invoice_number' => $sale->invoice_number,
                'branch_name' => $sale->branch_name,
                'created_at' => $sale->created_at?->toISOString(),
                'total_cost' => $sale->total_cost,
                'total_returned' => number_format((float) $sale->returns->sum('return_amount'), 2, '.', ''),
                'is_voided' => $sale->is_voided,
                'products' => $sale->productItems->map(fn ($item): array => [
                    'item_ID' => $item->sale_product_item_ID,
                    'name' => $item->product_name,
                    'quantity' => $item->quantity,
                    'subtotal' => $item->line_total,
                ])->all(),
                'services' => $sale->serviceItems->map(fn ($item): array => [
                    'item_ID' => $item->sale_service_item_ID,
                    'name' => $item->service_name,
                    'quantity' => $item->quantity,
                    'subtotal' => $item->line_total,
                ])->all(),
            ])->all();
    }

    /** @return Builder<PatientVisit> */
    private function visitQuery(Patient $patient): Builder
    {
        return PatientVisit::query()
            ->whereBelongsTo($patient, 'patient')
            ->with([
                'branch:branch_ID,branch_name',
                'doctor:account_ID,first_name,middle_name,last_name',
                'services:visit_service_ID,visit_ID,service_ID,service_name,quantity,note',
                'products:visit_product_ID,visit_ID,product_ID,product_name,quantity,unit_price,note',
                'diagnoses:diagnosis_ID,visit_ID,diagnosis,note',
                'prescriptions:prescription_ID,visit_ID,prescription,dosage,frequency,duration,note',
            ]);
    }

    /** @return array<string, mixed> */
    private function serializeVisit(PatientVisit $visit): array
    {
        return [
            'visit_ID' => $visit->visit_ID,
            'branch' => [
                'branch_ID' => $visit->branch_ID,
                'branch_name' => $visit->branch_ID === null
                    ? $visit->branch_name
                    : $visit->branch->branch_name,
            ],
            'doctor' => [
                'account_ID' => $visit->doctor_account_ID,
                'name' => $visit->doctor_account_ID === null
                    ? $visit->doctor_name
                    : $visit->doctor->full_name,
            ],
            'visited_at' => $visit->visited_at->toISOString(),
            'blood_pressure' => $visit->blood_pressure,
            'weight' => $visit->weight,
            'height' => $visit->height,
            'status' => $visit->status,
            'finalized_at' => $visit->finalized_at?->toISOString(),
            'services' => $visit->services->map(fn ($service): array => [
                'visit_service_ID' => $service->visit_service_ID,
                'service_ID' => $service->service_ID,
                'service_name' => $service->service_name,
                'quantity' => $service->quantity,
                'note' => $service->note,
            ])->all(),
            'products' => $visit->products->map(fn ($product): array => [
                'visit_product_ID' => $product->visit_product_ID,
                'product_ID' => $product->product_ID,
                'product_name' => $product->product_name,
                'quantity' => $product->quantity,
                'unit_price' => $product->unit_price,
                'note' => $product->note,
            ])->all(),
            'diagnoses' => $visit->diagnoses->map(fn ($diagnosis): array => [
                'diagnosis_ID' => $diagnosis->diagnosis_ID,
                'diagnosis' => $diagnosis->diagnosis,
                'note' => $diagnosis->note,
            ])->all(),
            'prescriptions' => $visit->prescriptions->map(fn ($prescription): array => [
                'prescription_ID' => $prescription->prescription_ID,
                'prescription' => $prescription->prescription,
                'dosage' => $prescription->dosage,
                'frequency' => $prescription->frequency,
                'duration' => $prescription->duration,
                'note' => $prescription->note,
            ])->all(),
        ];
    }
}
