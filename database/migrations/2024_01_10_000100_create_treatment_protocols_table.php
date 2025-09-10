<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('treatment_protocols', function (Blueprint $table) {
            $table->id();
            $table->foreignId('medical_condition_id')->constrained();
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->string('name');
            $table->string('protocol_type')->nullable();
            $table->text('description')->nullable();
            $table->json('treatment_steps')->nullable();
            $table->json('medications')->nullable();
            $table->json('dosage_instructions')->nullable();
            $table->json('monitoring_parameters')->nullable();
            $table->json('contraindications')->nullable();
            $table->json('side_effects')->nullable();
            $table->json('drug_interactions')->nullable();
            $table->json('special_considerations')->nullable();
            $table->json('success_criteria')->nullable();
            $table->json('failure_criteria')->nullable();
            $table->json('alternative_treatments')->nullable();
            $table->json('emergency_protocols')->nullable();
            $table->json('patient_instructions')->nullable();
            $table->json('follow_up_schedule')->nullable();
            $table->json('cost_considerations')->nullable();
            $table->string('evidence_level', 1)->nullable();
            $table->string('guidelines_source')->nullable();
            $table->timestamp('last_updated')->nullable();
            $table->enum('status', ['draft', 'review', 'approved', 'retired'])->default('draft');
            $table->decimal('version', 4, 2)->default(1.0);
            $table->string('language', 2)->default('ro');
            $table->json('tags')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['medical_condition_id']);
            $table->index(['created_by']);
            $table->index(['approved_by']);
            $table->index(['status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('treatment_protocols');
    }
};