<?php

use App\Modules\Discover\Controllers\DiscoverController;
use App\Modules\Discover\Controllers\HomeController;
use Illuminate\Support\Facades\Route;

Route::get('/home', [HomeController::class, 'index'])->middleware('auth:sanctum');

Route::prefix('discover')->middleware('auth:sanctum')->group(function () {
    Route::get('/', [DiscoverController::class, 'index']);
    Route::get('/genres', [DiscoverController::class, 'genres']);
    Route::get('/search', [DiscoverController::class, 'search']);
    Route::get('/{tmdb_id}', [DiscoverController::class, 'show'])->whereNumber('tmdb_id');
});

