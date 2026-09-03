<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

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
        // Configure default password rules
        Password::defaults(function () {
            return app()->isProduction()
                ? Password::min(8)->letters()->mixedCase()->numbers()->symbols()->uncompromised()
                : Password::min(8);
        });

        // Configure api rate limiter
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        // List of all active modules
        $modules = ['Auth', 'Discover', 'Tracker'];

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

