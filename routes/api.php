<?php

use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'time' => now()->toISOString(),
        'app' => config('app.name'),
        'version' => '2025.1.0'
    ]);
});