<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('test_attempts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('test_id')->constrained();
            $table->foreignId('user_id')->constrained();
            $table->foreignId('course_id')->constrained();
            $table->decimal('score', 5, 2)->nullable();
            $table->enum('status', ['in_progress', 'completed', 'failed', 'abandoned'])->default('in_progress');
            $table->json('answers')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->integer('duration_seconds')->nullable();
            $table->integer('attempt_number')->default(1);
            $table->timestamps();

            $table->index(['test_id']);
            $table->index(['user_id']);
            $table->index(['course_id']);
            $table->index(['status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('test_attempts');
    }
};