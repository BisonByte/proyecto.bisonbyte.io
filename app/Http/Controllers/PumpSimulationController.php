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
        return response()->json($this->simulator->getPayload($request));
    }

    public function toggle(Request $request): JsonResponse
    {
        $state = $this->simulator->toggle($request);
        $payload = $this->simulator->getPayload($request);

        return response()->json([
            'state' => $state,
            'metricsSeed' => $payload['metricsSeed'],
        ]);
    }
}
