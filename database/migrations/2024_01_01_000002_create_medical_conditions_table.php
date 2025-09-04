<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('medical_conditions', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->longText('description');
            $table->string('icd_10_code', 10)->nullable();
            $table->string('icd_11_code', 20)->nullable();
            $table->string('snomed_ct_code', 20)->nullable();
            $table->enum('category', [
                'cardiovascular', 'respiratory', 'neurological', 'endocrine',
                'gastroenterology', 'nephrology', 'hematology', 'oncology',
                'infectious_diseases', 'immunology', 'dermatology', 'psychiatry',
                'orthopedics', 'ophthalmology', 'otorhinolaryngology', 'gynecology',
                'pediatrics', 'geriatrics', 'emergency_medicine', 'anesthesiology'
            ]);
            $table->enum('severity', ['mild', 'moderate', 'severe', 'critical']);
            $table->decimal('prevalence', 5, 2)->nullable();
            $table->json('symptoms');
            $table->json('risk_factors')->nullable();
            $table->json('complications')->nullable();
            $table->json('differential_diagnosis')->nullable();
            $table->json('red_flags')->nullable();
            $table->longText('treatment_approach')->nullable();
            $table->longText('prognosis')->nullable();
            $table->longText('epidemiology')->nullable();
            $table->longText('pathophysiology')->nullable();
            $table->longText('clinical_features')->nullable();
            $table->longText('laboratory_findings')->nullable();
            $table->longText('imaging_findings')->nullable();
            $table->json('treatment_protocols')->nullable();
            $table->json('prevention_strategies')->nullable();
            $table->longText('patient_education')->nullable();
            $table->longText('follow_up_requirements')->nullable();
            $table->json('contraindications')->nullable();
            $table->json('drug_interactions')->nullable();
            $table->json('special_populations')->nullable();
            $table->longText('emergency_management')->nullable();
            $table->longText('chronic_management')->nullable();
            $table->json('monitoring_parameters')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->enum('status', ['draft', 'review', 'published', 'archived'])->default('draft');
            $table->enum('evidence_level', ['A', 'B', 'C', 'D'])->nullable();
            $table->timestamp('last_reviewed_at')->nullable();
            $table->text('review_notes')->nullable();
            $table->decimal('version', 4, 2)->default(1.0);
            $table->json('tags')->nullable();
            $table->json('sources')->nullable();
            $table->string('language', 2)->default('ro');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['category', 'severity']);
            $table->index(['status']);
            $table->index(['evidence_level']);
            $table->index(['created_by']);
            $table->index(['icd_10_code']);
            $table->index(['icd_11_code']);
            $table->index(['snomed_ct_code']);
            $table->fullText(['name', 'description']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('medical_conditions');
    }
};
