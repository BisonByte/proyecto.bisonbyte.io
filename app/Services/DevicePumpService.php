<?php

namespace App\Services;

use App\Models\Device;
use Illuminate\Support\Carbon;

class DevicePumpService
{
    public function current(): ?Device
    {
        return Device::query()
            ->where(function ($query): void {
                $query->whereNull('token_expires_at')
                    ->orWhere('token_expires_at', '>', Carbon::now());
            })
            ->orderByDesc('last_seen_at')
            ->orderByDesc('id')
            ->first();
    }

    public function find(int $id): ?Device
    {
        return Device::query()->find($id);
    }

    public function ensureTokenMatches(Device $device, string $token): bool
    {
        return hash_equals($device->token, hash('sha256', $token));
    }

    public function touch(Device $device, ?string $ip = null): Device
    {
        $device->forceFill([
            'last_seen_at' => Carbon::now(),
            'ip' => $ip ?? $device->ip,
        ])->save();

        return $device->refresh();
    }

    public function setDesiredState(Device $device, bool $shouldRun): Device
    {
        $device->forceFill([
            'should_run' => $shouldRun,
            'last_command_at' => Carbon::now(),
        ])->save();

        return $device->refresh();
    }

    public function updateMetadata(Device $device, array $attributes): Device
    {
        $allowed = array_filter([
            'name' => $attributes['name'] ?? null,
            'firmware' => $attributes['firmware'] ?? null,
            'connection_type' => $attributes['connection_type'] ?? null,
            'topic' => $attributes['topic'] ?? null,
            'ip' => $attributes['ip'] ?? null,
            'token_expires_at' => $attributes['token_expires_at'] ?? null,
        ], fn ($value) => $value !== null);

        if (! empty($allowed)) {
            $device->fill($allowed);

            if ($device->isDirty()) {
                $device->save();
            }
        }

        return $device->refresh();
    }

    public function recordTelemetry(Device $device, array $telemetry, ?bool $reportedIsOn = null, ?string $ip = null): Device
    {
        $now = Carbon::now();

        $device->forceFill([
            'telemetry' => $telemetry,
            'reported_is_on' => $reportedIsOn,
            'last_telemetry_at' => $now,
            'last_seen_at' => $now,
            'ip' => $ip ?? $device->ip,
        ])->save();

        return $device->refresh();
    }
}
