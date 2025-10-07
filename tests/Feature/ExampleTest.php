<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_home_redirects_to_login(): void
    {
        $response = $this->get('/');

        $response->assertRedirect(route('login'));
    }

    public function test_successful_demo_login_redirects_to_dashboard(): void
    {
        $response = $this->post('/login', [
            'username' => config('demo.credentials.username'),
            'password' => config('demo.credentials.password'),
        ]);

        $response->assertRedirect(route('dashboard'));

        $this->followRedirects($response)
            ->assertSee('Centro de control IoT')
            ->assertSee('Resumen del ESP32')
            ->assertSee('Gestionar configuración');
    }
}
