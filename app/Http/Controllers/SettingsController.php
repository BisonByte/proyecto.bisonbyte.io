<?php

namespace App\Http\Controllers;

use App\Services\SettingsRepository;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\View\View;

class SettingsController extends Controller
{
    public function __construct(private readonly SettingsRepository $settings)
    {
    }

    public function edit(Request $request): View
    {
        $settings = $this->settings->all();

        return view('settings.edit', [
            'esp32' => $settings['esp32'],
            'demo' => $settings['demo'],
            'status' => $request->session()->get('status'),
        ]);
    }

    public function updateEsp32(Request $request): RedirectResponse
    {
        $request->merge([
            'http_endpoint' => $request->filled('http_endpoint') ? $request->input('http_endpoint') : null,
            'mqtt_topic' => $request->filled('mqtt_topic') ? $request->input('mqtt_topic') : null,
        ]);

        $data = $request->validate([
            'enabled' => ['nullable', 'boolean'],
            'device_id' => ['required', 'string', 'max:64'],
            'firmware_version' => ['required', 'string', 'max:32'],
            'activation_mode' => ['required', 'in:http,mqtt'],
            'http_endpoint' => ['nullable', 'url'],
            'mqtt_topic' => ['nullable', 'string', 'max:120'],
            'activation_key' => ['required', 'string', 'max:120'],
        ]);

        $data['enabled'] = $request->boolean('enabled');

        $this->settings->updateEsp32($data);

        return redirect()->route('settings.edit')->with('status', __('Configuración del ESP32 actualizada.'));
    }

    public function updateDemo(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'username' => ['required', 'string', 'max:60'],
            'password' => ['required', 'string', 'max:60'],
        ]);

        $this->settings->updateDemo($data);

        return redirect()->route('settings.edit')->with('status', __('Credenciales de acceso actualizadas.'));
    }

    public function updateFluid(Request $request): RedirectResponse
    {
        $catalogKeys = array_keys(config('fluid.catalog', []));

        $data = $request->validate([
            'selection' => ['required', 'string', Rule::in($catalogKeys)],
        ]);

        $this->settings->updateFluidSelection($data['selection']);

        $redirectTo = $request->input('redirect_to');

        return $redirectTo
            ? redirect()->to($redirectTo)->with('fluid_status', __('Fluido operativo actualizado.'))
            : redirect()->route('settings.edit')->with('status', __('Fluido operativo actualizado.'));
    }
}
