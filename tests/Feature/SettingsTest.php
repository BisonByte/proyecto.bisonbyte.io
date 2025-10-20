<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SettingsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');
    }

    protected function authenticate(): void
    {
        $response = $this->post('/login', [
            'username' => config('demo.credentials.username'),
            'password' => 'demo',
        ]);

        $response->assertRedirect(route('dashboard'));

        $this->assertTrue(session()->get('demo_authenticated', false));
    }

    public function test_settings_page_shows_defaults(): void
    {
        $this->authenticate();

        $this->get('/settings')
            ->assertOk()
            ->assertSee('Configuración ESP32')
            ->assertSee('Credenciales de demostración');
    }

    public function test_can_update_demo_credentials(): void
    {
        $this->authenticate();

        $response = $this->put('/settings/demo', [
            'username' => 'tester',
            'password' => 'secret123',
        ]);

        $response->assertRedirect(route('settings.edit'))
            ->assertSessionHasNoErrors()
            ->assertSessionHas('status', 'Credenciales de acceso actualizadas.');

        $this->get('/settings')->assertSee('Credenciales de acceso actualizadas.');

        $saved = json_decode(Storage::disk('local')->get('settings.json'), true);

        $this->assertSame('tester', $saved['demo']['username']);
        $this->assertArrayHasKey('password_hash', $saved['demo']);
        $this->assertTrue(password_verify('secret123', $saved['demo']['password_hash']));
    }

    public function test_can_update_esp32_configuration(): void
    {
        $this->authenticate();

        $payload = [
            'enabled' => '1',
            'device_id' => 'BB-NEW-01',
            'firmware_version' => '2.1.0',
            'activation_mode' => 'mqtt',
            'http_endpoint' => 'https://api.example.com/activate',
            'mqtt_topic' => 'iot/new/topic',
            'activation_key' => 'KEY-2025',
        ];

        $response = $this->put('/settings/esp32', $payload);

        $response->assertRedirect(route('settings.edit'))
            ->assertSessionHasNoErrors()
            ->assertSessionHas('status', 'Configuración del ESP32 actualizada.');

        $this->get('/settings')->assertSee('Configuración del ESP32 actualizada.');

        $saved = json_decode(Storage::disk('local')->get('settings.json'), true);

        $this->assertTrue($saved['esp32']['enabled']);
        $this->assertSame('BB-NEW-01', $saved['esp32']['device_id']);
        $this->assertSame('mqtt', $saved['esp32']['activation_mode']);
    }

    public function test_can_update_fluid_selection(): void
    {
        $this->authenticate();

        $response = $this->put('/settings/fluid', [
            'selection' => 'thermal-oil-vg32',
            'redirect_to' => route('dashboard'),
        ]);

        $response->assertRedirect(route('dashboard'))
            ->assertSessionHasNoErrors()
            ->assertSessionHas('fluid_status', 'Fluido operativo actualizado.');

        $saved = json_decode(Storage::disk('local')->get('settings.json'), true);

        $this->assertSame('thermal-oil-vg32', $saved['fluid']['selection']);
    }
}
