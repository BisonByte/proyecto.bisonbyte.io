<?php

use App\Http\Controllers\Auth\DemoLoginController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PumpSimulationController;
use App\Http\Controllers\TelemetryStreamController;
use App\Http\Controllers\SettingsController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return session('demo_authenticated')
        ? redirect()->route('dashboard')
        : redirect()->route('login');
})->name('home');

Route::get('/login', [DemoLoginController::class, 'show'])->name('login');
Route::post('/login', [DemoLoginController::class, 'login']);

Route::middleware('demo.auth')->group(function (): void {
    Route::get('/dashboard', DashboardController::class)->name('dashboard');

    Route::get('/pump/state', [PumpSimulationController::class, 'state'])->name('pump.state');
    Route::post('/pump/toggle', [PumpSimulationController::class, 'toggle'])->name('pump.toggle');
    Route::get('/telemetry/stream', TelemetryStreamController::class)->name('telemetry.stream');

    Route::get('/settings', [SettingsController::class, 'edit'])->name('settings.edit');
    Route::put('/settings/esp32', [SettingsController::class, 'updateEsp32'])->name('settings.esp32.update');
    Route::put('/settings/demo', [SettingsController::class, 'updateDemo'])->name('settings.demo.update');
    Route::put('/settings/fluid', [SettingsController::class, 'updateFluid'])->name('settings.fluid.update');

    Route::post('/logout', [DemoLoginController::class, 'logout'])->name('logout');
});
