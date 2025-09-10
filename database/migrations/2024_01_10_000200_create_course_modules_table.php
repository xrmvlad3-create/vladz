<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_modules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained();
            $table->string('title');
            $table->text('description')->nullable();
            $table->integer('duration_minutes')->default(0);
            $table->integer('order_index')->default(0);
            $table->boolean('is_mandatory')->default(true);
            $table->timestamps();

            $table->index(['course_id']);
            $table->index(['order_index']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_modules');
    }
};