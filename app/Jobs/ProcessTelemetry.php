<?php

namespace App\Jobs;

use App\Events\TelemetryUpdated;
use App\Models\PumpEvent;
use App\Services\DevicePumpService;
use App\Services\FluidCalculationService;
use Illuminate\Bus\Batchable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;

class ProcessTelemetry implements ShouldQueue
{
    use Batchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * @param array<string, mixed> $payload
     */
    public function __construct(private readonly array $payload)
    {
    }

    public function handle(DevicePumpService $devices, FluidCalculationService $calculator): void
    {
        $device = $devices->find((int) ($this->payload['device_id'] ?? 0));

        if (! $device) {
            return;
        }

        $metadata = array_filter([
            'name' => $this->payload['name'] ?? null,
            'firmware' => $this->payload['firmware'] ?? null,
            'ip' => $this->payload['ip'] ?? null,
        ], fn ($value) => $value !== null);

        if (! empty($metadata)) {
            $devices->updateMetadata($device, $metadata);
        }

        $telemetry = Arr::get($this->payload, 'telemetry', []);
        $reportedIsOn = $this->payload['reported_is_on'] ?? null;
        $flow = $this->payload['flow_l_min'] ?? $telemetry['flow'] ?? $telemetry['flow_l_min'] ?? null;

        $previousReported = $device->reported_is_on;
        $device = $devices->recordTelemetry($device, $telemetry, $reportedIsOn, $this->payload['ip'] ?? null);

        $recordedAt = isset($this->payload['received_at'])
            ? Carbon::parse($this->payload['received_at'])
            : Carbon::now();

        $results = $calculator->compute($device, $telemetry, [
            'flow_l_min' => $flow,
            'temperature_c' => Arr::get($telemetry, 'temperature'),
            'pressure_bar' => Arr::get($telemetry, 'pressure'),
        ]);

        $measurement = $device->measurements()->create([
            'recorded_at' => $recordedAt,
            'payload' => $this->payload['payload'] ?? $telemetry,
            'flow_l_min' => $results['flow_l_min'],
            'pressure_bar' => $results['pressure_bar'],
            'temperature_c' => $results['temperature_c'],
            'voltage_v' => $results['voltage_v'],
            'current_a' => $results['current_a'],
            'velocity_m_s' => $results['velocity_m_s'],
            'density_kg_m3' => $results['density_kg_m3'],
            'dynamic_viscosity_pa_s' => $results['dynamic_viscosity_pa_s'],
            'reynolds_number' => $results['reynolds_number'],
            'friction_factor' => $results['friction_factor'],
            'pressure_drop_pa' => $results['pressure_drop_pa'],
            'head_loss_m' => $results['head_loss_m'],
            'hydraulic_power_w' => $results['hydraulic_power_w'],
            'calculation_details' => $results['details'] ?? null,
        ]);

        if ($reportedIsOn !== null && $previousReported !== $reportedIsOn) {
            $device->pumpEvents()->create([
                'recorded_at' => $recordedAt,
                'state' => $reportedIsOn ? PumpEvent::STATE_ON : PumpEvent::STATE_OFF,
                'context' => [
                    'source' => 'telemetry',
                ],
            ]);
        }

        event(new TelemetryUpdated($device, $measurement));
    }
}
