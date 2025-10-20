<?php

use App\Http\Controllers\Api\DeviceRegistrationController;
use App\Http\Controllers\Api\PumpSetController;
use App\Http\Controllers\Api\PumpStateController;
use App\Http\Controllers\Api\TelemetryController;
use Illuminate\Support\Facades\Route;

Route::middleware('api')->group(function (): void {
    Route::post('/devices/register', DeviceRegistrationController::class)->name('api.devices.register');
    Route::get('/pump/state', PumpStateController::class)
        ->middleware('device.auth')
        ->name('api.pump.state');

    Route::post('/pump/set', PumpSetController::class)
        ->middleware(['auth:sanctum', 'role:admin'])
        ->name('api.pump.set');

    Route::post('/telemetry', TelemetryController::class)
        ->middleware(['device.auth', 'throttle:telemetry'])
        ->name('api.telemetry.store');
});
