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

        // STEMI
        if ($condition = MedicalCondition::where('name', 'Infarct miocardic acut (IMA)')->first()) {
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

        // Pneumonie comunitară
        if ($condition = MedicalCondition::where('name', 'Pneumonie comunitară')->first()) {
            TreatmentProtocol::updateOrCreate(
                ['medical_condition_id' => $condition->id, 'name' => 'Protocol CAP adult 2025'],
                [
                    'protocol_type' => 'acute_care',
                    'description' => 'Antibioterapie empirică conform severității (IDSA/ATS).',
                    'treatment_steps' => [
                        'Evaluare severitate (CRB-65/PSI)',
                        'Amoxicilină/clavulanat ± macrolid (ambulator)',
                        'Ceftriaxonă + macrolid sau monoterapie cu fluorochinolonă (spital)',
                        'Oxigenoterapie titrat',
                        'Reevaluare la 48-72h'
                    ],
                    'monitoring_parameters' => ['SaO2', 'CRP', 'hemoculturi (forme severe)'],
                    'evidence_level' => 'A',
                    'guidelines_source' => 'IDSA/ATS 2019',
                    'status' => 'approved',
                    'version' => 1.0,
                    'created_by' => $creator?->id
                ]
            );
        }

        // Diabet zaharat tip 2
        if ($condition = MedicalCondition::where('name', 'Diabet zaharat tip 2')->first()) {
            TreatmentProtocol::updateOrCreate(
                ['medical_condition_id' => $condition->id, 'name' => 'Algoritm DZ tip 2 2025'],
                [
                    'protocol_type' => 'chronic_care',
                    'description' => 'Algoritm terapeutic bazat pe profilul CV/renal.',
                    'treatment_steps' => [
                        'Modificări stil de viață',
                        'Metformin dacă nu este contraindicat',
                        'GLP-1 RA la risc CV înalt/obezitate',
                        'SGLT2 la BCR/IC',
                        'Intensificare treptată conform HbA1c'
                    ],
                    'monitoring_parameters' => ['HbA1c', 'eGFR', 'TA', 'lipide'],
                    'evidence_level' => 'A',
                    'guidelines_source' => 'ADA 2025',
                    'status' => 'approved',
                    'version' => 1.0,
                    'created_by' => $creator?->id
                ]
            );
        }

        // HTA esențială
        if ($condition = MedicalCondition::where('name', 'Hipertensiune arterială esențială')->first()) {
            TreatmentProtocol::updateOrCreate(
                ['medical_condition_id' => $condition->id, 'name' => 'Protocol HTA 2025'],
                [
                    'protocol_type' => 'chronic_care',
                    'description' => 'Tratament pas-cu-pas pentru controlul TA.',
                    'treatment_steps' => [
                        'Măsuri non-farmacologice (DASH, sare <5g/zi)',
                        'Monoterapie: IECA/ARA/CCB/diuretic',
                        'Combinații fixe în doze mici',
                        'Adăugare MRA la rezistență',
                        'Screening pentru cauze secundare'
                    ],
                    'monitoring_parameters' => ['TA domiciliu', 'K+', 'creatinină'],
                    'evidence_level' => 'A',
                    'guidelines_source' => 'ESC/ESH 2023',
                    'status' => 'approved',
                    'version' => 1.0,
                    'created_by' => $creator?->id
                ]
            );
        }

        // AVC ischemic
        if ($condition = MedicalCondition::where('name', 'Accident vascular cerebral ischemic')->first()) {
            TreatmentProtocol::updateOrCreate(
                ['medical_condition_id' => $condition->id, 'name' => 'Protocol AVC ischemic 2025'],
                [
                    'protocol_type' => 'acute_care',
                    'description' => 'Reperfuzie timpurie și management intensiv.',
                    'treatment_steps' => [
                        'CT fără contrast în <20 minute',
                        'tPA dacă eligibil',
                        'Trombectomie mecanică în ocluzii mari',
                        'Control TA, glicemie',
                        'Prevenție secundară precoce'
                    ],
                    'monitoring_parameters' => ['TA', 'glucoză', 'neuro-monitorizare'],
                    'evidence_level' => 'A',
                    'guidelines_source' => 'ESO 2024',
                    'status' => 'approved',
                    'version' => 1.0,
                    'created_by' => $creator?->id
                ]
            );
        }

        // Exacerbare acută BPOC
        if ($condition = MedicalCondition::where('name', 'Exacerbare acută BPOC')->first()) {
            TreatmentProtocol::updateOrCreate(
                ['medical_condition_id' => $condition->id, 'name' => 'Protocol AECOPD 2025'],
                [
                    'protocol_type' => 'acute_care',
                    'description' => 'Tratament al exacerbării acute conform GOLD.',
                    'treatment_steps' => [
                        'SABA/SAMA nebulizat',
                        'Prednison 40 mg/zi 5 zile',
                        'Antibiotic dacă spută purulentă',
                        'Titrare O2 la SaO2 88-92%',
                        'NIV dacă acidoză/hipercapnie'
                    ],
                    'monitoring_parameters' => ['SaO2', 'gazometrie', 'semne clinice'],
                    'evidence_level' => 'A',
                    'guidelines_source' => 'GOLD 2024',
                    'status' => 'approved',
                    'version' => 1.0,
                    'created_by' => $creator?->id
                ]
            );
        }
    }
}