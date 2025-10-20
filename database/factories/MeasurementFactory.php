<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Measurement>
 */
class MeasurementFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $recordedAt = now()->subSeconds($this->faker->numberBetween(0, 3600));
        $flow = $this->faker->randomFloat(2, 5, 40);
        $pressure = $this->faker->randomFloat(2, 1.2, 3.5);
        $temperature = $this->faker->randomFloat(2, 20, 40);
        $voltage = $this->faker->randomFloat(2, 215, 230);
        $current = $this->faker->randomFloat(2, 2, 9);

        return [
            'device_id' => \App\Models\Device::factory(),
            'recorded_at' => $recordedAt,
            'payload' => [
                'flow' => $flow,
                'pressure' => $pressure,
                'temperature' => $temperature,
                'voltage' => $voltage,
                'current' => $current,
            ],
            'flow_l_min' => $flow,
            'pressure_bar' => $pressure,
            'temperature_c' => $temperature,
            'voltage_v' => $voltage,
            'current_a' => $current,
            'velocity_m_s' => $this->faker->randomFloat(3, 0.5, 2.8),
            'density_kg_m3' => $this->faker->randomFloat(2, 980, 1050),
            'dynamic_viscosity_pa_s' => $this->faker->randomFloat(5, 0.002, 0.012),
            'reynolds_number' => $this->faker->randomFloat(2, 2000, 14000),
            'friction_factor' => $this->faker->randomFloat(5, 0.01, 0.09),
            'pressure_drop_pa' => $this->faker->randomFloat(2, 1000, 20000),
            'head_loss_m' => $this->faker->randomFloat(2, 0.3, 8),
            'hydraulic_power_w' => $this->faker->randomFloat(2, 80, 320),
            'calculation_details' => [
                'method' => 'factory-seeded',
            ],
        ];
    }
}
