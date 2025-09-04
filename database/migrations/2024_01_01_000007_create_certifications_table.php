<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('certifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained();
            $table->foreignId('course_id')->constrained();
            $table->string('certificate_number')->unique();
            $table->timestamp('issue_date');
            $table->timestamp('expiry_date')->nullable();
            $table->decimal('cme_credits_earned', 4, 2)->nullable();
            $table->decimal('cpe_credits_earned', 4, 2)->nullable();
            $table->string('verification_code', 8)->unique();
            $table->enum('status', ['active', 'expired', 'revoked'])->default('active');
            $table->string('certificate_path')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['user_id']);
            $table->index(['course_id']);
            $table->index(['certificate_number']);
            $table->index(['verification_code']);
            $table->index(['status']);
            $table->index(['issue_date']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('certifications');
    }
};
