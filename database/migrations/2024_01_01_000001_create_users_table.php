<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('specialization')->nullable();
            $table->string('license_number', 100)->nullable();
            $table->string('institution')->nullable();
            $table->string('department')->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('country', 100)->default('Romania');
            $table->string('city', 100)->nullable();
            $table->text('bio')->nullable();
            $table->string('avatar')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_login_at')->nullable();
            $table->text('two_factor_secret')->nullable();
            $table->text('two_factor_recovery_codes')->nullable();
            $table->timestamp('two_factor_confirmed_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['email', 'is_active']);
            $table->index(['specialization']);
            $table->index(['institution']);
            $table->index(['license_number']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('users');
    }
};
