<?php

namespace App\Http\Controllers;

use App\Services\PumpSimulationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PumpSimulationController extends Controller
{
    public function __construct(private readonly PumpSimulationService $simulator)
    {
    }

    public function state(Request $request): JsonResponse
    {
        $payload = $this->simulator->getPayload($request);

        return response()->json([
            'state' => $payload['state'],
            'metricsSeed' => $payload['metricsSeed'],
            'telemetry' => $payload['telemetry'] ?? null,
            'measurement' => $payload['measurement'] ?? null,
            'device' => $payload['device'] ?? null,
        ]);
    }

    public function toggle(Request $request): JsonResponse
    {
        $state = $this->simulator->toggle($request);
        $payload = $this->simulator->getPayload($request);

        return response()->json([
            'state' => $state,
            'metricsSeed' => $payload['metricsSeed'],
            'telemetry' => $payload['telemetry'] ?? null,
            'measurement' => $payload['measurement'] ?? null,
            'device' => $payload['device'] ?? null,
        ]);
    }
}
