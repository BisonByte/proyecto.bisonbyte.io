<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessTelemetry;
use App\Services\DevicePumpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;

class TelemetryController extends Controller
{
    public function __construct(private readonly DevicePumpService $devices)
    {
    }

    public function __invoke(Request $request): JsonResponse
    {
        $data = $request->validate([
            'device_id' => ['required', 'integer'],
            'telemetry' => ['required', 'array'],
            'telemetry.voltage' => ['nullable', 'numeric'],
            'telemetry.current' => ['nullable', 'numeric'],
            'telemetry.battery' => ['nullable', 'numeric'],
            'telemetry.temperature' => ['nullable', 'numeric'],
            'telemetry.pressure' => ['nullable', 'numeric'],
            'telemetry.is_on' => ['nullable', 'boolean'],
            'firmware_version' => ['nullable', 'string', 'max:64'],
            'firmware' => ['nullable', 'string', 'max:64'],
            'name' => ['nullable', 'string', 'max:120'],
            'flow_l_min' => ['nullable', 'numeric'],
        ]);

        /** @var \App\Models\Device|null $device */
        $device = $request->attributes->get('device');

        if (! $device) {
            abort(403, __('Dispositivo no autenticado.'));
        }

        $telemetry = Arr::get($data, 'telemetry', []);
        $reportedIsOn = Arr::has($telemetry, 'is_on') ? (bool) $telemetry['is_on'] : null;
        $jobData = [
            'device_id' => $device->id,
            'telemetry' => $telemetry,
            'reported_is_on' => $reportedIsOn,
            'firmware' => $request->input('firmware') ?? $request->input('firmware_version'),
            'name' => $request->input('name'),
            'flow_l_min' => $request->input('flow_l_min'),
            'ip' => $request->ip(),
            'received_at' => now()->toIso8601String(),
            'payload' => Arr::except($request->all(), ['token']),
        ];

        if (config('queue.default') === 'sync') {
            dispatch_sync(new ProcessTelemetry($jobData));
        } else {
            ProcessTelemetry::dispatch($jobData)->afterResponse();
        }

        return response()->json([
            'queued' => true,
            'device_id' => $device->id,
            'should_run' => (bool) $device->should_run,
            'command' => $device->should_run ? 'on' : 'off',
        ], 202);
    }
}
