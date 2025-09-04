<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MedicalConditionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->can('create medical conditions');
    }

    public function rules(): array
    {
        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'min:100'],
            'category' => ['required', 'string', Rule::in(array_keys($this->getCategories()))],
            'severity' => ['required', 'string', Rule::in(['mild', 'moderate', 'severe', 'critical'])],
            'icd_10_code' => ['nullable', 'string', 'max:10', 'regex:/^[A-Z][0-9]{2}(\.[0-9X]{1,4})?$/'],
            'icd_11_code' => ['nullable', 'string', 'max:20'],
            'snomed_ct_code' => ['nullable', 'string', 'max:20', 'numeric'],
            'prevalence' => ['nullable', 'numeric', 'between:0,100'],
            'symptoms' => ['required', 'array', 'min:1'],
            'symptoms.*' => ['required', 'string', 'max:100'],
            'risk_factors' => ['nullable', 'array'],
            'risk_factors.*' => ['string', 'max:200'],
            'complications' => ['nullable', 'array'],
            'complications.*' => ['string', 'max:200'],
            'differential_diagnosis' => ['nullable', 'array'],
            'differential_diagnosis.*' => ['string', 'max:200'],
            'red_flags' => ['nullable', 'array'],
            'red_flags.*' => ['string', 'max:200'],
            'treatment_approach' => ['nullable', 'string'],
            'prognosis' => ['nullable', 'string'],
            'epidemiology' => ['nullable', 'string'],
            'pathophysiology' => ['nullable', 'string'],
            'clinical_features' => ['nullable', 'string'],
            'laboratory_findings' => ['nullable', 'string'],
            'imaging_findings' => ['nullable', 'string'],
            'treatment_protocols' => ['nullable', 'array'],
            'prevention_strategies' => ['nullable', 'array'],
            'patient_education' => ['nullable', 'string'],
            'follow_up_requirements' => ['nullable', 'string'],
            'contraindications' => ['nullable', 'array'],
            'drug_interactions' => ['nullable', 'array'],
            'special_populations' => ['nullable', 'array'],
            'emergency_management' => ['nullable', 'string'],
            'chronic_management' => ['nullable', 'string'],
            'monitoring_parameters' => ['nullable', 'array'],
            'evidence_level' => ['nullable', 'string', Rule::in(['A', 'B', 'C', 'D'])],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:50'],
            'sources' => ['nullable', 'array'],
            'language' => ['nullable', 'string', Rule::in(['ro', 'en'])],
            'review_notes' => ['nullable', 'string', 'max:1000']
        ];

        // Additional rules for updates
        if ($this->isMethod('PUT') || $this->isMethod('PATCH')) {
            $medicalCondition = $this->route('medical_condition');

            // Check uniqueness excluding current record
            $rules['name'][] = Rule::unique('medical_conditions', 'name')
                                 ->ignore($medicalCondition?->id);
        } else {
            // For creation, ensure name uniqueness
            $rules['name'][] = Rule::unique('medical_conditions', 'name');
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Numele afecțiunii medicale este obligatoriu.',
            'name.unique' => 'Această afecțiune medicală există deja în sistem.',
            'description.required' => 'Descrierea este obligatorie.',
            'description.min' => 'Descrierea trebuie să conțină cel puțin 100 de caractere.',
            'category.required' => 'Categoria este obligatorie.',
            'category.in' => 'Categoria selectată nu este validă.',
            'severity.required' => 'Nivelul de severitate este obligatoriu.',
            'severity.in' => 'Nivelul de severitate selectat nu este valid.',
            'icd_10_code.regex' => 'Codul ICD-10 nu respectă formatul standard (ex: A00, B15.1).',
            'snomed_ct_code.numeric' => 'Codul SNOMED CT trebuie să conțină doar cifre.',
            'prevalence.between' => 'Prevalența trebuie să fie între 0 și 100%.',
            'symptoms.required' => 'Este necesară specificarea cel puțin unui simptom.',
            'symptoms.min' => 'Este necesară specificarea cel puțin unui simptom.',
            'symptoms.*.required' => 'Simptomul nu poate fi gol.',
            'symptoms.*.max' => 'Fiecare simptom poate avea maximum 100 de caractere.',
            'evidence_level.in' => 'Nivelul de evidență trebuie să fie A, B, C sau D.',
            'tags.*.max' => 'Fiecare tag poate avea maximum 50 de caractere.',
            'review_notes.max' => 'Notele de revizuire pot avea maximum 1000 de caractere.'
        ];
    }

    public function attributes(): array
    {
        return [
            'name' => 'numele afecțiunii',
            'description' => 'descrierea',
            'category' => 'categoria',
            'severity' => 'severitatea',
            'icd_10_code' => 'codul ICD-10',
            'icd_11_code' => 'codul ICD-11',
            'snomed_ct_code' => 'codul SNOMED CT',
            'prevalence' => 'prevalența',
            'symptoms' => 'simptomele',
            'risk_factors' => 'factorii de risc',
            'complications' => 'complicațiile',
            'differential_diagnosis' => 'diagnosticul diferențial',
            'red_flags' => 'semnele de alarmă',
            'evidence_level' => 'nivelul de evidență',
            'tags' => 'tag-urile',
            'sources' => 'sursele',
            'language' => 'limba',
            'review_notes' => 'notele de revizuire'
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            // Custom validation: at least one medical code should be present
            if (!$this->filled(['icd_10_code', 'icd_11_code', 'snomed_ct_code'])) {
                $validator->errors()->add('medical_codes', 
                    'Este necesar cel puțin un cod medical (ICD-10, ICD-11 sau SNOMED CT).');
            }

            // Custom validation: check symptom quality
            if ($this->filled('symptoms')) {
                $symptoms = $this->input('symptoms', []);
                foreach ($symptoms as $index => $symptom) {
                    if (strlen(trim($symptom)) < 3) {
                        $validator->errors()->add("symptoms.{$index}", 
                            'Simptomul trebuie să conțină cel puțin 3 caractere.');
                    }
                }
            }

            // Custom validation: severity vs complications consistency
            if ($this->input('severity') === 'mild' && 
                count($this->input('complications', [])) > 5) {
                $validator->errors()->add('complications', 
                    'Afecțiunile cu severitate redusă nu ar trebui să aibă multe complicații.');
            }

            // Custom validation: check for inappropriate content
            $inappropriateTerms = ['test', 'fake', 'dummy', 'placeholder'];
            $description = strtolower($this->input('description', ''));

            foreach ($inappropriateTerms as $term) {
                if (str_contains($description, $term)) {
                    $validator->errors()->add('description', 
                        'Descrierea pare să conțină conținut de test. Vă rugăm să furnizați informații medicale reale.');
                    break;
                }
            }
        });
    }

    protected function getCategories(): array
    {
        return [
            'cardiovascular' => 'Cardiovascular',
            'respiratory' => 'Respiratory', 
            'neurological' => 'Neurological',
            'endocrine' => 'Endocrine',
            'gastroenterology' => 'Gastroenterology',
            'nephrology' => 'Nephrology',
            'hematology' => 'Hematology',
            'oncology' => 'Oncology',
            'infectious_diseases' => 'Infectious Diseases',
            'immunology' => 'Immunology',
            'dermatology' => 'Dermatology',
            'psychiatry' => 'Psychiatry',
            'orthopedics' => 'Orthopedics',
            'ophthalmology' => 'Ophthalmology',
            'otorhinolaryngology' => 'Otorhinolaryngology',
            'gynecology' => 'Gynecology',
            'pediatrics' => 'Pediatrics',
            'geriatrics' => 'Geriatrics',
            'emergency_medicine' => 'Emergency Medicine',
            'anesthesiology' => 'Anesthesiology'
        ];
    }
}
