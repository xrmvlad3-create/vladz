<?php

namespace Database\Seeders;

use App\Models\MedicalCondition;
use App\Models\User;
use Illuminate\Database\Seeder;

class MedicalConditionSeeder extends Seeder
{
    public function run(): void
    {
        $creator = User::whereHas('roles', fn($q) => $q->where('name', 'professor'))->first()
            ?? User::first();

        $conditions = [
            [
                'name' => 'Infarct miocardic acut (IMA)',
                'description' => 'Necroza miocardică în urma ischemiei prelungite cauzate de obstrucția coronariană.',
                'icd_10_code' => 'I21.9',
                'icd_11_code' => 'BA41',
                'snomed_ct_code' => '22298006',
                'category' => 'cardiovascular',
                'severity' => 'critical',
                'prevalence' => 1.50,
                'symptoms' => ['durere toracică', 'dispnee', 'diaforeză', 'grețuri'],
                'risk_factors' => ['hiperlipidemie', 'hipertensiune', 'fumat', 'diabet'],
                'complications' => ['aritmii', 'insuficiență cardiacă', 'șoc cardiogen'],
                'differential_diagnosis' => ['embolie pulmonară', 'disecție aortică', 'pericardită'],
                'red_flags' => ['durere toracică >20 min', 'instabilitate hemodinamică'],
                'treatment_approach' => 'MONA, reperfuzie timpurie (PCI primar), beta-blocante, statine.',
                'emergency_management' => 'Activare code STEMI, ECG imediat, acces venos, oxigen dacă SaO2<90%.',
                'chronic_management' => 'DAPT 12 luni, statină intensă, IECA/ARB, control factori de risc.',
                'monitoring_parameters' => ['troponină', 'ECG seriat', 'ecocardiografie'],
                'prognosis' => 'Depinde de timpul până la reperfuzie; mortalitate 5-7% spital.',
                'evidence_level' => 'A',
                'tags' => ['cardiologie', 'urgență', 'STEMI', 'NSTEMI'],
                'sources' => [
                    'ESC Guidelines 2023', 'AHA/ACC 2024'
                ],
                'status' => 'published',
                'language' => 'ro'
            ],
            [
                'name' => 'Pneumonie comunitară',
                'description' => 'Infecție acută a parenchimului pulmonar dobândită în comunitate.',
                'icd_10_code' => 'J18.9',
                'icd_11_code' => 'CA40',
                'snomed_ct_code' => '233604007',
                'category' => 'respiratory',
                'severity' => 'moderate',
                'prevalence' => 5.20,
                'symptoms' => ['febră', 'tuse productivă', 'dispnee', 'durere toracică'],
                'risk_factors' => ['vârstă >65', 'BPOC', 'imunosupresie', 'fumat'],
                'complications' => ['sepsis', 'empiem', 'insuficiență respiratorie'],
                'differential_diagnosis' => ['edem pulmonar', 'embolie pulmonară', 'TB'],
                'red_flags' => ['hipoxie', 'confuzie', 'hipotensiune'],
                'treatment_approach' => 'Antibioterapie empirică, hidratare, oxigenoterapie după necesități.',
                'emergency_management' => 'Valoare CRB-65/PSI, decizie spitalizare.',
                'chronic_management' => 'Vaccinare anti-pneumococică/influență, renunțare fumat.',
                'monitoring_parameters' => ['saturație O2', 'CRP', 'hemoculturi în forme severe'],
                'prognosis' => 'Bun în forme ușoare; mortalitate crescută la vârstnici/comorbidități.',
                'evidence_level' => 'A',
                'tags' => ['infectioase', 'antibiotice', 'ghid'],
                'sources' => ['IDSA/ATS 2019', 'ESCMID'],
                'status' => 'published',
                'language' => 'ro'
            ],
            [
                'name' => 'Diabet zaharat tip 2',
                'description' => 'Tulburare metabolică caracterizată prin hiperglicemie cronică din cauza rezistenței la insulină.',
                'icd_10_code' => 'E11',
                'icd_11_code' => '5A11',
                'snomed_ct_code' => '44054006',
                'category' => 'endocrine',
                'severity' => 'moderate',
                'prevalence' => 9.80,
                'symptoms' => ['polidipsie', 'poliurie', 'polifagie', 'oboseală'],
                'risk_factors' => ['obezitate', 'sedentarism', 'istoric familial'],
                'complications' => ['retinopatie', 'nefropatie', 'cardiopatie ischemică'],
                'differential_diagnosis' => ['diabet tip 1', 'MODY', 'Cushing'],
                'red_flags' => ['cetoacidoză', 'hiperosmolaritate'],
                'treatment_approach' => 'Modificări stil de viață, metformin, GLP-1/ SGLT2 în risc CV.',
                'chronic_management' => 'HbA1c la 3-6 luni, control TA/lipide, screening complicații.',
                'monitoring_parameters' => ['HbA1c', 'eGFR', 'microalbuminurie'],
                'prognosis' => 'Depinde de controlul glicemic și comorbidități.',
                'evidence_level' => 'A',
                'tags' => ['metabolism', 'CME'],
                'sources' => ['ADA 2025'],
                'status' => 'published',
                'language' => 'ro'
            ],
            [
                'name' => 'Hipertensiune arterială esențială',
                'description' => 'Creșterea persistentă a tensiunii arteriale fără cauză secundară identificabilă.',
                'icd_10_code' => 'I10',
                'icd_11_code' => 'BA00',
                'snomed_ct_code' => '59621000',
                'category' => 'cardiovascular',
                'severity' => 'moderate',
                'prevalence' => 30.00,
                'symptoms' => ['adesea asimptomatică', 'cefalee', 'amețeli'],
                'risk_factors' => ['vârstă', 'dietă bogată în sare', 'sedentarism'],
                'complications' => ['AVC', 'IMA', 'boală renală cronică'],
                'differential_diagnosis' => ['HTA secundară', 'feocromocitom', 'hiperaldosteronism'],
                'treatment_approach' => 'DASH, reducere sare, IEC/ARA, BCC, diuretice tiazidice.',
                'chronic_management' => 'Monitorizare TA, aderență, modificări stil de viață.',
                'monitoring_parameters' => ['TA domiciliu', 'K/Na', 'funcție renală'],
                'prognosis' => 'Bun cu control adecvat.',
                'evidence_level' => 'A',
                'tags' => ['cardiologie', 'HTA'],
                'sources' => ['ESC/ESH 2023'],
                'status' => 'published',
                'language' => 'ro'
            ],
            [
                'name' => 'Accident vascular cerebral ischemic',
                'description' => 'Deficit neurologic acut datorat ocluziei arteriale cerebrale.',
                'icd_10_code' => 'I63.9',
                'icd_11_code' => '8B11',
                'snomed_ct_code' => '422504002',
                'category' => 'neurological',
                'severity' => 'critical',
                'prevalence' => 2.50,
                'symptoms' => ['hemipareză', 'afazie', 'hemianopsie', 'debut brusc'],
                'risk_factors' => ['FA', 'HTA', 'diabet', 'ateroscleroză'],
                'complications' => ['edem cerebral', 'hemoragie', 'aspirație'],
                'differential_diagnosis' => ['hipoglicemie', 'migrenă', 'crize epileptice'],
                'red_flags' => ['fereastră terapeutică', 'semne de herniere'],
                'treatment_approach' => 'tPA în fereastră, trombectomie mecanică, control TA.',
                'emergency_management' => 'CT fără contrast urgent, scor NIHSS.',
                'chronic_management' => 'Prevenție secundară: antiagregante/anticoagulare, control factori risc.',
                'monitoring_parameters' => ['TA', 'glucoză', 'imagistică repetată dacă necesar'],
                'prognosis' => 'Variabil; depinde de timp și localizare.',
                'evidence_level' => 'A',
                'tags' => ['neurologie', 'urgență'],
                'sources' => ['ESO 2024'],
                'status' => 'published',
                'language' => 'ro'
            ],
        ];

        foreach ($conditions as $data) {
            $data['created_by'] = $creator?->id;
            MedicalCondition::updateOrCreate(
                ['name' => $data['name']],
                $data
            );
        }
    }
}