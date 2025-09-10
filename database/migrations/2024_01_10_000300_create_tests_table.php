<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained();
            $table->string('title');
            $table->text('description')->nullable();
            $table->decimal('passing_score', 5, 2)->default(70.00);
            $table->integer('time_limit_minutes')->nullable();
            $table->integer('max_attempts')->default(3);
            $table->boolean('is_required')->default(true);
            $table->json('questions')->nullable();
            $table->timestamps();

            $table->index(['course_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tests');
    }
};