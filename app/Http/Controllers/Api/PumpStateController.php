<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DevicePumpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PumpStateController extends Controller
{
    public function __construct(private readonly DevicePumpService $devices)
    {
    }

    public function __invoke(Request $request): JsonResponse
    {
        /** @var \App\Models\Device|null $device */
        $device = $request->attributes->get('device');

        if (! $device) {
            abort(403, __('Dispositivo no autenticado.'));
        }

        $device = $this->devices->touch($device, $request->ip());

        return response()->json([
            'device_id' => $device->id,
            'should_run' => (bool) $device->should_run,
            'command' => $device->should_run ? 'on' : 'off',
            'last_command_at' => optional($device->last_command_at)->toIso8601String(),
            'updated_at' => now()->toIso8601String(),
        ]);
    }
}
