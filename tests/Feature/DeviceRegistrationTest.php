<?php

namespace Tests\Feature;

use App\Models\Device;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class DeviceRegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registers_new_device_with_hashed_token(): void
    {
        $payload = [
            'mac' => 'AA:BB:CC:DD:EE:FF',
            'name' => 'ESP32 Demo',
            'firmware' => 'v1.2.3',
            'ip' => '192.168.1.10',
            'connection_type' => 'http',
        ];

        $response = $this->postJson(route('api.devices.register'), $payload);

        $response->assertCreated()
            ->assertJsonStructure([
                'device_id',
                'token',
                'token_expires_at',
                'connection_type',
                'http' => ['state', 'set', 'telemetry', 'poll_seconds'],
            ]);

        $token = $response->json('token');

        $this->assertTrue(is_string($token) && Str::length($token) === 60);

        $device = Device::firstOrFail();
        $this->assertSame(hash('sha256', $token), $device->token);
        $this->assertNotNull($device->token_expires_at);
    }

    public function test_re_registration_rotates_token(): void
    {
        $payload = [
            'mac' => 'AA:AA:AA:AA:AA:01',
        ];

        $first = $this->postJson(route('api.devices.register'), $payload)->json('token');
        $second = $this->postJson(route('api.devices.register'), $payload)->json('token');

        $this->assertNotSame($first, $second);

        $device = Device::where('mac', 'AA:AA:AA:AA:AA:01')->firstOrFail();
        $this->assertSame(hash('sha256', $second), $device->token);
    }
}
