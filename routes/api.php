<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MedicalConditionController;
use App\Http\Controllers\Api\CourseController;

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'time' => now()->toISOString(),
        'app' => config('app.name'),
        'version' => '2025.1.0'
    ]);
});

// Auth
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('reset-password', [AuthController::class, 'resetPassword']);
    Route::get('verify-email', [AuthController::class, 'verifyEmail'])->name('verification.verify');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'user']);
        Route::post('update-profile', [AuthController::class, 'updateProfile']);
        Route::post('change-password', [AuthController::class, 'changePassword']);

        // 2FA
        Route::post('2fa/enable', [AuthController::class, 'enable2FA']);
        Route::post('2fa/confirm', [AuthController::class, 'confirm2FA']);
        Route::post('2fa/disable', [AuthController::class, 'disable2FA']);
        Route::post('refresh-token', [AuthController::class, 'refreshToken']);
        Route::post('2fa/verify', [AuthController::class, 'verify2FA']);
    });
});

// Medical Conditions
Route::prefix('medical-conditions')->group(function () {
    Route::get('/', [MedicalConditionController::class, 'index']);
    Route::get('search', [MedicalConditionController::class, 'search']);
    Route::get('search-by-codes', [MedicalConditionController::class, 'searchByCodes']);
    Route::get('stats', [MedicalConditionController::class, 'stats']);
    Route::get('{medicalCondition}', [MedicalConditionController::class, 'show']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/', [MedicalConditionController::class, 'store']);
        Route::put('{medicalCondition}', [MedicalConditionController::class, 'update']);
        Route::patch('{medicalCondition}', [MedicalConditionController::class, 'update']);
        Route::delete('{medicalCondition}', [MedicalConditionController::class, 'destroy']);
        Route::post('{medicalCondition}/bookmark', [MedicalConditionController::class, 'bookmark']);
        Route::post('export', [MedicalConditionController::class, 'export']);
        Route::post('bulk-update', [MedicalConditionController::class, 'bulkUpdate']);
    });
});

// Courses
Route::prefix('courses')->group(function () {
    Route::get('/', [CourseController::class, 'index']);
    Route::get('{course}', [CourseController::class, 'show']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/', [CourseController::class, 'store']);
        Route::post('{course}/enroll', [CourseController::class, 'enroll']);
        Route::get('{course}/progress', [CourseController::class, 'getProgress']);
        Route::post('{course}/complete', [CourseController::class, 'completeCourse']);
        // update/delete could be added here if needed
    });
});

// AI assistant endpoints (stubs for now) according to README
Route::middleware('auth:sanctum')->prefix('ai-assistant')->group(function () {
    Route::post('message', function () {
        return response()->json(['message' => 'Not implemented yet'], 501);
    });
    Route::post('analyze-images', function () {
        return response()->json(['message' => 'Not implemented yet'], 501);
    });
    Route::post('differential-diagnosis', function () {
        return response()->json(['message' => 'Not implemented yet'], 501);
    });
});