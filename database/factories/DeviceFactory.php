<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Device>
 */
class DeviceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'mac' => strtoupper(str_replace(':', '', $this->faker->macAddress())),
            'name' => 'ESP32 #' . $this->faker->unique()->numberBetween(1, 999),
            'firmware' => 'v' . $this->faker->randomFloat(1, 1.0, 2.9),
            'ip' => $this->faker->ipv4(),
            'topic' => 'iot/bisonbyte/' . $this->faker->uuid(),
            'connection_type' => $this->faker->randomElement(['http', 'mqtt']),
            'token' => Str::random(60),
            'token_expires_at' => Carbon::now()->addDays(30),
            'should_run' => $this->faker->boolean(),
            'reported_is_on' => $this->faker->boolean(),
            'telemetry' => [
                'voltage' => $this->faker->randomFloat(1, 210, 230),
                'current' => $this->faker->randomFloat(2, 0, 12),
                'battery' => $this->faker->randomFloat(1, 60, 100),
            ],
            'last_seen_at' => Carbon::now()->subMinutes($this->faker->numberBetween(0, 120)),
            'last_telemetry_at' => Carbon::now()->subMinutes($this->faker->numberBetween(0, 120)),
            'last_command_at' => Carbon::now()->subMinutes($this->faker->numberBetween(0, 120)),
        ];
    }
}
