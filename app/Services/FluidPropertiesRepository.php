<?php

namespace App\Services;

class FluidPropertiesRepository
{
    public function __construct(private readonly SettingsRepository $settings)
    {
    }

    /**
     * Devuelve la llave del fluido actualmente seleccionado en la configuración.
     */
    public function getSelectionKey(): string
    {
        return $this->settings->getFluidSelection();
    }

    /**
     * Devuelve el catálogo completo de fluidos definidos en la configuración.
     */
    public function getCatalog(): array
    {
        $catalog = config('fluid.catalog', []);

        $withKeys = [];

        foreach ($catalog as $key => $entry) {
            $withKeys[$key] = array_merge($entry, [
                'key' => $key,
            ]);
        }

        return $withKeys;
    }

    /**
     * Recupera el fluido seleccionado con todos sus atributos.
     */
    public function getSelected(): array
    {
        $catalog = $this->getCatalog();
        $key = $this->getSelectionKey();

        return $catalog[$key] ?? [];
    }

    /**
     * Agrupa los datos listos para ser consumidos en el dashboard.
     */
    public function forDashboard(): array
    {
        $catalog = $this->getCatalog();
        $selectedKey = $this->getSelectionKey();

        $selected = $catalog[$selectedKey] ?? [];

        $alternatives = array_values(array_filter(
            $catalog,
            fn (array $entry) => ($entry['key'] ?? null) !== $selectedKey
        ));

        return [
            'selected' => $selected,
            'catalog' => array_values($catalog),
            'alternatives' => $alternatives,
            'selected_key' => $selectedKey,
        ];
    }
}
