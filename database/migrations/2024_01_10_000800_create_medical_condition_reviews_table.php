<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medical_condition_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('medical_condition_id')->constrained();
            $table->foreignId('user_id')->constrained();
            $table->unsignedTinyInteger('rating'); // 1-5
            $table->text('comment')->nullable();
            $table->timestamps();

            $table->unique(['medical_condition_id', 'user_id']);
            $table->index(['medical_condition_id', 'rating']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medical_condition_reviews');
    }
};