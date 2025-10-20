<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\DevicePumpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PumpSetController extends Controller
{
    public function __construct(private readonly DevicePumpService $devices)
    {
    }

    public function __invoke(Request $request): JsonResponse
    {
        $data = $request->validate([
            'device_id' => ['required', 'integer', 'exists:devices,id'],
            'should_run' => ['nullable', 'boolean'],
            'command' => ['nullable', 'string', 'in:on,off'],
        ]);

        $device = $this->devices->find((int) $data['device_id']);

        if (! $device) {
            abort(404, __('Dispositivo no encontrado.'));
        }

        $shouldRun = $data['should_run'];

        if ($shouldRun === null && array_key_exists('command', $data)) {
            $shouldRun = $data['command'] === 'on';
        }

        if ($shouldRun === null) {
            throw ValidationException::withMessages([
                'should_run' => __('Debes indicar el estado deseado.'),
            ]);
        }

        $device = $this->devices->setDesiredState($device, (bool) $shouldRun);

        return response()->json([
            'device_id' => $device->id,
            'should_run' => (bool) $device->should_run,
            'command' => $device->should_run ? 'on' : 'off',
            'last_command_at' => optional($device->last_command_at)->toIso8601String(),
            'updated_at' => now()->toIso8601String(),
        ]);
    }
}
