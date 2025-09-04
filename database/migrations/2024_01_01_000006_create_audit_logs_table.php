<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained();
            $table->string('action');
            $table->text('description');
            $table->string('model_type')->nullable();
            $table->unsignedBigInteger('model_id')->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->json('metadata')->nullable();
            $table->ipAddress('ip_address');
            $table->text('user_agent')->nullable();
            $table->enum('severity', ['info', 'warning', 'error', 'critical'])->default('info');
            $table->timestamp('created_at');

            $table->index(['user_id', 'created_at']);
            $table->index(['action']);
            $table->index(['model_type', 'model_id']);
            $table->index(['severity']);
            $table->index(['created_at']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('audit_logs');
    }
};
