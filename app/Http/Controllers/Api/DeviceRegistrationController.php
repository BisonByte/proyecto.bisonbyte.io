<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Device;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DeviceRegistrationController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $data = $request->validate([
            'mac' => ['required', 'string', 'max:32'],
            'name' => ['nullable', 'string', 'max:120'],
            'firmware' => ['nullable', 'string', 'max:64'],
            'firmware_version' => ['nullable', 'string', 'max:64'],
            'ip' => ['nullable', 'ip'],
            'topic' => ['nullable', 'string', 'max:180'],
            'connection_type' => ['nullable', 'in:http,mqtt'],
        ]);

        $ipAddress = $data['ip'] ?? $request->ip();
        $firmware = $data['firmware'] ?? $data['firmware_version'] ?? null;
        $connectionType = $data['connection_type'] ?? 'http';

        $device = Device::where('mac', $data['mac'])->first();
        $plainToken = Str::random(60);
        $hashedToken = hash('sha256', $plainToken);

        if (! $device) {
            $device = Device::create([
                'mac' => $data['mac'],
                'name' => $data['name'] ?? null,
                'firmware' => $firmware,
                'ip' => $ipAddress,
                'topic' => $data['topic'] ?? null,
                'connection_type' => $connectionType,
                'token' => $hashedToken,
                'token_expires_at' => now()->addDays(30),
                'last_seen_at' => now(),
                'last_command_at' => now(),
            ]);

            $status = 201;
        } else {
            $device->fill([
                'name' => $data['name'] ?? $device->name,
                'firmware' => $firmware ?? $device->firmware,
                'ip' => $ipAddress,
                'topic' => $data['topic'] ?? $device->topic,
                'connection_type' => $connectionType,
                'token' => $hashedToken,
                'last_seen_at' => now(),
                'token_expires_at' => now()->addDays(30),
            ]);

            if ($device->isDirty()) {
                $device->save();
            }

            $status = 200;
        }

        $httpConfig = config('device.esp32');

        return response()->json([
            'device_id' => $device->id,
            'token' => $plainToken,
            'connection_type' => $device->connection_type,
            'name' => $device->name,
            'token_expires_at' => optional($device->token_expires_at)->toIso8601String(),
            'http' => [
                'state' => $httpConfig['http_state_endpoint'] ?? route('api.pump.state'),
                'set' => $httpConfig['http_set_endpoint'] ?? route('api.pump.set'),
                'telemetry' => $httpConfig['http_telemetry_endpoint'] ?? route('api.telemetry.store'),
                'poll_seconds' => $httpConfig['http_poll_seconds'] ?? 2,
            ],
        ], $status);
    }
}
