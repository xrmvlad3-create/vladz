<?php

namespace Database\Seeders;

use App\Models\MedicalCondition;
use App\Models\TreatmentProtocol;
use App\Models\User;
use Illuminate\Database\Seeder;

class TreatmentProtocolSeeder extends Seeder
{
    public function run(): void
    {
        $creator = User::whereHas('roles', fn($q) => $q->where('name', 'professor'))->first()
            ?? User::first();

        $condition = MedicalCondition::where('name', 'Infarct miocardic acut (IMA)')->first();
        if ($condition) {
            TreatmentProtocol::updateOrCreate(
                ['medical_condition_id' => $condition->id, 'name' => 'Protocol STEMI 2025'],
                [
                    'protocol_type' => 'acute_care',
                    'description' => 'Management integrat STEMI conform ghidurilor ESC 2023.',
                    'treatment_steps' => [
                        'ECG imediat',
                        'Administrare aspirină + P2Y12',
                        'Heparină',
                        'PCI primar < 90 min',
                        'Beta-blocant dacă nu există contraindicații'
                    ],
                    'monitoring_parameters' => ['ECG', 'troponină', 'TA', 'SaO2'],
                    'evidence_level' => 'A',
                    'guidelines_source' => 'ESC 2023',
                    'status' => 'approved',
                    'version' => 1.0,
                    'created_by' => $creator?->id
                ]
            );
        }
    }
}