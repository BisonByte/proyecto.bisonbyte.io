<?php

namespace App\Http\Controllers;

use App\Models\Measurement;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TelemetryStreamController extends Controller
{
    public function __invoke(Request $request): StreamedResponse
    {
        $deviceId = (int) $request->query('device_id');
        $lastEventId = (int) ($request->header('Last-Event-ID') ?? $request->query('last_id', 0));

        $headers = [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no',
        ];

        return response()->stream(function () use ($deviceId, $lastEventId): void {
            $start = microtime(true);
            $currentId = $lastEventId;

            ignore_user_abort(true);
            set_time_limit(0);

            while (! connection_aborted()) {
                $measurement = Measurement::query()
                    ->when($deviceId > 0, fn ($query) => $query->where('device_id', $deviceId))
                    ->where('id', '>', $currentId)
                    ->orderBy('id')
                    ->first();

                if ($measurement) {
                    $payload = $this->formatMeasurement($measurement);
                    $currentId = $measurement->id;

                    echo 'id: ' . $currentId . "\n";
                    echo "event: telemetry.updated\n";
                    echo 'data: ' . json_encode($payload) . "\n\n";
                    @ob_flush();
                    @flush();
                } else {
                    echo "event: telemetry.ping\n";
                    echo 'data: {"alive":true}' . "\n\n";
                    @ob_flush();
                    @flush();
                    usleep(1_500_000); // 1.5 s
                    continue;
                }

                usleep(200_000); // 0.2 s guard to reduce CPU pressure

                if ((microtime(true) - $start) > 300) {
                    // close connection every 5 minutes to avoid timeouts
                    break;
                }
            }
        }, 200, $headers);
    }

    private function formatMeasurement(Measurement $measurement): array
    {
        return [
            'id' => $measurement->id,
            'device_id' => $measurement->device_id,
            'recorded_at' => optional($measurement->recorded_at)->toIso8601String(),
            'flow' => $measurement->flow_l_min,
            'pressure' => $measurement->pressure_bar,
            'temperature' => $measurement->temperature_c,
            'voltage' => $measurement->voltage_v,
            'current' => $measurement->current_a,
            'velocity' => $measurement->velocity_m_s,
            'density' => $measurement->density_kg_m3,
            'viscosity' => $measurement->dynamic_viscosity_pa_s,
            'reynolds' => $measurement->reynolds_number,
            'friction_factor' => $measurement->friction_factor,
            'pressure_drop' => $measurement->pressure_drop_pa,
            'head_loss' => $measurement->head_loss_m,
            'hydraulic_power' => $measurement->hydraulic_power_w,
        ];
    }
}
