<?php

namespace App\Services;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;

class SettingsRepository
{
    private const STORAGE_PATH = 'settings.json';

    public function all(): array
    {
        return array_replace_recursive($this->defaults(), $this->read());
    }

    public function getEsp32(): array
    {
        return $this->all()['esp32'];
    }

    public function getDemoCredentials(): array
    {
        return $this->all()['demo'];
    }

    public function updateEsp32(array $data): void
    {
        $settings = $this->all();

        $settings['esp32'] = array_merge($settings['esp32'], [
            'enabled' => (bool) Arr::get($data, 'enabled', false),
            'device_id' => Arr::get($data, 'device_id'),
            'firmware_version' => Arr::get($data, 'firmware_version'),
            'activation_mode' => Arr::get($data, 'activation_mode'),
            'http_endpoint' => Arr::get($data, 'http_endpoint'),
            'mqtt_topic' => Arr::get($data, 'mqtt_topic'),
            'activation_key' => Arr::get($data, 'activation_key'),
            'http_state_endpoint' => Arr::get($data, 'http_state_endpoint', Arr::get($settings['esp32'], 'http_state_endpoint')),
            'http_set_endpoint' => Arr::get($data, 'http_set_endpoint', Arr::get($settings['esp32'], 'http_set_endpoint')),
            'http_telemetry_endpoint' => Arr::get($data, 'http_telemetry_endpoint', Arr::get($settings['esp32'], 'http_telemetry_endpoint')),
            'http_poll_seconds' => Arr::get($data, 'http_poll_seconds', Arr::get($settings['esp32'], 'http_poll_seconds', 2)),
        ]);

        $this->write($settings);
    }

    public function updateDemo(array $data): void
    {
        $settings = $this->all();

        $settings['demo'] = array_merge($settings['demo'], [
            'username' => Arr::get($data, 'username'),
            'password' => Arr::get($data, 'password'),
        ]);

        $this->write($settings);
    }

    private function defaults(): array
    {
        return [
            'demo' => config('demo.credentials'),
            'esp32' => config('device.esp32'),
            'fluid' => [
                'selection' => config('fluid.default'),
            ],
        ];
    }

    private function read(): array
    {
        if (! Storage::disk('local')->exists(self::STORAGE_PATH)) {
            return [];
        }

        $raw = Storage::disk('local')->get(self::STORAGE_PATH);

        try {
            return json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return [];
        }
    }

    private function write(array $settings): void
    {
        Storage::disk('local')->put(
            self::STORAGE_PATH,
            json_encode($settings, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
        );
    }

    public function getFluid(): array
    {
        return $this->all()['fluid'];
    }

    public function getFluidSelection(): string
    {
        $selection = $this->getFluid()['selection'] ?? config('fluid.default');

        $catalog = config('fluid.catalog', []);

        return array_key_exists($selection, $catalog) ? $selection : config('fluid.default');
    }

    public function updateFluidSelection(string $selection): void
    {
        $catalog = config('fluid.catalog', []);

        if (! array_key_exists($selection, $catalog)) {
            $selection = config('fluid.default');
        }

        $settings = $this->all();
        $settings['fluid']['selection'] = $selection;

        $this->write($settings);
    }
}
