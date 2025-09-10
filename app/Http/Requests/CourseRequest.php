<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CourseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->can('create courses');
    }

    public function rules(): array
    {
        $language = $this->input('language', 'ro');

        $rules = [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'min:200'],
            'category' => ['required', 'string', Rule::in(array_keys($this->getCategories()))],
            'difficulty_level' => ['required', 'string', Rule::in(['beginner', 'intermediate', 'advanced', 'expert'])],
            'duration_hours' => ['required', 'numeric', 'min:0.5', 'max:200'],
            'max_participants' => ['nullable', 'integer', 'min:1', 'max:10000'],
            'prerequisites' => ['nullable', 'array'],
            'prerequisites.*' => ['string', 'max:200'],
            'learning_objectives' => ['required', 'array', 'min:1'],
            'learning_objectives.*' => ['required', 'string', 'max:300'],
            'course_content' => ['nullable', 'array'],
            'assessment_criteria' => ['nullable', 'array'],
            'certification_type' => ['required', 'string', Rule::in(['completion', 'cme', 'cpe', 'specialty'])],
            'cme_credits' => ['nullable', 'numeric', 'min:0', 'max:50'],
            'cpe_credits' => ['nullable', 'numeric', 'min:0', 'max:50'],
            'price' => ['required', 'numeric', 'min:0', 'max:10000'],
            'currency' => ['required', 'string', Rule::in(['RON', 'EUR', 'USD'])],
            'discount_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'start_date' => ['nullable', 'date', 'after_or_equal:today'],
            'end_date' => ['nullable', 'date', 'after:start_date'],
            'registration_deadline' => ['nullable', 'date', 'before:start_date'],
            'language' => ['required', 'string', Rule::in(['ro', 'en'])],
            'timezone' => ['required', 'string'],
            'is_featured' => ['boolean'],
            'is_free' => ['boolean'],
            'requires_approval' => ['boolean'],
            'completion_rate_threshold' => ['required', 'numeric', 'min:50', 'max:100'],
            'passing_score' => ['required', 'numeric', 'min:0', 'max:100'],
            'max_attempts' => ['required', 'integer', 'min:1', 'max:10'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:50'],
            'target_audience' => ['required', 'array', 'min:1'],
            'target_audience.*' => ['required', 'string', 'max:100'],
            'accreditation_body' => ['nullable', 'string', 'max:200'],
            'accreditation_number' => ['nullable', 'string', 'max:100'],
            'contact_hours' => ['nullable', 'numeric', 'min:0'],
            'practical_hours' => ['nullable', 'numeric', 'min:0'],
            'theory_hours' => ['nullable', 'numeric', 'min:0']
        ];

        // Additional rules for updates
        if ($this->isMethod('PUT') || $this->isMethod('PATCH')) {
            $course = $this->route('course');

            // Uniqueness per language when updating
            $rules['title'][] = Rule::unique('courses', 'title')
                ->where(fn ($q) => $q->where('language', $language))
                ->ignore($course?->id);
        } else {
            // For creation, ensure title uniqueness per language
            $rules['title'][] = Rule::unique('courses', 'title')
                ->where(fn ($q) => $q->where('language', $language));
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Titlul cursului este obligatoriu.',
            'title.unique' => 'Există deja un curs cu acest titlu în limba selectată.',
            'description.required' => 'Descrierea cursului este obligatorie.',
            'description.min' => 'Descrierea trebuie să conțină cel puțin 200 de caractere.',
            'category.required' => 'Categoria cursului este obligatorie.',
            'category.in' => 'Categoria selectată nu este validă.',
            'difficulty_level.required' => 'Nivelul de dificultate este obligatoriu.',
            'difficulty_level.in' => 'Nivelul de dificultate selectat nu este valid.',
            'duration_hours.required' => 'Durata cursului este obligatorie.',
            'duration_hours.min' => 'Durata minimă a cursului este de 0.5 ore.',
            'duration_hours.max' => 'Durata maximă a cursului este de 200 ore.',
            'max_participants.min' => 'Numărul minim de participanți este 1.',
            'max_participants.max' => 'Numărul maxim de participanți nu poate depăși 10.000.',
            'learning_objectives.required' => 'Obiectivele de învățare sunt obligatorii.',
            'learning_objectives.min' => 'Este necesar cel puțin un obiectiv de învățare.',
            'certification_type.required' => 'Tipul de certificare este obligatoriu.',
            'certification_type.in' => 'Tipul de certificare selectat nu este valid.',
            'cme_credits.max' => 'Numărul maxim de credite EMC este 50.',
            'cpe_credits.max' => 'Numărul maxim de credite EPC este 50.',
            'price.required' => 'Prețul cursului este obligatoriu.',
            'price.min' => 'Prețul nu poate fi negativ.',
            'price.max' => 'Prețul maxim este de 10.000.',
            'currency.required' => 'Moneda este obligatorie.',
            'currency.in' => 'Moneda selectată nu este validă.',
            'discount_percentage.max' => 'Reducerea nu poate fi mai mare de 100%.',
            'start_date.after_or_equal' => 'Data de început nu poate fi în trecut.',
            'end_date.after' => 'Data de sfârșit trebuie să fie după data de început.',
            'registration_deadline.before' => 'Termenul de înscriere trebuie să fie înainte de începerea cursului.',
            'language.required' => 'Limba cursului este obligatorie.',
            'completion_rate_threshold.min' => 'Pragul minim de finalizare este 50%.',
            'completion_rate_threshold.max' => 'Pragul maxim de finalizare este 100%.',
            'passing_score.required' => 'Nota de trecere este obligatorie.',
            'passing_score.max' => 'Nota de trecere nu poate fi mai mare de 100.',
            'max_attempts.required' => 'Numărul maxim de încercări este obligatoriu.',
            'max_attempts.min' => 'Este necesară cel puțin o încercare.',
            'max_attempts.max' => 'Numărul maxim de încercări nu poate depăși 10.',
            'target_audience.required' => 'Publicul țintă este obligatoriu.',
            'target_audience.min' => 'Este necesar cel puțin un grup din publicul țintă.'
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            // Custom validation: price vs is_free consistency
            if ($this->boolean('is_free') && $this->input('price', 0) > 0) {
                $validator->errors()->add('price', 
                    'Cursul marcat ca gratuit nu poate avea un preț pozitiv.');
            }

            // Custom validation: CME credits require appropriate certification type
            if ($this->filled('cme_credits') && $this->input('cme_credits') > 0 && 
                $this->input('certification_type') !== 'cme') {
                $validator->errors()->add('certification_type', 
                    'Pentru creditele EMC, tipul de certificare trebuie să fie "cme".');
            }

            // Custom validation: hours consistency
            $totalSpecifiedHours = ($this->input('contact_hours', 0) + 
                                  $this->input('practical_hours', 0) + 
                                  $this->input('theory_hours', 0));

            if ($totalSpecifiedHours > 0 && 
                $totalSpecifiedHours > $this->input('duration_hours', 0) * 1.5) {
                $validator->errors()->add('duration_hours', 
                    'Durata totală pare să fie inconsistentă cu orele specificate.');
            }

            // Custom validation: end date requirements for time-bound courses
            if ($this->filled('start_date') && !$this->filled('end_date') && 
                $this->input('duration_hours', 0) > 40) {
                $validator->errors()->add('end_date', 
                    'Cursurile lungi (>40 ore) cu dată de început necesită și dată de sfârșit.');
            }

            // Custom validation: learning objectives quality
            if ($this->filled('learning_objectives')) {
                $objectives = $this->input('learning_objectives', []);
                foreach ($objectives as $index => $objective) {
                    if (strlen(trim($objective)) < 20) {
                        $validator->errors()->add("learning_objectives.{$index}", 
                            'Fiecare obiectiv de învățare trebuie să fie detaliat (minimum 20 caractere).');
                    }
                }
            }

            // Custom validation: accreditation consistency
            if ($this->filled('accreditation_body') && !$this->filled('accreditation_number')) {
                $validator->errors()->add('accreditation_number', 
                    'Dacă este specificat organismul de acreditare, numărul de acreditare este obligatoriu.');
            }

            // Custom validation: professional course requirements
            if (in_array($this->input('certification_type'), ['cme', 'cpe', 'specialty']) && 
                empty($this->input('prerequisites', []))) {
                $validator->errors()->add('prerequisites', 
                    'Cursurile profesionale ar trebui să aibă prerequisite definite.');
            }
        });
    }

    protected function getCategories(): array
    {
        return [
            'cardiology' => 'Cardiologie',
            'endocrinology' => 'Endocrinologie',
            'gastroenterology' => 'Gastroenterologie',
            'neurology' => 'Neurologie',
            'psychiatry' => 'Psihiatrie',
            'surgery' => 'Chirurgie',
            'pediatrics' => 'Pediatrie',
            'geriatrics' => 'Geriatrie',
            'emergency_medicine' => 'Medicina de Urgență',
            'family_medicine' => 'Medicina de Familie',
            'internal_medicine' => 'Medicina Internă',
            'radiology' => 'Radiologie',
            'laboratory_medicine' => 'Medicina de Laborator',
            'pharmacology' => 'Farmacologie',
            'medical_ethics' => 'Etică Medicală',
            'research_methods' => 'Metode de Cercetare',
            'quality_improvement' => 'Îmbunătățirea Calității',
            'patient_safety' => 'Siguranța Pacientului'
        ];
    }

    public function passedValidation(): void
    {
        // Auto-set is_free based on price
        if ($this->input('price', 0) <= 0) {
            $this->merge(['is_free' => true]);
        }

        // Auto-calculate contact hours if not provided
        if (!$this->filled('contact_hours')) {
            $this->merge(['contact_hours' => $this->input('duration_hours', 0)]);
        }

        // Set default timezone if not provided
        if (!$this->filled('timezone')) {
            $this->merge(['timezone' => 'Europe/Bucharest']);
        }

        // Set version
        $this->merge(['version' => 1.0]);
    }
}
