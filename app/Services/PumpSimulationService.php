<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class PumpSimulationService
{
    private const SESSION_KEY = 'pump_simulation_state';

    public function getPayload(Request $request): array
    {
        $state = $this->ensureState($request);

        return [
            'state' => $this->transformState($state),
            'metricsSeed' => $this->buildMetricsSeed($state),
        ];
    }

    public function toggle(Request $request): array
    {
        $state = $this->ensureState($request);
        $now = Carbon::now();

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

        return $this->transformState($state);
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

    protected function transformState(array $state): array
    {
        $now = Carbon::now();
        $totalSeconds = $state['total_runtime_seconds'];

        if ($state['is_on'] && $state['last_started_at']) {
            $totalSeconds += $this->calculateActiveSeconds($state, $now);
        }

        $lastChanged = Carbon::parse($state['last_switched_at']);

        return [
            'isOn' => (bool) $state['is_on'],
            'statusLabel' => $state['is_on'] ? __('Bomba activa') : __('Bomba apagada'),
            'statusTone' => $state['is_on'] ? 'success' : 'danger',
            'lastChangedAt' => $lastChanged->toIso8601String(),
            'lastChangedHuman' => $lastChanged->copy()->locale('es')->diffForHumans(),
            'totalRuntimeSeconds' => $totalSeconds,
            'totalRuntimeFormatted' => $this->formatDuration($totalSeconds),
        ];
    }

    protected function buildMetricsSeed(array $state): array
    {
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
}
