<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->string('title')->unique();
            $table->longText('description');
            $table->foreignId('instructor_id')->constrained('users');
            $table->string('category');
            $table->enum('difficulty_level', ['beginner', 'intermediate', 'advanced', 'expert']);
            $table->decimal('duration_hours', 6, 2);
            $table->integer('max_participants')->nullable();
            $table->json('prerequisites')->nullable();
            $table->json('learning_objectives');
            $table->json('course_content')->nullable();
            $table->json('assessment_criteria')->nullable();
            $table->enum('certification_type', ['completion', 'cme', 'cpe', 'specialty']);
            $table->decimal('cme_credits', 4, 2)->nullable();
            $table->decimal('cpe_credits', 4, 2)->nullable();
            $table->decimal('price', 8, 2);
            $table->string('currency', 3)->default('RON');
            $table->decimal('discount_percentage', 5, 2)->nullable();
            $table->enum('status', ['draft', 'review', 'published', 'archived', 'cancelled'])->default('draft');
            $table->timestamp('start_date')->nullable();
            $table->timestamp('end_date')->nullable();
            $table->timestamp('registration_deadline')->nullable();
            $table->string('language', 2)->default('ro');
            $table->string('timezone')->default('Europe/Bucharest');
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_free')->default(false);
            $table->boolean('requires_approval')->default(false);
            $table->decimal('completion_rate_threshold', 5, 2)->default(80.0);
            $table->decimal('passing_score', 5, 2)->default(70.0);
            $table->integer('max_attempts')->default(3);
            $table->string('certificate_template')->nullable();
            $table->json('tags')->nullable();
            $table->json('target_audience');
            $table->string('accreditation_body')->nullable();
            $table->string('accreditation_number', 100)->nullable();
            $table->decimal('contact_hours', 6, 2)->nullable();
            $table->decimal('practical_hours', 6, 2)->nullable();
            $table->decimal('theory_hours', 6, 2)->nullable();
            $table->decimal('version', 4, 2)->default(1.0);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'is_featured']);
            $table->index(['category', 'difficulty_level']);
            $table->index(['instructor_id']);
            $table->index(['certification_type']);
            $table->index(['start_date', 'end_date']);
            $table->index(['is_free', 'price']);
            $table->fullText(['title', 'description']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('courses');
    }
};
