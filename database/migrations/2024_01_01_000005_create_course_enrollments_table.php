<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('course_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained();
            $table->foreignId('course_id')->constrained();
            $table->timestamp('enrollment_date');
            $table->enum('status', ['enrolled', 'in_progress', 'completed', 'dropped', 'expired']);
            $table->decimal('progress_percentage', 5, 2)->default(0);
            $table->timestamp('completion_date')->nullable();
            $table->timestamp('last_accessed')->nullable();
            $table->decimal('final_score', 5, 2)->nullable();
            $table->integer('attempts_count')->default(0);
            $table->json('module_progress')->nullable();
            $table->json('test_scores')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'course_id']);
            $table->index(['status']);
            $table->index(['enrollment_date']);
            $table->index(['completion_date']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('course_enrollments');
    }
};
