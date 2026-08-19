<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // List of all active modules
        $modules = ['Auth', 'Drama', 'Watchlist'];

        // Automatically register api.php from each module
        foreach ($modules as $module) {
            $routePath = app_path("Modules/{$module}/Routes/api.php");

            if (file_exists($routePath)) {
                Route::middleware('api')
                    ->prefix('api/v1')
                    ->group($routePath);
            }
        }
    }
}

