<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PumpEvent>
 */
class PumpEventFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $state = $this->faker->boolean() ? \App\Models\PumpEvent::STATE_ON : \App\Models\PumpEvent::STATE_OFF;

        return [
            'device_id' => \App\Models\Device::factory(),
            'recorded_at' => Carbon::now()->subMinutes($this->faker->numberBetween(0, 240)),
            'state' => $state,
            'context' => [
                'source' => $this->faker->randomElement(['device', 'dashboard']),
                'note' => $this->faker->sentence(),
            ],
        ];
    }
}
