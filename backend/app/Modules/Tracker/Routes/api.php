<?php

use App\Modules\Tracker\Controllers\TrackerController;
use Illuminate\Support\Facades\Route;

Route::prefix('tracker')->middleware('auth:sanctum')->group(function () {
    Route::get('/', [TrackerController::class, 'index']);
    Route::post('/', [TrackerController::class, 'store']);
    Route::get('/{tmdb_id}', [TrackerController::class, 'show'])->whereNumber('tmdb_id');
    Route::patch('/{tmdb_id}', [TrackerController::class, 'update'])->whereNumber('tmdb_id');
    Route::post('/{tmdb_id}/increment', [TrackerController::class, 'increment'])->whereNumber('tmdb_id');
    Route::delete('/{tmdb_id}', [TrackerController::class, 'destroy'])->whereNumber('tmdb_id');
});
