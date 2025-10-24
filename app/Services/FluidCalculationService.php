<?php

namespace App\Services;

use App\Models\Device;
use Illuminate\Support\Arr;

class FluidCalculationService
{
    public function __construct(private readonly FluidPropertiesRepository $fluids)
    {
    }

    public function compute(Device $device, array $telemetry, array $context = []): array
    {
        $pipe = config('hydraulics.pipe');
        $fluidKey = $this->fluids->getSelectionKey();
        $fluidData = config("hydraulics.fluids.$fluidKey", []);

        $diameter = (float) ($context['diameter_m'] ?? Arr::get($pipe, 'diameter_m', 0.025));
        $length = (float) ($context['length_m'] ?? Arr::get($pipe, 'length_m', 10));
        $roughness = (float) ($context['roughness_m'] ?? Arr::get($pipe, 'roughness_m', 0.000045));

        $flowLMin = $context['flow_l_min'] ?? $telemetry['flow_l_min'] ?? $telemetry['flow'] ?? null;
        $pressureBar = $context['pressure_bar'] ?? $telemetry['pressure'] ?? null;
        $temperature = $context['temperature_c'] ?? $telemetry['temperature'] ?? null;
        $voltage = $telemetry['voltage'] ?? null;
        $current = $telemetry['current'] ?? null;

        $density = $this->resolveDensity($fluidData, $temperature, $context);
        $viscosity = $this->resolveViscosity($fluidData, $temperature, $context);
        $flowM3s = $this->convertFlowToCubicMetersPerSecond($flowLMin);
        $velocity = $this->computeVelocity($flowM3s, $diameter);

        $reynolds = $this->computeReynolds($density, $velocity, $diameter, $viscosity);
        $frictionFactor = $this->computeFrictionFactor($reynolds, $roughness, $diameter);
        $pressureDrop = $this->computePressureDrop($frictionFactor, $length, $diameter, $density, $velocity);
        $headLoss = $this->computeHeadLoss($pressureDrop, $density);
        $hydraulicPower = $this->computeHydraulicPower($pressureDrop, $flowM3s);

        return [
            'flow_l_min' => $flowLMin,
            'pressure_bar' => $pressureBar,
            'temperature_c' => $temperature,
            'voltage_v' => $voltage,
            'current_a' => $current,
            'density_kg_m3' => $density,
            'dynamic_viscosity_pa_s' => $viscosity,
            'velocity_m_s' => $velocity,
            'reynolds_number' => $reynolds,
            'friction_factor' => $frictionFactor,
            'pressure_drop_pa' => $pressureDrop,
            'head_loss_m' => $headLoss,
            'hydraulic_power_w' => $hydraulicPower,
            'details' => [
                'fluid_key' => $fluidKey,
                'pipe' => [
                    'diameter_m' => $diameter,
                    'length_m' => $length,
                    'roughness_m' => $roughness,
                ],
            ],
        ];
    }

    private function resolveDensity(array $fluidData, ?float $temperature, array $context): ?float
    {
        if (isset($context['density_kg_m3'])) {
            return (float) $context['density_kg_m3'];
        }

        if (isset($fluidData['density_kg_m3'])) {
            return (float) $fluidData['density_kg_m3'];
        }

        return null;
    }

    private function resolveViscosity(array $fluidData, ?float $temperature, array $context): ?float
    {
        if (isset($context['dynamic_viscosity_pa_s'])) {
            return (float) $context['dynamic_viscosity_pa_s'];
        }

        $referenceViscosity = Arr::get($fluidData, 'viscosity.reference_mpa_s');
        $referenceTemp = Arr::get($fluidData, 'viscosity.reference_temp_c', 25);
        $beta = Arr::get($fluidData, 'viscosity.temp_coefficient', 0.025);

        if ($referenceViscosity === null) {
            return null;
        }

        $base = (float) $referenceViscosity * 1e-3; // convert mPa·s to Pa·s

        if ($temperature === null) {
            return $base;
        }

        $delta = $temperature - $referenceTemp;

        return $base * exp(-$beta * $delta);
    }

    private function convertFlowToCubicMetersPerSecond($flowLMin): ?float
    {
        if ($flowLMin === null) {
            return null;
        }

        return ((float) $flowLMin) / 1000.0 / 60.0;
    }

    private function computeVelocity(?float $flowM3s, float $diameter): ?float
    {
        if ($flowM3s === null || $diameter <= 0) {
            return null;
        }

        $area = M_PI * pow($diameter, 2) / 4;

        if ($area <= 0) {
            return null;
        }

        return $flowM3s / $area;
    }

    private function computeReynolds(?float $density, ?float $velocity, float $diameter, ?float $viscosity): ?float
    {
        if ($density === null || $velocity === null || $viscosity === null || $viscosity <= 0) {
            return null;
        }

        return ($density * $velocity * $diameter) / $viscosity;
    }

    private function computeFrictionFactor(?float $reynolds, float $roughness, float $diameter): ?float
    {
        if ($reynolds === null || $reynolds <= 0) {
            return null;
        }

        if ($reynolds < 2300) {
            return 64 / $reynolds;
        }

        $relativeRoughness = $diameter > 0 ? $roughness / $diameter : 0;

        return 0.25 / pow(log10(($relativeRoughness / 3.7) + (5.74 / pow($reynolds, 0.9))), 2);
    }

    private function computePressureDrop(?float $frictionFactor, float $length, float $diameter, ?float $density, ?float $velocity): ?float
    {
        if ($frictionFactor === null || $density === null || $velocity === null || $diameter <= 0) {
            return null;
        }

        return $frictionFactor * ($length / $diameter) * ($density * pow($velocity, 2) / 2);
    }

    private function computeHeadLoss(?float $pressureDrop, ?float $density): ?float
    {
        if ($pressureDrop === null || $density === null || $density <= 0) {
            return null;
        }

        $g = 9.80665;

        return $pressureDrop / ($density * $g);
    }

    private function computeHydraulicPower(?float $pressureDrop, ?float $flowM3s): ?float
    {
        if ($pressureDrop === null || $flowM3s === null) {
            return null;
        }

        return $pressureDrop * $flowM3s;
    }
}
