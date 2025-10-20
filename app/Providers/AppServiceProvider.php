<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

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
        RateLimiter::for('telemetry', function (Request $request) {
            $deviceId = (int) ($request->input('device_id') ?? $request->route('device_id'));

            if ($deviceId > 0) {
                return Limit::perMinute(60)->by('device:' . $deviceId);
            }

            return Limit::perMinute(30)->by($request->ip());
        });
    }
}
