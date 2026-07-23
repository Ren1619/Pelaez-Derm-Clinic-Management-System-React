<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Patient;
use App\Models\PatientVisit;
use App\Models\Product;
use App\Models\Service;
use App\Models\StaffAccount;
use Carbon\CarbonImmutable;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Database\Seeder;

class PatientClinicalRecordSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $patients = Patient::query()->where('email', 'like', '%@pelaez.test')->orderBy('PID')->get();

        if ($patients->isEmpty()) {
            return;
        }

        $this->seedMedicalSummaries($patients);
        $this->seedVisits($patients);
    }

    /** @param EloquentCollection<int, Patient> $patients */
    private function seedMedicalSummaries(EloquentCollection $patients): void
    {
        $allergies = [
            ['Penicillin', 'Reported skin rash after taking penicillin.'],
            ['Fragrance', 'May trigger contact dermatitis.'],
            ['Nickel', 'Local reaction to metal jewelry.'],
            ['None reported', 'Patient reports no known allergies.'],
        ];
        $conditions = [
            ['Acne Vulgaris', 'Recurring facial acne under active management.'],
            ['Atopic Dermatitis', 'Intermittent dry and irritated skin.'],
            ['Melasma', 'Facial hyperpigmentation monitored during treatment.'],
            ['Sensitive Skin', 'History of irritation from strong topical products.'],
        ];
        $medications = [
            ['Doxycycline', '100 mg', 'Once daily', '8 weeks', 'Take with food and water.'],
            ['Hydrocortisone Cream 1%', 'Thin layer', 'Twice daily', 'As needed', 'Apply only to affected areas.'],
            ['Tranexamic Acid', '250 mg', 'Twice daily', '3 months', 'For pigmentation management.'],
            ['Cetirizine', '10 mg', 'Once daily', 'As needed', 'For allergy-related itching.'],
        ];

        foreach ($patients as $index => $patient) {
            [$allergy, $allergyNote] = $allergies[$index % count($allergies)];
            [$condition, $conditionNote] = $conditions[$index % count($conditions)];
            [$medication, $dosage, $frequency, $duration, $medicationNote] = $medications[$index % count($medications)];

            $patient->allergies()->updateOrCreate(['allergy' => $allergy], ['note' => $allergyNote]);
            $patient->medicalConditions()->updateOrCreate(['condition' => $condition], ['note' => $conditionNote]);
            $patient->medications()->updateOrCreate(
                ['medication' => $medication],
                compact('dosage', 'frequency', 'duration') + ['note' => $medicationNote],
            );
        }
    }

    /** @param EloquentCollection<int, Patient> $patients */
    private function seedVisits(EloquentCollection $patients): void
    {
        $branches = Branch::query()->orderBy('branch_ID')->get();
        $services = Service::query()->orderBy('service_ID')->get();
        $products = Product::query()->orderBy('product_ID')->get();
        $doctors = StaffAccount::query()
            ->whereHas('role', fn ($query) => $query->where('role_name', 'doctor'))
            ->get()
            ->keyBy('branch_ID');
        $diagnoses = [
            ['Acne Vulgaris', 'Comedonal and inflammatory lesions noted during examination.'],
            ['Atopic Dermatitis', 'Dry, eczematous patches with mild inflammation.'],
            ['Post-inflammatory Hyperpigmentation', 'Residual pigmentation following resolved inflammation.'],
            ['Melasma', 'Symmetric facial pigmentation requiring sun protection.'],
            ['Benign Skin Lesion', 'No suspicious features observed during assessment.'],
            ['Skin Rejuvenation Follow-up', 'Expected response after cosmetic procedure.'],
        ];

        if ($branches->isEmpty() || $services->isEmpty()) {
            return;
        }

        for ($monthOffset = 0; $monthOffset < 12; $monthOffset++) {
            foreach ($branches as $branchIndex => $branch) {
                $recordIndex = ($monthOffset * $branches->count()) + $branchIndex;
                $patient = $patients[$recordIndex % $patients->count()];
                $service = $services[$recordIndex % $services->count()];
                $doctor = $doctors->get($branch->branch_ID);
                $visitedAt = CarbonImmutable::now()
                    ->subMonthsNoOverflow($monthOffset)
                    ->startOfMonth()
                    ->addDays(4 + ($branchIndex * 7))
                    ->setTime(9 + ($recordIndex % 6), 0);

                $visit = PatientVisit::query()->updateOrCreate(
                    ['PID' => $patient->PID, 'visited_at' => $visitedAt],
                    [
                        'branch_ID' => $branch->branch_ID,
                        'doctor_account_ID' => $doctor?->account_ID,
                        'branch_name' => $branch->branch_name,
                        'doctor_name' => $doctor?->full_name,
                        'blood_pressure' => (110 + ($recordIndex % 16)).'/'.(70 + ($recordIndex % 11)),
                        'weight' => 52 + ($recordIndex % 28),
                        'height' => 152 + ($recordIndex % 27),
                        'status' => 'completed',
                        'finalized_at' => $visitedAt->addHours(2),
                    ],
                );

                $visit->services()->updateOrCreate(
                    ['service_ID' => $service->service_ID],
                    [
                        'service_name' => $service->name,
                        'quantity' => 1 + ($recordIndex % 2),
                        'note' => 'Completed as part of the seeded longitudinal care record.',
                    ],
                );

                [$diagnosis, $diagnosisNote] = $diagnoses[$recordIndex % count($diagnoses)];
                $visit->diagnoses()->updateOrCreate(['diagnosis' => $diagnosis], ['note' => $diagnosisNote]);

                if ($recordIndex % 2 === 0) {
                    $visit->prescriptions()->updateOrCreate(
                        ['prescription' => 'Tretinoin 0.025% Cream'],
                        [
                            'dosage' => 'Pea-sized amount',
                            'frequency' => 'Once nightly',
                            'duration' => '8 weeks',
                            'note' => 'Apply to dry skin and use sunscreen daily.',
                        ],
                    );
                }

                $product = $products->firstWhere('branch_ID', $branch->branch_ID);
                if ($product !== null && $recordIndex % 3 === 0) {
                    $visit->products()->updateOrCreate(
                        ['product_ID' => $product->product_ID],
                        [
                            'product_name' => $product->name,
                            'quantity' => 1,
                            'unit_price' => $product->price,
                            'note' => 'Recommended for the patient home-care routine.',
                        ],
                    );
                }
            }
        }
    }
}
