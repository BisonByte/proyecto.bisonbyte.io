<?php

namespace App\Services;

use App\Models\Device;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class PumpSimulationService
{
    private const SESSION_KEY = 'pump_simulation_state';

    public function __construct(private readonly DevicePumpService $devices)
    {
    }

    public function getPayload(Request $request): array
    {
        $state = $this->ensureState($request);
        $device = $this->devices->current();

        $latestMeasurement = null;

        if ($device) {
            $state = $this->syncStateWithDevice($state, (bool) $device->should_run);
            $request->session()->put(self::SESSION_KEY, $state);
            $latestMeasurement = $device->measurements()->latest('recorded_at')->first();
        }

        return [
            'state' => $this->transformState($state, $device),
            'metricsSeed' => $this->buildMetricsSeed($state, $device),
            'telemetry' => $device?->telemetry,
            'measurement' => $this->transformMeasurement($latestMeasurement),
            'device' => $device ? [
                'id' => $device->id,
                'shouldRun' => (bool) $device->should_run,
                'reportedIsOn' => $device->reported_is_on,
                'lastTelemetryAt' => optional($device->last_telemetry_at)->toIso8601String(),
                'lastSeenAt' => optional($device->last_seen_at)->toIso8601String(),
            ] : null,
        ];
    }

    public function toggle(Request $request): array
    {
        $state = $this->ensureState($request);
        $now = Carbon::now();
        $device = $this->devices->current();

        if ($state['is_on']) {
            $state['is_on'] = false;
            $state['total_runtime_seconds'] += $this->calculateActiveSeconds($state, $now);
            $state['last_started_at'] = null;
        } else {
            $state['is_on'] = true;
            $state['last_started_at'] = $now->toIso8601String();
        }

        $state['last_switched_at'] = $now->toIso8601String();
        $request->session()->put(self::SESSION_KEY, $state);

        if ($device) {
            $device = $this->devices->setDesiredState($device, (bool) $state['is_on']);
        }

        return $this->transformState($state, $device);
    }

    protected function ensureState(Request $request): array
    {
        $state = $request->session()->get(self::SESSION_KEY);

        if (! $state) {
            $seed = Carbon::now()->subMinutes(15);

            $state = [
                'is_on' => false,
                'last_switched_at' => $seed->toIso8601String(),
                'last_started_at' => null,
                'total_runtime_seconds' => random_int(1200, 3200),
            ];

            $request->session()->put(self::SESSION_KEY, $state);
        }

        return $state;
    }

    protected function transformState(array $state, ?Device $device = null): array
    {
        $now = Carbon::now();
        $totalSeconds = $state['total_runtime_seconds'];
        $deviceReported = $device?->reported_is_on;
        $deviceShouldRun = $device?->should_run;

        if ($deviceShouldRun !== null && $deviceShouldRun !== $state['is_on']) {
            $state = $this->syncStateWithDevice($state, (bool) $deviceShouldRun);
        }

        if ($state['is_on'] && $state['last_started_at']) {
            $totalSeconds += $this->calculateActiveSeconds($state, $now);
        }

        $lastChanged = Carbon::parse($state['last_switched_at']);
        $isOn = (bool) $state['is_on'];

        return [
            'isOn' => $deviceReported ?? $isOn,
            'shouldRun' => $deviceShouldRun ?? $isOn,
            'reportedIsOn' => $deviceReported,
            'statusLabel' => ($deviceReported ?? $isOn) ? __('Bomba activa') : __('Bomba apagada'),
            'statusTone' => ($deviceReported ?? $isOn) ? 'success' : 'danger',
            'lastChangedAt' => $lastChanged->toIso8601String(),
            'lastChangedHuman' => $lastChanged->copy()->locale('es')->diffForHumans(),
            'totalRuntimeSeconds' => $totalSeconds,
            'totalRuntimeFormatted' => $this->formatDuration($totalSeconds),
        ];
    }

    protected function buildMetricsSeed(array $state, ?Device $device = null): array
    {
        if ($device && is_array($device->telemetry) && ! empty($device->telemetry)) {
            $telemetry = $device->telemetry;
            $voltage = isset($telemetry['voltage']) ? (float) $telemetry['voltage'] : null;
            $current = isset($telemetry['current']) ? (float) $telemetry['current'] : null;
            $battery = isset($telemetry['battery']) ? (float) $telemetry['battery'] : null;
            $runtimeMinutes = isset($telemetry['totalRuntimeMinutes'])
                ? (float) $telemetry['totalRuntimeMinutes']
                : round(($state['total_runtime_seconds'] ?? 0) / 60, 1);

            return [
                'voltage' => $voltage ?? ($state['is_on'] ? 225 : 1),
                'current' => $current ?? ($state['is_on'] ? 7.8 : 0.2),
                'battery' => $battery ?? 90,
                'totalRuntimeMinutes' => $runtimeMinutes,
                'isOn' => (bool) ($telemetry['is_on'] ?? $state['is_on']),
            ];
        }

        $isOn = (bool) $state['is_on'];
        $baseVoltage = $isOn ? 225 + random_int(-3, 3) : random_int(0, 2);
        $baseCurrent = $isOn ? 7.5 + random_int(-5, 5) / 10 : random_int(1, 3) / 10;
        $battery = 86 + random_int(0, 9);
        $now = Carbon::now();
        $activeSeconds = $isOn ? $this->calculateActiveSeconds($state, $now) : 0;
        $totalMinutes = round(($state['total_runtime_seconds'] + $activeSeconds) / 60, 1);

        return [
            'voltage' => $baseVoltage,
            'current' => round($baseCurrent, 2),
            'battery' => $battery,
            'totalRuntimeMinutes' => $totalMinutes,
            'isOn' => $isOn,
        ];
    }

    protected function calculateActiveSeconds(array $state, Carbon $now): int
    {
        if (! $state['last_started_at']) {
            return 0;
        }

        return Carbon::parse($state['last_started_at'])->diffInSeconds($now);
    }

    protected function formatDuration(int $seconds): string
    {
        $hours = intdiv($seconds, 3600);
        $minutes = intdiv($seconds % 3600, 60);
        $remainingSeconds = $seconds % 60;

        if ($hours > 0) {
            return sprintf('%02dh %02dm %02ds', $hours, $minutes, $remainingSeconds);
        }

        return sprintf('%02dm %02ds', $minutes, $remainingSeconds);
    }

    protected function syncStateWithDevice(array $state, bool $shouldRun): array
    {
        $now = Carbon::now();

        if ($shouldRun && ! $state['is_on']) {
            $state['is_on'] = true;
            $state['last_started_at'] = $now->toIso8601String();
            $state['last_switched_at'] = $now->toIso8601String();
        } elseif (! $shouldRun && $state['is_on']) {
            $state['is_on'] = false;
            $state['total_runtime_seconds'] += $this->calculateActiveSeconds($state, $now);
            $state['last_started_at'] = null;
            $state['last_switched_at'] = $now->toIso8601String();
        }

        return $state;
    }

    protected function transformMeasurement($measurement): ?array
    {
        if (! $measurement) {
            return null;
        }

        return [
            'id' => $measurement->id,
            'recordedAt' => optional($measurement->recorded_at)->toIso8601String(),
            'flow' => $measurement->flow_l_min,
            'pressure' => $measurement->pressure_bar,
            'temperature' => $measurement->temperature_c,
            'voltage' => $measurement->voltage_v,
            'current' => $measurement->current_a,
            'velocity' => $measurement->velocity_m_s,
            'density' => $measurement->density_kg_m3,
            'viscosity' => $measurement->dynamic_viscosity_pa_s,
            'reynolds' => $measurement->reynolds_number,
            'frictionFactor' => $measurement->friction_factor,
            'pressureDrop' => $measurement->pressure_drop_pa,
            'headLoss' => $measurement->head_loss_m,
            'hydraulicPower' => $measurement->hydraulic_power_w,
        ];
    }
}
