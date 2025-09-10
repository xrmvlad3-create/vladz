<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // medical_conditions: drop unique on name, add unique on (name, language)
        try {
            Schema::table('medical_conditions', function (Blueprint $table) {
                $table->dropUnique('medical_conditions_name_unique');
            });
        } catch (\Throwable $e) {
            // index may not exist if already adjusted; continue
        }

        Schema::table('medical_conditions', function (Blueprint $table) {
            $table->unique(['name', 'language'], 'medical_conditions_name_language_unique');
        });

        // courses: drop unique on title, add unique on (title, language)
        try {
            Schema::table('courses', function (Blueprint $table) {
                $table->dropUnique('courses_title_unique');
            });
        } catch (\Throwable $e) {
            // index may not exist if already adjusted; continue
        }

        Schema::table('courses', function (Blueprint $table) {
            $table->unique(['title', 'language'], 'courses_title_language_unique');
        });
    }

    public function down(): void
    {
        // Revert to single column unique (not recommended if translations exist)
        Schema::table('medical_conditions', function (Blueprint $table) {
            $table->dropUnique('medical_conditions_name_language_unique');
            $table->unique('name');
        });

        Schema::table('courses', function (Blueprint $table) {
            $table->dropUnique('courses_title_language_unique');
            $table->unique('title');
        });
    }
};