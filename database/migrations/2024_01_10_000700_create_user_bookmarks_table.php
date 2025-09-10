<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_bookmarks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained();
            $table->foreignId('medical_condition_id')->constrained();
            $table->timestamps();

            $table->unique(['user_id', 'medical_condition_id']);
            $table->index(['user_id']);
            $table->index(['medical_condition_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_bookmarks');
    }
};