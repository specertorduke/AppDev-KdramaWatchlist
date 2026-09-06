<?php

use App\Modules\Auth\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    // Public routes (with rate limiting / brute-force protection)
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:6,1');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:6,1');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:6,1');

    // Protected routes (require Sanctum token)
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::patch('/password', [AuthController::class, 'updatePassword']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/logout-all', [AuthController::class, 'logoutAll']);
    });
});

Route::middleware('auth:sanctum')->prefix('user')->group(function () {
    Route::get('/profile', [AuthController::class, 'profile']);
    Route::get('/stats', [AuthController::class, 'stats']);
    Route::put('/password', [AuthController::class, 'updatePassword']);
    Route::patch('/password', [AuthController::class, 'updatePassword']);
    Route::delete('/', [AuthController::class, 'deleteAccount']);
});