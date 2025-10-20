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

        RateLimiter::for('device-registration', function (Request $request) {
            $mac = strtolower((string) $request->input('mac'));

            if ($mac !== '') {
                return Limit::perMinute(6)->by('registration-mac:' . $mac);
            }

            return Limit::perMinute(3)->by($request->ip());
        });

        RateLimiter::for('demo-login', function (Request $request) {
            $username = strtolower((string) $request->input('username'));

            return Limit::perMinute(5)->by($request->ip() . '|' . $username);
        });
    }
}
