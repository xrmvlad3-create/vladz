<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('ai_interactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained();
            $table->string('session_id');
            $table->enum('interaction_type', [
                'general_query', 'differential_diagnosis', 'image_analysis',
                'treatment_protocol', 'medication_inquiry', 'emergency_triage'
            ]);
            $table->longText('user_input');
            $table->longText('ai_response');
            $table->json('context_data')->nullable();
            $table->decimal('confidence_score', 3, 2)->nullable();
            $table->decimal('processing_time', 8, 3)->nullable();
            $table->string('model_used')->nullable();
            $table->integer('tokens_used')->nullable();
            $table->decimal('cost', 8, 4)->nullable();
            $table->integer('feedback_rating')->nullable();
            $table->text('feedback_comment')->nullable();
            $table->boolean('flagged_content')->default(false);
            $table->json('safety_warnings')->nullable();
            $table->foreignId('medical_condition_id')->nullable()->constrained();
            $table->json('image_paths')->nullable();
            $table->longText('rationale_explanation')->nullable();
            $table->json('differential_diagnoses')->nullable();
            $table->json('recommended_actions')->nullable();
            $table->json('follow_up_suggestions')->nullable();
            $table->enum('severity_assessment', ['low', 'moderate', 'high', 'critical'])->nullable();
            $table->enum('urgency_level', ['routine', 'high', 'emergency'])->nullable();
            $table->string('provider_service')->nullable();
            $table->text('error_message')->nullable();
            $table->ipAddress('ip_address');
            $table->timestamps();

            $table->index(['user_id', 'session_id']);
            $table->index(['interaction_type']);
            $table->index(['created_at']);
            $table->index(['flagged_content']);
            $table->index(['provider_service']);
            $table->index(['urgency_level']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('ai_interactions');
    }
};
