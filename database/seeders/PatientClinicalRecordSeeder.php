<?php

namespace Database\Seeders;

use App\Models\Patient;
use App\Models\PatientVisit;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class PatientClinicalRecordSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->seedMedicalSummary();
        $this->seedVisits();
    }

    private function seedMedicalSummary(): void
    {
        $records = [
            1 => [
                'allergies' => [['Penicillin', 'Causes rash and difficulty breathing.']],
                'conditions' => [['Acne Vulgaris', 'Moderate acne on forehead and chin. Under treatment.']],
                'medications' => [['Doxycycline', '100mg', 'Once daily', '3 months', 'Taken for acne management.']],
            ],
            2 => [
                'allergies' => [['Fragrance / Perfume', 'Triggers contact dermatitis.']],
                'conditions' => [['Atopic Dermatitis', 'Chronic eczema, flares during dry season.']],
                'medications' => [['Hydrocortisone Cream 1%', 'Thin layer', 'Twice daily', 'As needed', 'Applied to affected eczema areas.']],
            ],
            3 => [
                'allergies' => [['Nickel', 'Allergic reaction from metal jewelry.']],
                'conditions' => [],
                'medications' => [],
            ],
            4 => [
                'allergies' => [],
                'conditions' => [['Melasma', 'Hyperpigmentation on cheeks and upper lip.']],
                'medications' => [['Tranexamic Acid', '250mg', 'Twice daily', '6 months', 'For melasma management.']],
            ],
        ];

        foreach ($records as $patientId => $record) {
            $patient = Patient::query()->findOrFail($patientId);

            foreach ($record['allergies'] as [$allergy, $note]) {
                $patient->allergies()->updateOrCreate(['allergy' => $allergy], ['note' => $note]);
            }

            foreach ($record['conditions'] as [$condition, $note]) {
                $patient->medicalConditions()->updateOrCreate(['condition' => $condition], ['note' => $note]);
            }

            foreach ($record['medications'] as [$medication, $dosage, $frequency, $duration, $note]) {
                $patient->medications()->updateOrCreate(
                    ['medication' => $medication],
                    compact('dosage', 'frequency', 'duration', 'note'),
                );
            }
        }
    }

    private function seedVisits(): void
    {
        $visits = [
            [
                'patient_id' => 1,
                'branch_id' => 1,
                'branch_name' => 'Valencia City',
                'doctor_name' => 'Dr. Rosa Pelaez',
                'visited_at' => '2026-02-10 09:00:00',
                'blood_pressure' => '120/80',
                'weight' => 72,
                'height' => 170,
                'services' => [[1, 'Initial Dermatology Consultation', 'Skin assessment and personalized treatment planning.']],
                'products' => [
                    [1, 'CeraVe Moisturizing Cream', 1, 450, 'Recommended to reduce dryness from tretinoin.'],
                    [2, 'Biore UV Aqua Rich SPF50', 1, 380, 'Daily sunscreen while on retinoid therapy.'],
                ],
                'diagnoses' => [['Acne Vulgaris (Moderate)', 'Comedonal and inflammatory acne predominantly on the T-zone.']],
                'prescriptions' => [
                    ['Tretinoin 0.025% Cream', 'Pea-sized amount', 'Once nightly', '3 months', 'Apply to clean, dry skin and use sunscreen daily.'],
                    ['Doxycycline', '100mg', 'Once daily with food', '8 weeks', 'Take with a full glass of water.'],
                ],
            ],
            [
                'patient_id' => 2,
                'branch_id' => 2,
                'branch_name' => 'Malaybalay City',
                'doctor_name' => 'Dr. Rosa Pelaez',
                'visited_at' => '2026-02-12 10:30:00',
                'blood_pressure' => '115/75',
                'weight' => 58,
                'height' => 162,
                'services' => [[2, 'Follow-up Consultation', 'Treatment progress review and care-plan adjustment.']],
                'products' => [[4, 'CeraVe Moisturizing Cream', 1, 450, 'Emollient for skin-barrier support.']],
                'diagnoses' => [['Atopic Dermatitis (Mild-Moderate)', 'Eczematous patches on bilateral antecubital fossae.']],
                'prescriptions' => [['Hydrocortisone Cream 1%', 'Thin layer', 'Twice daily', '2 weeks', 'Apply only to affected areas.']],
            ],
            [
                'patient_id' => 3,
                'branch_id' => 1,
                'branch_name' => 'Valencia City',
                'doctor_name' => 'Dr. Rosa Pelaez',
                'visited_at' => '2026-02-18 14:00:00',
                'blood_pressure' => null,
                'weight' => 65,
                'height' => 175,
                'services' => [
                    [5, 'Laser Toning', 'Session 1 of 6 targeting cheeks and forehead pigmentation.'],
                    [3, 'Hydra Facial', 'Deep cleanse and hydration after laser treatment.'],
                ],
                'products' => [],
                'diagnoses' => [['Post-Inflammatory Hyperpigmentation', 'PIH following resolved acne.']],
                'prescriptions' => [],
            ],
        ];

        foreach ($visits as $visitData) {
            $visit = PatientVisit::query()->updateOrCreate(
                ['PID' => $visitData['patient_id'], 'visited_at' => Carbon::parse($visitData['visited_at'])],
                [
                    'branch_ID' => $visitData['branch_id'],
                    'branch_name' => $visitData['branch_name'],
                    'doctor_name' => $visitData['doctor_name'],
                    'blood_pressure' => $visitData['blood_pressure'],
                    'weight' => $visitData['weight'],
                    'height' => $visitData['height'],
                    'status' => 'completed',
                    'finalized_at' => Carbon::parse($visitData['visited_at'])->addHours(2),
                ],
            );

            foreach ($visitData['services'] as [$serviceId, $serviceName, $note]) {
                $visit->services()->updateOrCreate(
                    ['service_name' => $serviceName],
                    ['service_ID' => $serviceId, 'quantity' => 1, 'note' => $note],
                );
            }

            foreach ($visitData['products'] as [$productId, $productName, $quantity, $unitPrice, $note]) {
                $visit->products()->updateOrCreate(
                    ['product_name' => $productName],
                    ['product_ID' => $productId, 'quantity' => $quantity, 'unit_price' => $unitPrice, 'note' => $note],
                );
            }

            foreach ($visitData['diagnoses'] as [$diagnosis, $note]) {
                $visit->diagnoses()->updateOrCreate(['diagnosis' => $diagnosis], ['note' => $note]);
            }

            foreach ($visitData['prescriptions'] as [$prescription, $dosage, $frequency, $duration, $note]) {
                $visit->prescriptions()->updateOrCreate(
                    ['prescription' => $prescription],
                    compact('dosage', 'frequency', 'duration', 'note'),
                );
            }
        }
    }
}
