@extends('layouts.app')

@section('title', 'Control IoT • Dashboard')

@push('head')
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.6/dist/chart.umd.min.js" defer></script>
@endpush

@section('content')
    @php
        $isOn = $pumpState['isOn'];
        $statusOn = 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
        $statusOff = 'border border-rose-500/30 bg-rose-500/10 text-rose-200';
        $toggleBase = 'group relative flex h-28 w-28 items-center justify-center rounded-full text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-white/20 shadow-lg';
        $toggleOn = 'bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 text-emerald-50 shadow-emerald-500/40';
        $toggleOff = 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 text-white/90 shadow-slate-900/40';
        $esp32Enabled = (bool) ($esp32Config['enabled'] ?? false);
        $activationMode = strtoupper($esp32Config['activation_mode'] ?? 'http');
        $activationTag = $esp32Enabled ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200' : 'border-amber-500/40 bg-amber-500/10 text-amber-200';
        $fluidSelection = $fluidProperties['selected'] ?? [];
        $fluidSelectedKey = $fluidProperties['selected_key'] ?? null;
        $fluidCatalog = $fluidProperties['catalog'] ?? [];
        $fluidAlternatives = $fluidProperties['alternatives'] ?? [];
        $fluidSummaryProperties = array_slice($fluidSelection['properties'] ?? [], 0, 2);

        $calculatorFluids = [
            'water' => 'Agua (líquida)',
            'air' => 'Aire (gas)',
            'acetone' => 'Acetona',
            'ethanol' => 'Alcohol etílico',
            'glycerin' => 'Glicerina',
            'mercury' => 'Mercurio',
            'propane' => 'Propano líquido',
        ];

        $thermoTables = [
            'fluids' => [
                ['name' => 'Acetona', 'sg' => '0.787', 'gamma' => '7.72', 'rho' => '787', 'mu' => '3.16 x 10^-4', 'nu' => '4.02 x 10^-7'],
                ['name' => 'Alcohol etílico', 'sg' => '0.787', 'gamma' => '7.72', 'rho' => '787', 'mu' => '1.00 x 10^-3', 'nu' => '1.27 x 10^-6'],
                ['name' => 'Alcohol metílico', 'sg' => '0.789', 'gamma' => '7.74', 'rho' => '789', 'mu' => '5.60 x 10^-4', 'nu' => '7.10 x 10^-7'],
                ['name' => 'Alcohol propílico', 'sg' => '0.802', 'gamma' => '7.87', 'rho' => '802', 'mu' => '1.92 x 10^-3', 'nu' => '2.39 x 10^-6'],
                ['name' => 'Amoniaco hidratado (25%)', 'sg' => '0.910', 'gamma' => '8.93', 'rho' => '910', 'mu' => '6.03 x 10^-4', 'nu' => '6.63 x 10^-7'],
                ['name' => 'Benceno', 'sg' => '0.876', 'gamma' => '8.59', 'rho' => '876', 'mu' => '6.03 x 10^-4', 'nu' => '6.88 x 10^-7'],
                ['name' => 'Tetracloruro de carbono', 'sg' => '1.590', 'gamma' => '15.60', 'rho' => '1 590', 'mu' => '9.61 x 10^-4', 'nu' => '6.05 x 10^-7'],
                ['name' => 'Aceite de ricino', 'sg' => '0.960', 'gamma' => '9.42', 'rho' => '960', 'mu' => '9.86 x 10^-1', 'nu' => '1.03 x 10^-3'],
                ['name' => 'Etilenglicol', 'sg' => '1.100', 'gamma' => '10.79', 'rho' => '1 100', 'mu' => '1.60 x 10^-2', 'nu' => '1.45 x 10^-5'],
                ['name' => 'Gasolina', 'sg' => '0.680', 'gamma' => '6.67', 'rho' => '680', 'mu' => '3.90 x 10^-4', 'nu' => '5.74 x 10^-7'],
                ['name' => 'Glicerina', 'sg' => '1.258', 'gamma' => '12.34', 'rho' => '1 258', 'mu' => '1.41 x 10^-1', 'nu' => '1.12 x 10^-4'],
                ['name' => 'Queroseno', 'sg' => '0.810', 'gamma' => '7.95', 'rho' => '810', 'mu' => '1.64 x 10^-3', 'nu' => '2.03 x 10^-6'],
                ['name' => 'Aceite de linaza', 'sg' => '0.930', 'gamma' => '9.13', 'rho' => '930', 'mu' => '2.42 x 10^-2', 'nu' => '2.60 x 10^-5'],
                ['name' => 'Mercurio', 'sg' => '13.54', 'gamma' => '132.8', 'rho' => '13 540', 'mu' => '1.53 x 10^-3', 'nu' => '1.13 x 10^-7'],
                ['name' => 'Propano', 'sg' => '0.495', 'gamma' => '4.86', 'rho' => '495', 'mu' => '1.86 x 10^-3', 'nu' => '3.76 x 10^-6'],
                ['name' => 'Agua de mar', 'sg' => '1.030', 'gamma' => '10.10', 'rho' => '1 030', 'mu' => '1.08 x 10^-3', 'nu' => '1.05 x 10^-6'],
                ['name' => 'Aguarrás', 'sg' => '0.870', 'gamma' => '8.54', 'rho' => '870', 'mu' => '1.03 x 10^-3', 'nu' => '1.18 x 10^-6'],
                ['name' => 'Combustóleo medio', 'sg' => '0.852', 'gamma' => '8.35', 'rho' => '852', 'mu' => '2.99 x 10^-2', 'nu' => '3.51 x 10^-5'],
                ['name' => 'Combustóleo pesado', 'sg' => '0.906', 'gamma' => '8.89', 'rho' => '906', 'mu' => '1.07 x 10^-1', 'nu' => '1.18 x 10^-4'],
            ],
            'water_si' => [
                ['t' => '0', 'gamma' => '9.81', 'rho' => '1 000', 'mu' => '1.75 x 10^-3', 'nu' => '1.75 x 10^-6'],
                ['t' => '5', 'gamma' => '9.81', 'rho' => '1 000', 'mu' => '1.52 x 10^-3', 'nu' => '1.52 x 10^-6'],
                ['t' => '10', 'gamma' => '9.80', 'rho' => '999', 'mu' => '1.31 x 10^-3', 'nu' => '1.31 x 10^-6'],
                ['t' => '15', 'gamma' => '9.80', 'rho' => '999', 'mu' => '1.14 x 10^-3', 'nu' => '1.14 x 10^-6'],
                ['t' => '20', 'gamma' => '9.79', 'rho' => '998', 'mu' => '1.00 x 10^-3', 'nu' => '1.00 x 10^-6'],
                ['t' => '25', 'gamma' => '9.78', 'rho' => '997', 'mu' => '8.94 x 10^-4', 'nu' => '8.97 x 10^-7'],
                ['t' => '30', 'gamma' => '9.77', 'rho' => '996', 'mu' => '7.97 x 10^-4', 'nu' => '8.00 x 10^-7'],
                ['t' => '40', 'gamma' => '9.71', 'rho' => '992', 'mu' => '6.53 x 10^-4', 'nu' => '6.58 x 10^-7'],
                ['t' => '50', 'gamma' => '9.65', 'rho' => '988', 'mu' => '5.47 x 10^-4', 'nu' => '5.54 x 10^-7'],
                ['t' => '60', 'gamma' => '9.59', 'rho' => '983', 'mu' => '4.66 x 10^-4', 'nu' => '4.74 x 10^-7'],
                ['t' => '70', 'gamma' => '9.52', 'rho' => '978', 'mu' => '4.04 x 10^-4', 'nu' => '4.13 x 10^-7'],
                ['t' => '80', 'gamma' => '9.45', 'rho' => '972', 'mu' => '3.55 x 10^-4', 'nu' => '3.65 x 10^-7'],
                ['t' => '90', 'gamma' => '9.38', 'rho' => '965', 'mu' => '3.18 x 10^-4', 'nu' => '3.30 x 10^-7'],
                ['t' => '100', 'gamma' => '9.28', 'rho' => '958', 'mu' => '2.82 x 10^-4', 'nu' => '2.94 x 10^-7'],
            ],
            'water_imperial' => [
                ['t' => '32', 'gamma' => '62.4', 'rho' => '1.94', 'mu' => '3.66 x 10^-5', 'nu' => '1.89 x 10^-5'],
                ['t' => '40', 'gamma' => '62.4', 'rho' => '1.94', 'mu' => '3.23 x 10^-5', 'nu' => '1.67 x 10^-5'],
                ['t' => '50', 'gamma' => '62.4', 'rho' => '1.94', 'mu' => '2.92 x 10^-5', 'nu' => '1.51 x 10^-5'],
                ['t' => '60', 'gamma' => '62.4', 'rho' => '1.94', 'mu' => '2.72 x 10^-5', 'nu' => '1.41 x 10^-5'],
                ['t' => '70', 'gamma' => '62.3', 'rho' => '1.94', 'mu' => '2.04 x 10^-5', 'nu' => '1.05 x 10^-5'],
                ['t' => '80', 'gamma' => '62.2', 'rho' => '1.93', 'mu' => '1.74 x 10^-5', 'nu' => '9.02 x 10^-6'],
                ['t' => '90', 'gamma' => '62.1', 'rho' => '1.93', 'mu' => '1.60 x 10^-5', 'nu' => '8.29 x 10^-6'],
                ['t' => '100', 'gamma' => '62.0', 'rho' => '1.93', 'mu' => '1.50 x 10^-5', 'nu' => '7.77 x 10^-6'],
                ['t' => '120', 'gamma' => '61.9', 'rho' => '1.92', 'mu' => '1.26 x 10^-5', 'nu' => '6.57 x 10^-6'],
                ['t' => '140', 'gamma' => '61.7', 'rho' => '1.92', 'mu' => '1.09 x 10^-5', 'nu' => '5.68 x 10^-6'],
                ['t' => '160', 'gamma' => '61.4', 'rho' => '1.91', 'mu' => '9.86 x 10^-6', 'nu' => '5.16 x 10^-6'],
                ['t' => '180', 'gamma' => '61.1', 'rho' => '1.90', 'mu' => '8.70 x 10^-6', 'nu' => '4.58 x 10^-6'],
                ['t' => '200', 'gamma' => '60.7', 'rho' => '1.89', 'mu' => '7.70 x 10^-6', 'nu' => '4.07 x 10^-6'],
                ['t' => '212', 'gamma' => '59.8', 'rho' => '1.86', 'mu' => '5.89 x 10^-6', 'nu' => '3.17 x 10^-6'],
            ],
            'air_si' => [
                ['t' => '-40', 'gamma' => '14.85', 'rho' => '1.514', 'mu' => '1.51 x 10^-5', 'nu' => '9.98 x 10^-6'],
                ['t' => '-30', 'gamma' => '14.24', 'rho' => '1.452', 'mu' => '1.56 x 10^-5', 'nu' => '1.08 x 10^-5'],
                ['t' => '-20', 'gamma' => '13.67', 'rho' => '1.394', 'mu' => '1.61 x 10^-5', 'nu' => '1.15 x 10^-5'],
                ['t' => '-10', 'gamma' => '13.15', 'rho' => '1.341', 'mu' => '1.65 x 10^-5', 'nu' => '1.23 x 10^-5'],
                ['t' => '0', 'gamma' => '12.65', 'rho' => '1.292', 'mu' => '1.71 x 10^-5', 'nu' => '1.32 x 10^-5'],
                ['t' => '10', 'gamma' => '12.23', 'rho' => '1.247', 'mu' => '1.76 x 10^-5', 'nu' => '1.41 x 10^-5'],
                ['t' => '20', 'gamma' => '11.79', 'rho' => '1.204', 'mu' => '1.81 x 10^-5', 'nu' => '1.50 x 10^-5'],
                ['t' => '30', 'gamma' => '11.42', 'rho' => '1.164', 'mu' => '1.86 x 10^-5', 'nu' => '1.60 x 10^-5'],
                ['t' => '40', 'gamma' => '11.05', 'rho' => '1.127', 'mu' => '1.92 x 10^-5', 'nu' => '1.70 x 10^-5'],
                ['t' => '50', 'gamma' => '10.70', 'rho' => '1.092', 'mu' => '1.97 x 10^-5', 'nu' => '1.81 x 10^-5'],
                ['t' => '60', 'gamma' => '10.37', 'rho' => '1.058', 'mu' => '2.02 x 10^-5', 'nu' => '1.91 x 10^-5'],
                ['t' => '70', 'gamma' => '10.05', 'rho' => '1.026', 'mu' => '2.07 x 10^-5', 'nu' => '2.02 x 10^-5'],
                ['t' => '80', 'gamma' => '9.75', 'rho' => '0.995', 'mu' => '2.12 x 10^-5', 'nu' => '2.13 x 10^-5'],
                ['t' => '90', 'gamma' => '9.47', 'rho' => '0.966', 'mu' => '2.17 x 10^-5', 'nu' => '2.25 x 10^-5'],
                ['t' => '100', 'gamma' => '9.20', 'rho' => '0.938', 'mu' => '2.22 x 10^-5', 'nu' => '2.37 x 10^-5'],
                ['t' => '110', 'gamma' => '8.94', 'rho' => '0.912', 'mu' => '2.26 x 10^-5', 'nu' => '2.48 x 10^-5'],
                ['t' => '120', 'gamma' => '8.70', 'rho' => '0.887', 'mu' => '2.31 x 10^-5', 'nu' => '2.61 x 10^-5'],
            ],
            'air_imperial' => [
                ['t' => '-40', 'rho' => '2.94 x 10^-3', 'gamma' => '0.0946', 'mu' => '3.15 x 10^-7', 'nu' => '1.07 x 10^-4'],
                ['t' => '-20', 'rho' => '2.80 x 10^-3', 'gamma' => '0.0903', 'mu' => '3.37 x 10^-7', 'nu' => '1.20 x 10^-4'],
                ['t' => '0', 'rho' => '2.68 x 10^-3', 'gamma' => '0.0864', 'mu' => '3.58 x 10^-7', 'nu' => '1.34 x 10^-4'],
                ['t' => '20', 'rho' => '2.57 x 10^-3', 'gamma' => '0.0828', 'mu' => '3.80 x 10^-7', 'nu' => '1.48 x 10^-4'],
                ['t' => '40', 'rho' => '2.47 x 10^-3', 'gamma' => '0.0795', 'mu' => '4.01 x 10^-7', 'nu' => '1.62 x 10^-4'],
                ['t' => '60', 'rho' => '2.37 x 10^-3', 'gamma' => '0.0760', 'mu' => '4.23 x 10^-7', 'nu' => '1.78 x 10^-4'],
                ['t' => '80', 'rho' => '2.28 x 10^-3', 'gamma' => '0.0730', 'mu' => '4.45 x 10^-7', 'nu' => '1.94 x 10^-4'],
                ['t' => '100', 'rho' => '2.19 x 10^-3', 'gamma' => '0.0700', 'mu' => '4.67 x 10^-7', 'nu' => '2.13 x 10^-4'],
                ['t' => '120', 'rho' => '2.10 x 10^-3', 'gamma' => '0.0672', 'mu' => '4.88 x 10^-7', 'nu' => '2.32 x 10^-4'],
                ['t' => '140', 'rho' => '2.02 x 10^-3', 'gamma' => '0.0646', 'mu' => '5.09 x 10^-7', 'nu' => '2.52 x 10^-4'],
                ['t' => '160', 'rho' => '1.94 x 10^-3', 'gamma' => '0.0620', 'mu' => '5.30 x 10^-7', 'nu' => '2.73 x 10^-4'],
                ['t' => '180', 'rho' => '1.87 x 10^-3', 'gamma' => '0.0597', 'mu' => '5.51 x 10^-7', 'nu' => '2.95 x 10^-4'],
                ['t' => '200', 'rho' => '1.80 x 10^-3', 'gamma' => '0.0574', 'mu' => '5.72 x 10^-7', 'nu' => '3.19 x 10^-4'],
                ['t' => '220', 'rho' => '1.74 x 10^-3', 'gamma' => '0.0554', 'mu' => '5.93 x 10^-7', 'nu' => '3.44 x 10^-4'],
                ['t' => '240', 'rho' => '1.68 x 10^-3', 'gamma' => '0.0536', 'mu' => '6.13 x 10^-7', 'nu' => '3.70 x 10^-4'],
            ],
        ];

        $endpoints = [
            'toggle' => route('pump.toggle'),
            'state' => route('pump.state'),
            'stream' => route('telemetry.stream'),
        ];
    @endphp

    <div
        id="dashboard-app"
        data-state="@json($pumpState)"
        data-metrics="@json($metricsSeed)"
        data-telemetry="@json($telemetry)"
        data-measurement="@json($measurement)"
        data-device="@json($deviceMeta)"
        data-endpoints='@json($endpoints)'
        class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
    >
        @if (session('fluid_status'))
            <div class="mb-6 rounded-3xl border border-cyan-500/30 bg-cyan-500/10 px-6 py-5 text-sm text-cyan-100 shadow-lg shadow-cyan-500/20">
                {{ session('fluid_status') }}
            </div>
        @endif

        <header class="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div class="space-y-3">
                <div class="flex items-center gap-3">
                    <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/10 via-blue-500/10 to-indigo-500/10 text-cyan-200">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M11.5 2a1 1 0 00-.8.4l-8 10A1 1 0 003.5 14h7.7l-1.6 6.4a1 1 0 001.8.8l8-10A1 1 0 0018.5 9h-7.7l1.6-6.4A1 1 0 0011.5 2z" /></svg>
                    </div>
                    <div>
                        <p class="text-xs font-semibold uppercase tracking-[0.4em] text-cyan-200">proyecto bisonbyte</p>
                        <h1 class="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Centro de control IoT</h1>
                    </div>
                </div>
                <p class="max-w-xl text-sm text-white/70">
                    Monitoriza en tiempo real el estado de la bomba usando telemetría HTTP enviada por el ESP32.
                    El panel sincroniza comandos y lectura de datos sin necesidad de refrescar la página.
                </p>
            </div>

            <div class="flex w-full flex-col gap-4 self-stretch lg:w-auto lg:max-w-md">
                <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                    <button
                        type="button"
                        data-designer-open
                        aria-controls="designer-panel"
                        aria-haspopup="dialog"
                        aria-expanded="false"
                        class="inline-flex w-full items-center justify-center gap-2 rounded-full border border-sky-500/40 bg-sky-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-sky-100 transition hover:border-sky-400/60 hover:bg-sky-500/20 sm:w-auto sm:justify-start"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M4 2a1 1 0 00-1 1v6a1 1 0 001 1h1.382l1.447 3.894A1 1 0 007.764 14h4.472a1 1 0 00.935-.605L15.166 10H16a1 1 0 001-1V3a1 1 0 00-1-1H4zm5 2h2a1 1 0 010 2H9a1 1 0 010-2z" /></svg>
                        Diseñador hidráulico
                    </button>
                    <button
                        type="button"
                        data-calculator-open
                        aria-controls="calculator-panel"
                        aria-haspopup="dialog"
                        aria-expanded="false"
                        class="inline-flex w-full items-center justify-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-emerald-100 transition hover:border-emerald-400/60 hover:bg-emerald-500/20 sm:w-auto sm:justify-start"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm0 2h8v2H6V4zm0 4h2v2H6V8zm0 4h2v2H6v-2zm4-4h4v2h-4V8zm0 4h4v2h-4v-2z"/></svg>
                        Calculadora de fluidos
                    </button>
                    <a
                        href="{{ route('settings.edit') }}"
                        class="inline-flex w-full items-center justify-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-cyan-100 transition hover:border-cyan-400/60 hover:bg-cyan-500/20 sm:w-auto sm:justify-start"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M11.983 1.272a1 1 0 00-1.966 0l-.208 1.248a7.032 7.032 0 00-1.538.889l-1.15-.459a1 1 0 00-1.115.324L4.12 5.16a1 1 0 00.004 1.23l.796.98a6.99 6.99 0 000 1.26l-.796.98a1 1 0 00-.003 1.23l1.89 2.036a1 1 0 001.114.324l1.15-.459c.482.36 1 .662 1.538.889l.208 1.248a1 1 0 001.966 0l.208-1.248a7.046 7.046 0 001.538-.889l1.15.459a1 1 0 001.114-.324l1.89-2.036a1 1 0 00-.003-1.23l-.796-.98a6.99 6.99 0 000-1.26l.796-.98a1 1 0 00.004-1.23l-1.89-2.036a1 1 0 00-1.115-.324l-1.15.459a7.046 7.046 0 00-1.538-.889l-.208-1.248zM10 12a2 2 0 110-4 2 2 0 010 4z" /></svg>
                        Configuración
                    </a>
                </div>
                <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                    <span
                        data-device-badge
                        class="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2 text-center text-xs font-medium text-white/70 sm:w-auto sm:text-right"
                    >
                        @if ($deviceMeta)
                            ESP32 #{{ $deviceMeta['id'] }} • {{ $deviceMeta['lastSeenAt'] ? \Illuminate\Support\Carbon::parse($deviceMeta['lastSeenAt'])->diffForHumans() : 'registrado' }}
                        @else
                            Esperando registro del ESP32
                        @endif
                    </span>
                    <form action="{{ route('logout') }}" method="POST" class="w-full sm:ml-4 sm:w-auto">
                        @csrf
                        <button
                            type="submit"
                            class="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white/80 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-200 sm:w-auto"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 4.5A1.5 1.5 0 014.5 3h5A1.5 1.5 0 0111 4.5v1a.5.5 0 01-1 0v-1a.5.5 0 00-.5-.5h-5a.5.5 0 00-.5.5v11a.5.5 0 00.5.5h5a.5.5 0 00.5-.5v-1a.5.5 0 011 0v1A1.5 1.5 0 019.5 17h-5A1.5 1.5 0 013 15.5v-11zM13.854 6.146a.5.5 0 10-.708.708L14.293 8H8.5a.5.5 0 000 1h5.793l-1.147 1.146a.5.5 0 10.708.708l2-2a.5.5 0 000-.708l-2-2z" clip-rule="evenodd" /></svg>
                            Salir
                        </button>
                    </form>
                </div>
            </div>
        </header>

        @if ($justLoggedIn)
            <div class="mb-8 rounded-3xl border border-cyan-500/30 bg-cyan-500/10 px-6 py-5 text-sm text-cyan-100 shadow-lg shadow-cyan-500/20">
                ¡Bienvenido al demo! Todos los datos visibles están generados por el simulador de Laravel. La versión
                productiva podrá direccionar comandos al ESP32 mediante API REST o MQTT.
            </div>
        @endif

        <div class="grid gap-8 lg:grid-cols-[320px_1fr] lg:items-start">
            <aside class="space-y-5">
                <div class="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                    <h2 class="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">Sistema</h2>
                    <div class="mt-4 space-y-3 text-sm text-white/70">
                        <p class="flex items-center justify-between">
                            <span class="text-white/60">Identificador</span>
                            <span class="font-semibold text-white">BB-PUMP-01</span>
                        </p>
                        <p class="flex items-center justify-between">
                            <span class="text-white/60">Modo demo</span>
                            <span class="flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-xs font-medium text-cyan-200">
                                <span class="h-1.5 w-1.5 rounded-full bg-cyan-300 animate-pulse"></span>
                                Activo
                            </span>
                        </p>
                        <p class="flex items-center justify-between">
                            <span class="text-white/60">Último despliegue</span>
                            <span class="font-semibold text-white">{{ now()->format('d/m/Y') }}</span>
                        </p>
                    </div>
                </div>

                <div class="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                    <h2 class="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">Conectividad</h2>
                    <ul class="mt-4 space-y-3 text-sm text-white/70">
                        <li class="flex items-start gap-3">
                            <div class="mt-1 flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-200">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M2.166 10.63a.75.75 0 001.06.104 6.5 6.5 0 018.548 0 .75.75 0 00.955-1.164 8 8 0 00-10.53 0 .75.75 0 00-.104 1.06zm2.143 2.572a.75.75 0 001.055-.11 3.5 3.5 0 014.272-.71.75.75 0 10.73-1.318 5 5 0 00-6.102 1.014.75.75 0 00.044 1.124zm2.06 2.328a1.75 1.75 0 112.472 0 1.75 1.75 0 01-2.471 0z" /></svg>
                            </div>
                            <div>
                                <p class="font-semibold text-white">WiFi segura con ESP32</p>
                                <p class="text-xs text-white/60">El firmware recibirá las órdenes desde esta misma vista a través de HTTP o MQTT.</p>
                            </div>
                        </li>
                        <li class="flex items-start gap-3">
                            <div class="mt-1 flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-200">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 00-1 1v1H7a2 2 0 00-2 2v9.382a1.5 1.5 0 102 0V12h6v3.382a1.5 1.5 0 102 0V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H9V3a1 1 0 00-1-1z" /></svg>
                            </div>
                            <div>
                                <p class="font-semibold text-white">Relé industrial 30A</p>
                                <p class="text-xs text-white/60">Canal preparado para manejar cargas de hasta 3HP con paro de emergencia.</p>
                            </div>
                        </li>
                    </ul>
                </div>

                <div class="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                    <h2 class="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">Siguiente fase</h2>
                    <ul class="mt-4 space-y-2 text-sm text-white/70">
                        <li class="flex items-center gap-2">
                            <span class="h-1.5 w-1.5 rounded-full bg-white/30"></span>
                            Integración de sensores de presión y caudal.
                        </li>
                        <li class="flex items-center gap-2">
                            <span class="h-1.5 w-1.5 rounded-full bg-white/30"></span>
                            Alertas automáticas por WhatsApp y correo.
                        </li>
                        <li class="flex items-center gap-2">
                            <span class="h-1.5 w-1.5 rounded-full bg-white/30"></span>
                            Históricos con reportes descargables en PDF.
                        </li>
                    </ul>
                </div>
            </aside>

            <section class="space-y-8">
                <div class="grid gap-6 lg:grid-cols-2">
                    <div class="flex flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
                        <div class="flex items-start justify-between gap-4">
                            <div>
                                <p class="text-xs font-semibold uppercase tracking-[0.4em] text-white/60">Estado general</p>
                                <h2 class="mt-2 text-2xl font-semibold text-white">Control principal</h2>
                            </div>
                            <span
                                data-pump-status
                                data-on-class="{{ $statusOn }}"
                                data-off-class="{{ $statusOff }}"
                                class="inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wide {{ $isOn ? $statusOn : $statusOff }}"
                            >
                                <span class="h-1.5 w-1.5 rounded-full bg-current"></span>
                                <span data-pump-status-text>{{ $pumpState['statusLabel'] }}</span>
                            </span>
                        </div>
                        <p class="mt-4 text-sm text-white/60" data-pump-description>
                            {{
                                $isOn
                                    ? 'La bomba está energizada y el sistema distribuye el caudal programado. Supervisa las métricas para validar operación segura.'
                                    : 'La bomba se encuentra apagada. Puedes iniciar el ciclo en cualquier momento y el sistema empezará a transmitir telemetría.'
                            }}
                        </p>
                        <div class="mt-8 flex flex-col gap-6 xl:flex-row xl:items-center">
                            <button
                                type="button"
                                data-pump-toggle
                                data-on-class="{{ $toggleOn }}"
                                data-off-class="{{ $toggleOff }}"
                                class="{{ $toggleBase }} {{ $isOn ? $toggleOn : $toggleOff }}"
                            >
                                <span class="absolute inset-0 -z-10 rounded-full border border-white/10 blur-xl transition group-hover:border-white/30"></span>
                                <span class="text-center text-base font-semibold">
                                    <span data-pump-toggle-label>{{ $isOn ? 'Apagar bomba' : 'Encender bomba' }}</span>
                                </span>
                            </button>
                            <div class="grid gap-4 text-sm text-white/70 sm:grid-cols-2 xl:grid-cols-1">
                                <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                                    <p class="text-xs uppercase tracking-widest text-white/50">Último cambio</p>
                                    <p class="mt-1 text-sm font-semibold text-white" data-last-changed>{{ $pumpState['lastChangedHuman'] }}</p>
                                </div>
                                <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                                    <p class="text-xs uppercase tracking-widest text-white/50">Tiempo operativo</p>
                                    <p class="mt-1 text-sm font-semibold text-white" data-runtime>{{ $pumpState['totalRuntimeFormatted'] }}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
                        <p class="text-xs font-semibold uppercase tracking-[0.4em] text-white/60">Diagnóstico</p>
                        <h2 class="mt-2 text-2xl font-semibold text-white">Resumen del simulador</h2>
                        <div class="mt-6 space-y-5 text-sm text-white/70">
                            <div class="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                                <div>
                                    <p class="text-xs uppercase tracking-widest text-white/50">Modo de operación</p>
                                    <p class="text-sm font-semibold text-white">Simulación controlada</p>
                                </div>
                                <span class="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1 text-xs font-medium text-cyan-200">100% software</span>
                            </div>
                            <div class="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                                <div>
                                    <p class="text-xs uppercase tracking-widest text-white/50">Integración prevista</p>
                                    <p class="text-sm font-semibold text-white">ESP32 + relé + sensor UPS</p>
                                </div>
                                <span class="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-xs font-medium text-emerald-200">Próxima fase</span>
                            </div>
                            <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                                <p class="text-xs uppercase tracking-widest text-white/50">Notas</p>
                                <ul class="mt-2 space-y-1">
                                    <li>• Los comandos ON/OFF ya envían el evento al simulador de sesión.</li>
                                    <li>• Las métricas de voltaje, corriente y UPS se actualizan cada pocos segundos.</li>
                                    <li>• Preparado para conectar con endpoints REST o MQTT sin refactor mayor.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div class="flex flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
                        <div class="flex items-start justify-between gap-4">
                            <div>
                                <p class="text-xs uppercase tracking-[0.4em] text-white/60">Fluido operativo</p>
                                <h2 class="mt-2 text-2xl font-semibold text-white">{{ $fluidSelection['name'] ?? 'Sin selección' }}</h2>
                                <p class="mt-2 text-sm text-white/60">
                                    {{ $fluidSelection['description'] ?? 'Selecciona un fluido para visualizar densidad, viscosidad y ventanas de operación.' }}
                                </p>
                            </div>
                            @if (! empty($fluidSelection['status']))
                                <span class="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-100">
                                    {{ $fluidSelection['status'] }}
                                </span>
                            @endif
                        </div>
                        <dl class="mt-6 grid gap-3 text-sm text-white/70 sm:grid-cols-2">
                            @forelse($fluidSummaryProperties as $property)
                                <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                                    <dt class="text-xs uppercase tracking-widest text-white/50">{{ $property['label'] ?? 'Propiedad' }}</dt>
                                    <dd class="mt-1 font-semibold text-white">{{ $property['value'] ?? '---' }}</dd>
                                </div>
                            @empty
                                <div class="sm:col-span-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
                                    {{ __('No hay propiedades registradas para este fluido.') }}
                                </div>
                            @endforelse
                        </dl>
                        <div class="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-white/60">
                            <span class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                                <span class="h-1.5 w-1.5 rounded-full bg-emerald-300"></span>
                                Gestión centralizada de fluidos
                            </span>
                            <button
                                type="button"
                                data-fluid-open
                                aria-controls="fluid-panel"
                                aria-haspopup="dialog"
                                aria-expanded="false"
                                class="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-cyan-100 transition hover:border-cyan-400/60 hover:bg-cyan-500/20"
                            >
                                Configurar fluido
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l5 5a.999.999 0 010 1.414l-5 5a1 1 0 11-1.414-1.414L13.586 11H3a1 1 0 110-2h10.586l-3.293-3.293a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
                    <div class="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                        <div class="flex items-center justify-between">
                            <p class="text-xs uppercase tracking-widest text-white/50">Voltaje de entrada</p>
                            <span class="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-cyan-200">AC</span>
                        </div>
                        <p class="mt-4 text-4xl font-semibold text-white">
                            <span data-metric-voltage>{{ number_format($metricsSeed['voltage'], 1, '.', '') }}</span>
                            <span class="ml-1 text-base font-normal text-white/50">V</span>
                        </p>
                        <div class="mt-4 h-24">
                            <canvas id="voltage-chart"></canvas>
                        </div>
                    </div>
                    <div class="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                        <div class="flex items-center justify-between">
                            <p class="text-xs uppercase tracking-widest text-white/50">Corriente consumida</p>
                            <span class="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-emerald-200">AMP</span>
                        </div>
                        <p class="mt-4 text-4xl font-semibold text-white">
                            <span data-metric-current>{{ number_format($metricsSeed['current'], 2, '.', '') }}</span>
                            <span class="ml-1 text-base font-normal text-white/50">A</span>
                        </p>
                        <div class="mt-4 h-24">
                            <canvas id="current-chart"></canvas>
                        </div>
                    </div>
                    <div class="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                        <div class="flex items-center justify-between">
                            <p class="text-xs uppercase tracking-widest text-white/50">Batería / UPS</p>
                            <span class="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-indigo-200">Backup</span>
                        </div>
                        <p class="mt-4 text-4xl font-semibold text-white">
                            <span data-metric-battery>{{ number_format($metricsSeed['battery'], 0, '.', '') }}</span>
                            <span class="ml-1 text-base font-normal text-white/50">%</span>
                        </p>
                        <div class="mt-4">
                            <div class="h-3 overflow-hidden rounded-full bg-white/10">
                                <div class="h-full rounded-full bg-gradient-to-r from-indigo-400 via-blue-500 to-cyan-400" data-metric-battery-bar style="width: {{ min(100, max(0, (int) $metricsSeed['battery'])) }}%;"></div>
                            </div>
                        </div>
                        <div class="mt-4 h-24">
                            <canvas id="battery-chart"></canvas>
                        </div>
                    </div>
                    <div class="flex flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                        <div>
                            <p class="text-xs uppercase tracking-widest text-white/50">Tiempo acumulado</p>
                            <p class="mt-4 text-4xl font-semibold text-white"><span data-runtime-minutes>{{ number_format($metricsSeed['totalRuntimeMinutes'], 1, '.', '') }}</span> <span class="ml-1 text-base font-normal text-white/50">min</span></p>
                        </div>
                        <div class="mt-6 space-y-2 text-xs text-white/60">
                            <p class="flex items-center justify-between">
                                <span>Duración actual</span>
                                <span data-runtime>{{ $pumpState['totalRuntimeFormatted'] }}</span>
                            </p>
                            <p class="flex items-center justify-between">
                                <span>Estado</span>
                                <span data-runtime-state>{{ $pumpState['isOn'] ? 'En ejecución' : 'En espera' }}</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div class="grid gap-6 lg:grid-cols-2">
                    <div class="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-xs uppercase tracking-widest text-white/50">Tendencia eléctrica</p>
                                <h3 class="text-xl font-semibold text-white">Voltaje y corriente</h3>
                            </div>
                            <span class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-white/60">Actualizado</span>
                        </div>
                        <div class="mt-6 h-60">
                            <canvas id="telemetry-chart"></canvas>
                        </div>
                    </div>
                    <div class="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                        <div>
                            <p class="text-xs uppercase tracking-widest text-white/50">Actividades recientes</p>
                            <h3 class="text-xl font-semibold text-white">Registro del simulador</h3>
                        </div>
                        <ul class="mt-6 space-y-4 text-sm text-white/70" data-activity-log>
                            <li class="flex items-start gap-3">
                                <span class="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-white/10 text-white/60">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm.5 4a.5.5 0 00-1 0v3.25a.5.5 0 00.252.434l2.5 1.5a.5.5 0 10.496-.868L10.5 9.236V6z" /></svg>
                                </span>
                                <div>
                                    <p class="font-semibold text-white">Simulador inicializado</p>
                                    <p class="text-xs text-white/50">Tiempo operativo estimado: {{ number_format($metricsSeed['totalRuntimeMinutes'], 1, '.', '') }} minutos</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>


                <div class="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
                    <div class="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p class="text-xs uppercase tracking-widest text-white/50">Integración física</p>
                            <h3 class="text-xl font-semibold text-white">Resumen del ESP32</h3>
                            <p class="mt-2 text-sm text-white/60">
                                Supervisa el estado del módulo y accede a los parámetros completos desde el centro de configuración.
                            </p>
                        </div>
                        <span class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] {{ $activationTag }}">
                            <span class="h-1.5 w-1.5 rounded-full {{ $esp32Enabled ? 'bg-emerald-300 animate-pulse' : 'bg-amber-300' }}"></span>
                            {{ $esp32Enabled ? 'Activo' : 'Pendiente' }}
                        </span>
                    </div>
                    <dl class="mt-6 grid gap-4 text-sm text-white/70 sm:grid-cols-3">
                        <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                            <dt class="text-xs uppercase tracking-widest text-white/50">Identificador</dt>
                            <dd class="mt-1 font-semibold text-white">{{ $esp32Config['device_id'] ?? '---' }}</dd>
                        </div>
                        <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                            <dt class="text-xs uppercase tracking-widest text-white/50">Firmware</dt>
                            <dd class="mt-1 font-semibold text-white">v{{ $esp32Config['firmware_version'] ?? '1.0.0' }}</dd>
                        </div>
                        <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                            <dt class="text-xs uppercase tracking-widest text-white/50">Modo</dt>
                            <dd class="mt-1 font-semibold text-white">{{ $activationMode }}</dd>
                        </div>
                    </dl>
                    <div class="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-white/60">
                        <div class="flex flex-wrap items-center gap-3">
                            <span class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                                <span class="h-1.5 w-1.5 rounded-full bg-cyan-300"></span>
                                REST/MQTT listo
                            </span>
                            <span class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                                <span class="h-1.5 w-1.5 rounded-full bg-indigo-300"></span>
                                Credenciales protegidas
                            </span>
                        </div>
                        <a
                            href="{{ route('settings.edit') }}"
                            class="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-cyan-100 transition hover:border-cyan-400/60 hover:bg-cyan-500/20"
                        >
                            Gestionar configuración
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l5 5a.999.999 0 010 1.414l-5 5a1 1 0 11-1.414-1.414L13.586 11H3a1 1 0 110-2h10.586l-3.293-3.293a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                        </a>
                    </div>
                </div>

                @php
                    $initialRe = $measurement['reynolds'] ?? null;
                    $initialRegime = $initialRe ? ($initialRe < 2300 ? 'Flujo laminar' : 'Flujo turbulento') : 'Sin datos';
                    $initialDeltaP = $measurement['pressureDrop'] ?? null;
                    $initialHead = $measurement['headLoss'] ?? null;
                    $initialPower = $measurement['hydraulicPower'] ?? null;
                    $initialVelocity = $measurement['velocity'] ?? null;
                    $initialDensity = $measurement['density'] ?? null;
                    $initialViscosity = $measurement['viscosity'] ?? null;
                @endphp

                <div class="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
                    <div class="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p class="text-xs uppercase tracking-widest text-white/50">Cálculos hidráulicos en línea</p>
                            <h3 class="text-xl font-semibold text-white">Resultados a partir de la última telemetría</h3>
                            <p class="mt-2 text-sm text-white/60">
                                El servicio FluidCalculationService procesa el caudal reportado junto con las propiedades del fluido seleccionado.
                            </p>
                        </div>
                        <span class="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-emerald-200">
                            SSE
                        </span>
                    </div>

                    <div class="mt-6 grid gap-4 md:grid-cols-3">
                        <div class="rounded-2xl border border-white/10 bg-white/5 p-5" data-fluid-card="regime">
                            <p class="text-xs uppercase tracking-widest text-white/50">Régimen de flujo</p>
                            <p class="mt-3 text-2xl font-semibold text-white" data-fluid-card-regime-primary>{{ $initialRegime }}</p>
                            <p class="mt-2 text-sm text-white/60">
                                Re = <span data-fluid-card-reynolds>{{ $initialRe ? number_format($initialRe, 0, '.', ' ') : '---' }}</span>
                            </p>
                        </div>

                        <div class="rounded-2xl border border-white/10 bg-white/5 p-5" data-fluid-card="pressure">
                            <p class="text-xs uppercase tracking-widest text-white/50">Pérdida de presión ΔP</p>
                            <p class="mt-3 text-2xl font-semibold text-white">
                                <span data-fluid-card-pressure>{{ $initialDeltaP ? number_format($initialDeltaP / 1000, 2, '.', ' ') : '---' }}</span>
                                <span class="ml-1 text-base font-normal text-white/50">kPa</span>
                            </p>
                            <p class="mt-2 text-sm text-white/60">
                                Carga equivalente: <span data-fluid-card-head>{{ $initialHead ? number_format($initialHead, 2, '.', ' ') : '---' }}</span> m
                            </p>
                        </div>

                        <div class="rounded-2xl border border-white/10 bg-white/5 p-5" data-fluid-card="power">
                            <p class="text-xs uppercase tracking-widest text-white/50">Potencia hidráulica</p>
                            <p class="mt-3 text-2xl font-semibold text-white">
                                <span data-fluid-card-power>{{ $initialPower ? number_format($initialPower, 1, '.', ' ') : '---' }}</span>
                                <span class="ml-1 text-base font-normal text-white/50">W</span>
                            </p>
                            <p class="mt-2 text-sm text-white/60">
                                Velocidad: <span data-fluid-card-velocity>{{ $initialVelocity ? number_format($initialVelocity, 2, '.', ' ') : '---' }}</span> m/s · ρ = <span data-fluid-card-density>{{ $initialDensity ? number_format($initialDensity, 0, '.', ' ') : '---' }}</span> kg/m³ · μ = <span data-fluid-card-viscosity>{{ $initialViscosity ? number_format($initialViscosity * 1000, 2, '.', ' ') : '---' }}</span> mPa·s
                            </p>
                        </div>
                    </div>
                </div>
            </section>
    </div>
</div>

    <div
        data-fluid-panel
        id="fluid-panel"
        class="fixed inset-0 z-50 hidden items-center justify-center px-4 py-6"
        role="dialog"
        aria-modal="true"
        aria-hidden="true"
        aria-labelledby="fluid-panel-title"
        tabindex="-1"
    >
        <div data-fluid-close class="absolute inset-0 bg-slate-950/80"></div>
        <div class="relative z-10 w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-950/95 shadow-xl shadow-slate-900/40">
            <header class="flex items-start justify-between gap-4 border-b border-slate-800 bg-slate-900/90 px-5 py-4">
                <div class="space-y-1">
                    <p class="text-[10px] uppercase tracking-[0.3em] text-cyan-300">Selector de fluidos</p>
                    <h2 id="fluid-panel-title" class="text-lg font-semibold text-white">{{ $fluidSelection['name'] ?? 'Selecciona un fluido' }}</h2>
                    <p class="text-xs text-slate-300">Puedes cambiar el fluido activo en cualquier momento, los cálculos del panel se actualizan al instante.</p>
                </div>
                <button
                    type="button"
                    data-fluid-close
                    class="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-200 transition hover:border-rose-400 hover:bg-rose-500/20 hover:text-rose-100"
                    aria-label="Cerrar gestión de fluidos"
                >
                    Cerrar
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 8.586l3.536-3.535a1 1 0 111.414 1.414L11.414 10l3.536 3.535a1 1 0 01-1.414 1.414L10 11.414l-3.535 3.535a1 1 0 01-1.414-1.414L8.586 10 5.05 6.465a1 1 0 111.414-1.414L10 8.586z" clip-rule="evenodd" /></svg>
                </button>
            </header>

            <div class="max-h-[70vh] overflow-y-auto px-5 py-5 space-y-5">
                <section class="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                    <p class="text-[10px] uppercase tracking-[0.3em] text-slate-400">Propiedades</p>
                    <dl class="mt-3 grid gap-3 sm:grid-cols-2">
                        @forelse(($fluidSelection['properties'] ?? []) as $property)
                            <div class="rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-200">
                                <dt class="text-[10px] uppercase tracking-[0.3em] text-slate-400">{{ $property['label'] ?? 'Propiedad' }}</dt>
                                <dd class="mt-1 text-base font-semibold text-white">{{ $property['value'] ?? '---' }}</dd>
                            </div>
                        @empty
                            <p class="text-sm text-slate-400">{{ __('Selecciona un fluido para ver sus propiedades.') }}</p>
                        @endforelse
                    </dl>
                </section>

                @php
                    $monitoring = $fluidSelection['monitoring'] ?? [];
                    $monitoringAlerts = $monitoring['alerts'] ?? [];
                @endphp

                @if (! empty($fluidSelection['operating']))
                    <section class="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                        <p class="text-[10px] uppercase tracking-[0.3em] text-slate-400">Ventana operativa</p>
                        <ul class="mt-3 space-y-2 text-sm text-slate-200">
                            @foreach ($fluidSelection['operating'] as $target)
                                <li class="rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2">
                                    <div class="flex items-center justify-between gap-3">
                                        <span class="font-semibold text-white">{{ $target['label'] ?? 'Parámetro' }}</span>
                                        <span>{{ $target['value'] ?? '---' }}</span>
                                    </div>
                                    @if (! empty($target['note']))
                                        <p class="mt-1 text-[10px] text-slate-400">{{ $target['note'] }}</p>
                                    @endif
                                </li>
                            @endforeach
                        </ul>
                    </section>
                @endif

                <section class="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                    <p class="text-[10px] uppercase tracking-[0.3em] text-slate-400">Alertas</p>
                    @if (! empty($monitoringAlerts))
                        <ul class="mt-3 space-y-2 text-sm text-slate-200">
                            @foreach ($monitoringAlerts as $alert)
                                <li class="flex items-start gap-2">
                                    <span class="mt-1 h-1.5 w-1.5 rounded-full bg-rose-400"></span>
                                    <span>{{ $alert }}</span>
                                </li>
                            @endforeach
                        </ul>
                    @else
                        <p class="mt-3 text-sm text-slate-400">{{ __('Sin alertas registradas para este fluido.') }}</p>
                    @endif

                    @if (! empty($monitoring['sampling']))
                        <div class="mt-4 rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-300">
                            <p class="font-semibold uppercase tracking-[0.3em] text-slate-400">Muestreo sugerido</p>
                            <p class="mt-1 text-sm text-slate-200">{{ $monitoring['sampling'] }}</p>
                        </div>
                    @endif
                </section>

                <section class="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                    <p class="text-[10px] uppercase tracking-[0.3em] text-slate-400">Selecciona un fluido</p>
                    <div class="mt-3 space-y-3">
                        @foreach ($fluidCatalog as $fluid)
                            @php
                                $isSelected = ($fluid['key'] ?? null) === $fluidSelectedKey;
                            @endphp
                            <form
                                action="{{ route('settings.fluid.update') }}"
                                method="POST"
                                class="rounded-lg border {{ $isSelected ? 'border-emerald-400 bg-emerald-500/10 shadow-lg shadow-emerald-500/15' : 'border-slate-800 bg-slate-950/80 hover:border-cyan-400 hover:bg-cyan-500/10' }} transition"
                            >
                                @csrf
                                @method('PUT')
                                <input type="hidden" name="selection" value="{{ $fluid['key'] }}">
                                <input type="hidden" name="redirect_to" value="{{ route('dashboard') }}">
                                <button type="submit" class="flex w-full flex-col items-start gap-2 px-3 py-3 text-left">
                                    <div class="flex w-full items-start justify-between gap-3">
                                        <div class="space-y-1">
                                            <p class="text-sm font-semibold text-white">{{ $fluid['name'] ?? 'Fluido' }}</p>
                                            <p class="text-xs text-slate-300">{{ $fluid['description'] ?? '' }}</p>
                                        </div>
                                        @if (! empty($fluid['status']))
                                            <span class="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-[9px] uppercase tracking-[0.3em] text-slate-200">{{ $fluid['status'] }}</span>
                                        @endif
                                    </div>
                                    <div class="grid w-full gap-2 text-[11px] text-slate-300 sm:grid-cols-3">
                                        @foreach (array_slice($fluid['properties'] ?? [], 0, 3) as $property)
                                            <span>{{ $property['label'] ?? 'Propiedad' }}: <span class="text-white">{{ $property['value'] ?? '---' }}</span></span>
                                        @endforeach
                                    </div>
                                    @if ($isSelected)
                                        <span class="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-emerald-200">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.704 5.29a1 1 0 010 1.42l-7.25 7.25a1 1 0 01-1.414 0L3.296 9.917a1 1 0 111.414-1.414l3.041 3.04 6.543-6.543a1 1 0 011.41 0z" clip-rule="evenodd" /></svg>
                                            Seleccionado
                                        </span>
                                    @endif
                                </button>
                            </form>
                        @endforeach
                    </div>
                </section>
            </div>
        </div>
    </div>

    <div
        data-designer-panel
        id="designer-panel"
        class="fixed inset-0 z-50 hidden px-4 py-8 sm:px-8 sm:py-10"
        role="dialog"
        aria-modal="true"
        aria-hidden="true"
        aria-labelledby="designer-panel-title"
        tabindex="-1"
    >
        <div data-designer-close class="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"></div>
        <div class="relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col overflow-hidden rounded-3xl border border-sky-500/30 bg-slate-950/95 shadow-[0_40px_120px_-40px_rgba(56,189,248,0.65)] ring-1 ring-white/5">
            <header class="border-b border-white/10 bg-gradient-to-br from-sky-500/15 via-slate-900/90 to-cyan-900/60 px-8 py-8 text-white shadow-[inset_0_-1px_0_0_rgba(148,163,184,0.25)] sm:px-10 sm:py-9">
                <div class="flex flex-col gap-10 lg:grid lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start lg:gap-14">
                    <div class="space-y-5">
                        <div class="flex flex-wrap items-center justify-between gap-3">
                            <span class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-sky-100">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M4 2a1 1 0 00-1 1v6a1 1 0 001 1h1.382l1.447 3.894A1 1 0 007.764 14h4.472a1 1 0 00.935-.605L15.166 10H16a1 1 0 001-1V3a1 1 0 00-1-1H4zm5 2h2a1 1 0 010 2H9a1 1 0 010-2z" /></svg>
                                Diseñador hidráulico
                            </span>
                            <button
                                type="button"
                                data-designer-close
                                aria-label="Cerrar diseñador"
                                class="inline-flex items-center gap-2 rounded-full border border-slate-500/40 bg-slate-900/60 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-200 transition hover:border-rose-400 hover:bg-rose-500/20 hover:text-rose-100"
                            >
                                Cerrar
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 8.586l3.536-3.535a1 1 0 111.414 1.414L11.414 10l3.536 3.535a1 1 0 01-1.414 1.414L10 11.414l-3.535 3.535a1 1 0 01-1.414-1.414L8.586 10 5.05 6.465a1 1 0 111.414-1.414L10 8.586z" clip-rule="evenodd" /></svg>
                            </button>
                        </div>
                        <h2 id="designer-panel-title" class="text-2xl font-semibold tracking-tight sm:text-3xl">Diseña y verifica tu sistema de tuberías</h2>
                        <p class="text-sm leading-relaxed text-slate-100/80">
                            Construye el diagrama de tu tanque, bomba y tubería para estimar presiones usando los principios de Pascal
                            y las ecuaciones hidrostáticas. Captura los parámetros geométricos y valida los resultados antes de ejecutar la instalación.
                        </p>
                        <div class="flex flex-wrap items-center gap-2 text-[11px] text-slate-100">
                            <button type="button" data-designer-action="reset" class="inline-flex items-center gap-2 rounded-full border border-slate-500/40 bg-slate-800/60 px-3 py-1.5 font-semibold uppercase tracking-[0.3em] text-white transition hover:border-slate-400/60 hover:bg-slate-700/70">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M4.5 2A2.5 2.5 0 002 4.5v11A2.5 2.5 0 004.5 18h11a2.5 2.5 0 002.5-2.5V11a1 1 0 10-2 0v4.5a.5.5 0 01-.5.5h-11a.5.5 0 01-.5-.5v-11a.5.5 0 01.5-.5H11a1 1 0 000-2H4.5z" /><path d="M7.707 12.707a1 1 0 010-1.414l7-7a1 1 0 011.414 1.414l-7 7a1 1 0 01-1.414 0z" /><path d="M6 7a1 1 0 111-1h2a1 1 0 110 2H7a1 1 0 01-1-1z" /></svg>
                                Reiniciar esquema
                            </button>
                            <button type="button" data-designer-action="add-node" class="inline-flex items-center gap-2 rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 font-semibold uppercase tracking-[0.3em] text-sky-100 transition hover:border-sky-400/60 hover:bg-sky-500/20">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" /></svg>
                                Nuevo nodo
                            </button>
                            <button type="button" data-designer-action="add-pipe" class="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 font-semibold uppercase tracking-[0.3em] text-cyan-100 transition hover:border-cyan-400/60 hover:bg-cyan-500/20">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M4 5a2 2 0 012-2h8a2 2 0 012 2v3h1.5a.5.5 0 01.354.854l-3.5 3.5a.5.5 0 01-.708 0l-3.5-3.5A.5.5 0 0111.5 8H13V5H7v10h3.5a.5.5 0 110 1H6a2 2 0 01-2-2V5z" /></svg>
                                Nuevo tramo
                            </button>
                            <button type="button" data-designer-action="save" class="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 font-semibold uppercase tracking-[0.3em] text-emerald-100 transition hover:border-emerald-400/60 hover:bg-emerald-500/20">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6.414A2 2 0 0017.414 5L15 2.586A2 2 0 0013.586 2H4zm10 0v4H6V3h8z" /></svg>
                                Guardar diseño
                            </button>
                            <button type="button" data-designer-action="load" class="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 font-semibold uppercase tracking-[0.3em] text-amber-100 transition hover:border-amber-400/60 hover:bg-amber-500/20">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M3 4a2 2 0 012-2h5a2 2 0 011.414.586l5 5A2 2 0 0117 8.414V16a2 2 0 01-2 2H5a2 2 0 01-2-2V4zm7 0v4h4L10 4z" /></svg>
                                Recuperar
                            </button>
                            <button type="button" data-designer-action="load-preset" data-designer-preset="example-x" class="inline-flex items-center gap-2 rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1.5 font-semibold uppercase tracking-[0.3em] text-indigo-100 transition hover:border-indigo-400/60 hover:bg-indigo-500/20">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M4.25 2A2.25 2.25 0 002 4.25v11.5A2.25 2.25 0 004.25 18h11.5A2.25 2.25 0 0018 15.75V7.5a.75.75 0 00-1.5 0v8.25a.75.75 0 01-.75.75H4.25a.75.75 0 01-.75-.75V4.25a.75.75 0 01.75-.75h6.25a.75.75 0 000-1.5H4.25z" /><path d="M6.5 11.25A.75.75 0 017.25 10.5h1.69l4.03-4.03a.75.75 0 111.06 1.06L10.06 11.5v1.69a.75.75 0 01-1.5 0v-1.69l-1.31 1.31a.75.75 0 11-1.06-1.06l1.31-1.31H7.25a.75.75 0 01-.75-.75z" /></svg>
                                Cargar ejemplo X
                            </button>
                        </div>
                        <p class="text-[11px] leading-relaxed text-white/70" data-designer-hint>Haz clic en “Nuevo tramo” y selecciona dos nodos para conectar el circuito.</p>
                    </div>
                    <div class="grid gap-4 text-xs text-slate-100/90">
                        <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                            <p class="text-[10px] font-semibold uppercase tracking-[0.35em] text-sky-200">Propiedades del fluido</p>
                            <dl class="mt-4 grid gap-4 sm:grid-cols-3">
                                <div>
                                    <dt class="text-[10px] uppercase tracking-[0.3em] text-white/60">Densidad</dt>
                                    <dd class="mt-1 text-lg font-semibold text-white" data-designer-summary="density">— kg/m³</dd>
                                </div>
                                <div>
                                    <dt class="text-[10px] uppercase tracking-[0.3em] text-white/60">Peso específico</dt>
                                    <dd class="mt-1 text-lg font-semibold text-white" data-designer-summary="gamma">— kN/m³</dd>
                                </div>
                                <div>
                                    <dt class="text-[10px] uppercase tracking-[0.3em] text-white/60">Viscosidad</dt>
                                    <dd class="mt-1 text-lg font-semibold text-white" data-designer-summary="viscosity">— Pa·s</dd>
                                </div>
                            </dl>
                        </div>
                        <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                            <p class="text-[10px] font-semibold uppercase tracking-[0.35em] text-sky-200">Estado hidrostático</p>
                            <dl class="mt-4 grid gap-4 sm:grid-cols-3">
                                <div>
                                    <dt class="text-[10px] uppercase tracking-[0.3em] text-white/60">Altura de referencia</dt>
                                    <dd class="mt-1 text-lg font-semibold text-white" data-designer-summary="surface-height">— m</dd>
                                </div>
                                <div>
                                    <dt class="text-[10px] uppercase tracking-[0.3em] text-white/60">Presión en superficie</dt>
                                    <dd class="mt-1 text-lg font-semibold text-white" data-designer-summary="surface-pressure">— kPa</dd>
                                </div>
                                <div>
                                    <dt class="text-[10px] uppercase tracking-[0.3em] text-white/60">Presión objetivo</dt>
                                    <dd class="mt-1 text-lg font-semibold text-white" data-designer-summary="target-pressure">— kPa</dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </div>
            </header>

            <div class="grid flex-1 gap-6 overflow-hidden px-6 py-6 sm:px-10 sm:py-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
                <section class="flex flex-col">
                    <div class="relative flex-1 overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 shadow-inner">
                        <svg data-designer-svg viewBox="0 0 960 540" class="h-full w-full" preserveAspectRatio="xMidYMid meet"></svg>
                        <div class="pointer-events-none absolute left-6 top-6 max-w-sm text-[11px] leading-relaxed text-white/80" data-designer-hint-overlay></div>
                        <div class="pointer-events-none absolute bottom-6 right-6 rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-white/60">
                            1 m = 50 px
                        </div>
                    </div>
                </section>

                <aside class="flex flex-col gap-6 overflow-y-auto pb-4">
                    <div class="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                        <div class="flex items-center justify-between">
                            <h3 class="text-sm font-semibold text-white">Condiciones del sistema</h3>
                            <span class="text-[10px] font-semibold uppercase tracking-[0.35em] text-sky-200">Entrada</span>
                        </div>
                        <form data-designer-system-form class="mt-4 space-y-5 text-xs text-slate-100">
                            <div class="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label for="designer-fluid" class="text-[11px] font-medium uppercase tracking-[0.25em] text-slate-300">Fluido</label>
                                    <select id="designer-fluid" data-designer-bind="fluidKey" class="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white shadow-inner focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40">
                                        @foreach ($calculatorFluids as $key => $label)
                                            <option value="{{ $key }}">{{ $label }}</option>
                                        @endforeach
                                    </select>
                                </div>
                                <div>
                                    <label for="designer-temperature" class="text-[11px] font-medium uppercase tracking-[0.25em] text-slate-300">Temperatura (°C)</label>
                                    <input id="designer-temperature" type="number" step="0.1" data-designer-bind="temperature" class="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white shadow-inner focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40" />
                                </div>
                            </div>

                            <div class="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label for="designer-tank-type" class="text-[11px] font-medium uppercase tracking-[0.25em] text-slate-300">Tipo de tanque</label>
                                    <select id="designer-tank-type" data-designer-bind="tank.type" class="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white shadow-inner focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40">
                                        <option value="rectangular">Rectangular</option>
                                        <option value="cylindrical">Cilíndrico</option>
                                    </select>
                                </div>
                                <div>
                                    <label for="designer-tank-height" class="text-[11px] font-medium uppercase tracking-[0.25em] text-slate-300">Altura del tanque (m)</label>
                                    <input id="designer-tank-height" type="number" min="0" step="0.01" data-designer-bind="tank.height" class="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white shadow-inner focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40" />
                                </div>
                            </div>

                            <div class="grid gap-4 sm:grid-cols-3" data-designer-visibility="rectangular">
                                <div>
                                    <label for="designer-tank-base" class="text-[11px] font-medium uppercase tracking-[0.25em] text-slate-300">Base x (m)</label>
                                    <input id="designer-tank-base" type="number" min="0" step="0.01" data-designer-bind="tank.base" class="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white shadow-inner focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40" />
                                </div>
                                <div>
                                    <label for="designer-tank-depth" class="text-[11px] font-medium uppercase tracking-[0.25em] text-slate-300">Profundidad z (m)</label>
                                    <input id="designer-tank-depth" type="number" min="0" step="0.01" data-designer-bind="tank.depth" class="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white shadow-inner focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40" />
                                </div>
                                <div>
                                    <label for="designer-tank-volume-rect" class="text-[11px] font-medium uppercase tracking-[0.25em] text-slate-300">Volumen (m³)</label>
                                    <input id="designer-tank-volume-rect" type="number" min="0" step="0.01" data-designer-bind="tank.volume" class="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white shadow-inner focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40" />
                                </div>
                            </div>

                            <div class="grid gap-4 sm:grid-cols-2" data-designer-visibility="cylindrical">
                                <div>
                                    <label for="designer-tank-radius" class="text-[11px] font-medium uppercase tracking-[0.25em] text-slate-300">Radio (m)</label>
                                    <input id="designer-tank-radius" type="number" min="0" step="0.01" data-designer-bind="tank.radius" class="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white shadow-inner focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40" />
                                </div>
                                <div>
                                    <label for="designer-tank-volume-cyl" class="text-[11px] font-medium uppercase tracking-[0.25em] text-slate-300">Volumen (m³)</label>
                                    <input id="designer-tank-volume-cyl" type="number" min="0" step="0.01" data-designer-bind="tank.volume" class="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white shadow-inner focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40" />
                                </div>
                            </div>

                            <div class="flex items-center gap-3">
                                <input id="designer-tank-open" type="checkbox" data-designer-bind="tank.openToAtmosphere" class="h-4 w-4 rounded border border-white/20 bg-slate-900 text-sky-400 focus:ring-sky-400/50" />
                                <label for="designer-tank-open" class="text-[11px] font-medium uppercase tracking-[0.25em] text-slate-300">Tanque abierto a la atmósfera</label>
                            </div>

                            <div data-designer-visibility="closed">
                                <label for="designer-tank-gas" class="text-[11px] font-medium uppercase tracking-[0.25em] text-slate-300">Presión del gas (kPa)</label>
                                <input id="designer-tank-gas" type="number" min="0" step="0.1" data-designer-bind="tank.gasPressure" class="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white shadow-inner focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40" />
                            </div>

                            <div class="rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-4 text-white">
                                <p class="text-[10px] font-semibold uppercase tracking-[0.35em] text-sky-100">Nivel del fluido</p>
                                <p class="mt-1 text-lg font-semibold" data-designer-output="fluid-height">— m</p>
                                <p class="text-[11px] leading-relaxed text-white/70" data-designer-output="fluid-note">Captura las dimensiones y volumen para estimar la altura ocupada.</p>
                            </div>
                        </form>
                    </div>

                    <div class="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                        <div class="flex items-center justify-between">
                            <h3 class="text-sm font-semibold text-white">Bomba y succión</h3>
                            <span class="text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-200">Referencia</span>
                        </div>
                        <dl class="mt-4 grid gap-4 text-xs text-slate-100/90 sm:grid-cols-2">
                            <div>
                                <dt class="text-[10px] uppercase tracking-[0.3em] text-white/60">Altura del centro de la bomba</dt>
                                <dd class="mt-1 text-lg font-semibold text-white" data-designer-output="pump-height">— m</dd>
                            </div>
                            <div>
                                <dt class="text-[10px] uppercase tracking-[0.3em] text-white/60">Presión hidrostática</dt>
                                <dd class="mt-1 text-lg font-semibold text-white" data-designer-output="hydro-pressure">— kPa</dd>
                            </div>
                            <div>
                                <dt class="text-[10px] uppercase tracking-[0.3em] text-white/60">Condición superior</dt>
                                <dd class="mt-1 text-lg font-semibold text-white" data-designer-output="tank-condition">—</dd>
                            </div>
                            <div>
                                <dt class="text-[10px] uppercase tracking-[0.3em] text-white/60">Presión de succión</dt>
                                <dd class="mt-1 text-lg font-semibold text-white" data-designer-output="suction-pressure">— kPa</dd>
                            </div>
                        </dl>
                        <p class="mt-4 text-[11px] leading-relaxed text-white/70" data-designer-output="pump-note">
                            Ajusta la altura del nodo de succión para evaluar si la bomba trabaja sumergida o por encima del nivel del fluido.
                        </p>
                    </div>

                    <div class="rounded-2xl border border-white/10 bg-slate-900/70 p-5" data-designer-element-panel>
                        <div class="flex items-center justify-between">
                            <h3 class="text-sm font-semibold text-white">Elemento seleccionado</h3>
                            <button type="button" data-designer-action="delete-element" class="inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-red-200 transition hover:border-red-400/60 hover:bg-red-500/20">Eliminar</button>
                        </div>
                        <p class="mt-3 text-[11px] leading-relaxed text-white/60" data-designer-selection-empty>Selecciona un nodo o tramo en el diagrama para editar sus propiedades geométricas.</p>
                        <form data-designer-element-form class="mt-4 hidden space-y-4 text-xs text-slate-100">
                            <div>
                                <label for="designer-element-label" class="text-[11px] font-medium uppercase tracking-[0.25em] text-slate-300">Nombre</label>
                                <input id="designer-element-label" type="text" data-designer-element-bind="label" class="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white shadow-inner focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40" />
                            </div>
                            <div data-designer-element-fields class="space-y-4"></div>
                        </form>
                    </div>

                    <div class="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                        <div class="flex items-center justify-between">
                            <h3 class="text-sm font-semibold text-white">Resultados hidrostáticos</h3>
                            <span class="text-[10px] font-semibold uppercase tracking-[0.35em] text-emerald-200">Salida</span>
                        </div>
                        <div class="mt-4 overflow-hidden rounded-xl border border-white/5">
                            <table class="min-w-full divide-y divide-white/10 text-xs text-white/90">
                                <thead class="bg-slate-900/80 text-sky-100">
                                    <tr>
                                        <th class="px-3 py-2 text-left font-semibold uppercase tracking-[0.25em]">Punto</th>
                                        <th class="px-3 py-2 text-left font-semibold uppercase tracking-[0.25em]">Altura (m)</th>
                                        <th class="px-3 py-2 text-left font-semibold uppercase tracking-[0.25em]">Pabs (kPa)</th>
                                        <th class="px-3 py-2 text-left font-semibold uppercase tracking-[0.25em]">Pg (kPa)</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-white/5" data-designer-results="nodes"></tbody>
                            </table>
                        </div>

                        <div class="mt-5 overflow-hidden rounded-xl border border-white/5">
                            <table class="min-w-full divide-y divide-white/10 text-xs text-white/90">
                                <thead class="bg-slate-900/80 text-cyan-100">
                                    <tr>
                                        <th class="px-3 py-2 text-left font-semibold uppercase tracking-[0.25em]">Tramo</th>
                                        <th class="px-3 py-2 text-left font-semibold uppercase tracking-[0.25em]">Δh (m)</th>
                                        <th class="px-3 py-2 text-left font-semibold uppercase tracking-[0.25em]">Signo</th>
                                        <th class="px-3 py-2 text-left font-semibold uppercase tracking-[0.25em]">γΔh (kPa)</th>
                                        <th class="px-3 py-2 text-left font-semibold uppercase tracking-[0.25em]">Resultado</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-white/5" data-designer-results="segments"></tbody>
                            </table>
                        </div>

                        <div class="mt-5 space-y-3 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-5 text-[11px] leading-relaxed text-slate-100/90 hidden" data-designer-validation>
                            <div>
                                <p class="text-[10px] font-semibold uppercase tracking-[0.35em] text-indigo-200">Validación del ejemplo</p>
                                <p class="mt-2" data-designer-validation-message>Activa el “Ejemplo X” para comparar con los resultados calculados.</p>
                            </div>
                            <ul class="space-y-2" data-designer-validation-list></ul>
                        </div>

                        <div class="mt-5 space-y-4 text-[11px] leading-relaxed text-slate-100/90">
                            <div class="rounded-xl border border-white/10 bg-slate-900/70 p-4">
                                <p class="font-semibold uppercase tracking-[0.35em] text-sky-100">Fórmula hidrostática</p>
                                <p class="mt-2" data-designer-formula="hydro">—</p>
                            </div>
                            <div class="rounded-xl border border-white/10 bg-slate-900/70 p-4">
                                <p class="font-semibold uppercase tracking-[0.35em] text-emerald-100">Suma de presiones (Pascal)</p>
                                <p class="mt-2" data-designer-formula="pascal">—</p>
                            </div>
                            <div class="rounded-xl border border-white/10 bg-slate-900/70 p-4">
                                <p class="font-semibold uppercase tracking-[0.35em] text-cyan-100">Presión de succión</p>
                                <p class="mt-2" data-designer-formula="suction">—</p>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    </div>

    <div
        data-calculator-panel
        id="calculator-panel"
        class="fixed inset-0 z-50 hidden px-4 py-8 sm:px-8 sm:py-10"
        role="dialog"
        aria-modal="true"
        aria-hidden="true"
        aria-labelledby="calculator-panel-title"
        tabindex="-1"
    >
        <div data-calculator-close class="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"></div>
        <div class="relative z-10 mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-cyan-500/20 bg-slate-950/95 shadow-[0_40px_120px_-50px_rgba(8,145,178,0.75)] ring-1 ring-white/5">
            <header class="border-b border-white/10 bg-gradient-to-br from-cyan-500/15 via-slate-900/95 to-indigo-900/60 px-8 py-8 text-white shadow-[inset_0_-1px_0_0_rgba(148,163,184,0.25)] sm:px-10 sm:py-9">
                <div class="flex flex-col gap-10 lg:grid lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] lg:items-start lg:gap-14">
                    <div class="max-w-2xl space-y-4">
                        <span class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-100">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a8 8 0 11-8 8 8 8 0 018-8zm0 3a.75.75 0 00-.75.75v4.5a.75.75 0 001.5 0v-4.5A.75.75 0 0010 5zm0 8a1 1 0 100 2 1 1 0 000-2z" /></svg>
                            Calculadora de fluidos
                        </span>
                        <h2 id="calculator-panel-title" class="text-2xl font-semibold tracking-tight sm:text-3xl">Análisis termodinámico integral</h2>
                        <p class="text-sm leading-relaxed text-slate-100/80">
                            Ingresa las condiciones de operación y obtén un resumen profesional de propiedades críticas,
                            tendencias y clasificaciones del fluido seleccionado.
                        </p>
                        <dl class="mt-6 grid gap-5 rounded-2xl border border-white/10 bg-slate-950/40 p-6 text-xs text-slate-200/80 shadow-lg shadow-cyan-500/10 sm:grid-cols-2">
                            <div class="space-y-1">
                                <dt class="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-200">
                                    <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-100">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9.144 3.528a1 1 0 011.712 0l6 10.5A1 1 0 0116.01 15H3.99a1 1 0 01-.846-1.472l6-10.5zM11 13a1 1 0 10-2 0 1 1 0 002 0zm-.25-6.75a.75.75 0 10-1.5 0v3.5a.75.75 0 001.5 0v-3.5z" clip-rule="evenodd" /></svg>
                                    </span>
                                    Seguridad operacional
                                </dt>
                                <dd class="text-[11px] leading-relaxed">Evalúa escenarios térmicos y de presión con indicadores clave calculados al instante.</dd>
                            </div>
                            <div class="space-y-1">
                                <dt class="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-200">
                                    <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-100">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656l-6.364 6.364a.75.75 0 01-1.06 0L3.172 10.828a4 4 0 010-5.656z" /></svg>
                                    </span>
                                    Integridad del activo
                                </dt>
                                <dd class="text-[11px] leading-relaxed">Sigue la evolución del fluido y toma decisiones de mantenimiento con información curada.</dd>
                            </div>
                        </dl>
                    </div>
                    <div class="flex flex-col gap-4 lg:gap-6">
                        <div class="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 p-6 text-xs text-slate-200/80 shadow-xl shadow-cyan-500/20">
                            <div class="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-500/20 blur-3xl"></div>
                            <p class="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-100">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M3 4a2 2 0 012-2h10a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V4zm4 1a1 1 0 100 2h6a1 1 0 100-2H7zm-1 5a1 1 0 011-1h2a1 1 0 010 2H7a1 1 0 01-1-1zm1 3a1 1 0 000 2h6a1 1 0 100-2H7z" /></svg>
                                Estado resumido
                            </p>
                            <p class="mt-4 text-sm font-semibold text-white" data-calculator-output="fluid-name">Selecciona un fluido</p>
                            <p class="mt-2 text-[11px] leading-relaxed text-slate-300" data-calculator-output="fluid-summary">Los resultados aparecerán aquí al capturar tus condiciones.</p>
                        </div>
                        <div class="flex justify-end">
                            <button
                                type="button"
                                data-calculator-close
                                class="inline-flex items-center gap-2 rounded-full border border-rose-400/40 bg-rose-500/10 px-6 py-2.5 text-[11px] font-semibold uppercase tracking-[0.35em] text-rose-100 transition hover:border-rose-300/70 hover:bg-rose-500/20 hover:text-white"
                                aria-label="Cerrar calculadora"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 8.586l3.536-3.535a1 1 0 111.414 1.414L11.414 10l3.536 3.535a1 1 0 01-1.414 1.414L10 11.414l-3.535 3.535a1 1 0 01-1.414-1.414L8.586 10 5.05 6.465a1 1 0 111.414-1.414L10 8.586z" clip-rule="evenodd" /></svg>
                                Cerrar panel
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div class="flex-1 overflow-y-auto">
                <div class="grid gap-8 border-b border-white/5 bg-slate-950/70 px-8 py-8 sm:px-10 sm:py-10 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
                    <section>
                        <form data-calculator-form class="space-y-8">
                            <fieldset class="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-inner shadow-slate-950/60 sm:p-7">
                                <legend class="text-[10px] font-semibold uppercase tracking-[0.4em] text-cyan-200">Condiciones base</legend>
                                <div class="mt-6 space-y-6">
                                    <div>
                                        <label for="calculator-fluid" class="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-300">Tipo de fluido</label>
                                        <select
                                            id="calculator-fluid"
                                            name="fluid"
                                            class="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white/90 shadow focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                                        >
                                            @foreach ($calculatorFluids as $key => $label)
                                                <option value="{{ $key }}" {{ $loop->first ? 'selected' : '' }}>{{ $label }}</option>
                                            @endforeach
                                        </select>
                                    </div>

                                    <div class="grid gap-4 sm:grid-cols-2 sm:gap-6">
                                        <div>
                                            <label for="calculator-temperature" class="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-300">Temperatura inicial (°C)</label>
                                            <input
                                                id="calculator-temperature"
                                                name="temperature"
                                                type="number"
                                                step="0.1"
                                                value="25"
                                                class="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white/90 shadow focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                                            >
                                        </div>
                                        <div>
                                            <label for="calculator-temperature-target" class="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-300">Temperatura final (°C)</label>
                                            <input
                                                id="calculator-temperature-target"
                                                name="temperature_target"
                                                type="number"
                                                step="0.1"
                                                value="35"
                                                class="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white/90 shadow focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                                            >
                                        </div>
                                    </div>

                                    <div class="grid gap-4 sm:grid-cols-2 sm:gap-6">
                                        <div>
                                            <label for="calculator-pressure" class="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-300">Presión inicial (kPa)</label>
                                            <input
                                                id="calculator-pressure"
                                                name="pressure"
                                                type="number"
                                                step="0.1"
                                                value="101.3"
                                                class="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white/90 shadow focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                                            >
                                        </div>
                                        <div>
                                            <label for="calculator-pressure-target" class="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-300">Presión final (kPa)</label>
                                            <input
                                                id="calculator-pressure-target"
                                                name="pressure_target"
                                                type="number"
                                                step="0.1"
                                                value="101.3"
                                                class="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white/90 shadow focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                                            >
                                        </div>
                                    </div>

                                    <div class="grid gap-4 sm:grid-cols-2 sm:gap-6">
                                        <div>
                                            <label for="calculator-velocity" class="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-300">Velocidad del flujo (m/s)</label>
                                            <input
                                                id="calculator-velocity"
                                                name="velocity"
                                                type="number"
                                                step="0.01"
                                                value="0"
                                                class="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white/90 shadow focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                                            >
                                        </div>
                                        <div>
                                            <label for="calculator-diameter" class="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-300">Diámetro interno (m)</label>
                                            <input
                                                id="calculator-diameter"
                                                name="diameter"
                                                type="number"
                                                step="0.001"
                                                value="0"
                                                class="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white/90 shadow focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                                            >
                                        </div>
                                    </div>

                                    <div>
                                        <label for="calculator-molar" class="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-300">Fracción molar considerada</label>
                                        <input
                                            id="calculator-molar"
                                            name="molar_fraction"
                                            type="number"
                                            min="0"
                                            max="1"
                                            step="0.05"
                                            value="1"
                                            class="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white/90 shadow focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                                        >
                                        <p class="mt-3 text-[11px] leading-relaxed text-slate-400">Úsala para estimar presión parcial en mezclas gaseosas o escenarios con vapor saturado.</p>
                                    </div>
                                </div>
                            </fieldset>

                            <div class="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/70 p-6 shadow-inner shadow-slate-950/40 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                                <p class="text-xs leading-relaxed text-slate-300">Actualiza cualquier parámetro y recalcula al instante las propiedades del fluido.</p>
                                <button
                                    type="submit"
                                    class="inline-flex items-center gap-2 rounded-full border border-cyan-400/60 bg-cyan-500/15 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-100 transition hover:border-cyan-300/80 hover:bg-cyan-500/25"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm-.75 4.75a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75 8.25a1 1 0 110-2 1 1 0 010 2z" /></svg>
                                    Recalcular
                                </button>
                            </div>
                        </form>
                    </section>

                    <section class="space-y-7">
                        <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-lg shadow-cyan-500/10">
                            <div class="flex flex-wrap items-center justify-between gap-6">
                                <div class="space-y-3">
                                    <p class="text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-200">Clasificación del fluido</p>
                                    <span class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/80" data-calculator-output="fluid-type">---</span>
                                </div>
                                <div class="space-y-1 text-right">
                                    <p class="text-xs text-slate-300">Número de Reynolds</p>
                                    <p class="text-lg font-semibold text-white" data-calculator-output="reynolds">—</p>
                                </div>
                            </div>
                            <p class="mt-4 text-sm font-semibold text-white" data-calculator-output="flow-regime">—</p>
                            <p class="mt-3 text-xs leading-relaxed text-slate-300" data-calculator-output="flow-note">Captura velocidad y diámetro para evaluar el régimen laminar o turbulento.</p>
                        </div>

                        <div class="grid gap-7 lg:grid-cols-2">
                            <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
                                <p class="text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-200">Propiedades termodinámicas</p>
                                <dl class="mt-6 grid gap-4 text-sm text-slate-200">
                                    <div class="flex items-center justify-between gap-4">
                                        <dt class="text-xs uppercase tracking-[0.2em] text-slate-400">Densidad</dt>
                                        <dd class="font-semibold text-white"><span data-calculator-output="density">—</span> kg/m³</dd>
                                    </div>
                                    <div class="flex items-center justify-between gap-4">
                                        <dt class="text-xs uppercase tracking-[0.2em] text-slate-400">Volumen específico</dt>
                                        <dd class="font-semibold text-white"><span data-calculator-output="specific-volume">—</span> m³/kg</dd>
                                    </div>
                                    <div class="flex items-center justify-between gap-4">
                                        <dt class="text-xs uppercase tracking-[0.2em] text-slate-400">Peso específico</dt>
                                        <dd class="font-semibold text-white"><span data-calculator-output="specific-weight">—</span> kN/m³</dd>
                                    </div>
                                    <div class="flex items-center justify-between gap-4">
                                        <dt class="text-xs uppercase tracking-[0.2em] text-slate-400">Viscosidad dinámica</dt>
                                        <dd class="font-semibold text-white"><span data-calculator-output="dynamic-viscosity">—</span> Pa·s</dd>
                                    </div>
                                    <div class="flex items-center justify-between gap-4">
                                        <dt class="text-xs uppercase tracking-[0.2em] text-slate-400">Viscosidad cinemática</dt>
                                        <dd class="font-semibold text-white"><span data-calculator-output="kinematic-viscosity">—</span> m²/s</dd>
                                    </div>
                                    <div class="flex items-center justify-between gap-4 lg:col-span-2">
                                        <dt class="text-xs uppercase tracking-[0.2em] text-slate-400" data-calculator-output="compressibility-label">Compresibilidad</dt>
                                        <dd class="font-semibold text-white"><span data-calculator-output="compressibility">—</span></dd>
                                    </div>
                                </dl>
                            </div>

                            <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
                                <p class="text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-200">Presiones derivadas</p>
                                <dl class="mt-6 grid gap-4 text-sm text-slate-200">
                                    <div class="flex items-center justify-between gap-4">
                                        <dt class="text-xs uppercase tracking-[0.2em] text-slate-400">Ecuación de estado</dt>
                                        <dd class="font-semibold text-white"><span data-calculator-output="pressure-eos">—</span> kPa</dd>
                                    </div>
                                    <div class="flex items-center justify-between gap-4">
                                        <dt class="text-xs uppercase tracking-[0.2em] text-slate-400">Presión parcial</dt>
                                        <dd class="font-semibold text-white"><span data-calculator-output="partial-pressure">—</span> kPa</dd>
                                    </div>
                                    <div class="flex items-center justify-between gap-4">
                                        <dt class="text-xs uppercase tracking-[0.2em] text-slate-400">Presión de vapor</dt>
                                        <dd class="font-semibold text-white"><span data-calculator-output="vapor-pressure">—</span> kPa</dd>
                                    </div>
                                    <div class="flex items-center justify-between gap-4">
                                        <dt class="text-xs uppercase tracking-[0.2em] text-slate-400">Presión de saturación</dt>
                                        <dd class="font-semibold text-white"><span data-calculator-output="saturation-pressure">—</span> kPa</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>

                        <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
                            <p class="text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-200">Lectura operativa</p>
                            <ul class="mt-6 space-y-4 text-sm leading-relaxed text-slate-200">
                                <li data-calculator-output="classification-viscosity">—</li>
                                <li data-calculator-output="classification-compressibility">—</li>
                                <li data-calculator-output="classification-rheology">—</li>
                            </ul>
                        </div>

                        <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
                            <p class="text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-200">Variaciones registradas</p>
                            <div class="mt-6 space-y-3 text-sm leading-relaxed text-slate-200">
                                <p data-calculator-output="temperature-variation">—</p>
                                <p data-calculator-output="pressure-variation">—</p>
                                <p data-calculator-output="property-variation">—</p>
                            </div>
                        </div>

                        <div class="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
                            <p class="text-[10px] font-semibold uppercase tracking-[0.35em] text-cyan-200">Procesos de referencia</p>
                            <ul class="mt-6 space-y-4 text-sm leading-relaxed text-slate-200" data-calculator-output="process-list"></ul>
                        </div>
                    </section>
                </div>

                <div class="px-8 pb-8 sm:px-10 sm:pb-10">
                    <div class="rounded-2xl border border-white/10 bg-slate-900/70 p-6 shadow-inner shadow-slate-950/50">
                        <button
                            type="button"
                            data-calculator-table-toggle
                            class="flex w-full items-center justify-between gap-4 rounded-xl border border-white/10 bg-slate-950/70 px-5 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-slate-100 transition hover:border-cyan-300/60 hover:text-cyan-100"
                            aria-expanded="false"
                        >
                            <span>Ver tablas de referencia</span>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.939l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0l-4.25-4.25a.75.75 0 01.02-1.06z" clip-rule="evenodd" /></svg>
                        </button>

                        <div data-calculator-tables class="mt-6 hidden space-y-7 text-sm text-slate-100">
                            <div>
                                <h3 class="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">Tabla B.1 • Fluidos en unidades SI</h3>
                                <div class="mt-4 overflow-x-auto rounded-xl border border-white/5">
                                    <table class="min-w-full divide-y divide-white/10 text-xs">
                                        <thead class="bg-slate-900/80 text-cyan-100">
                                            <tr>
                                                <th class="px-3 py-2 text-left font-semibold uppercase tracking-[0.25em]">Fluido</th>
                                                <th class="px-3 py-2 text-left font-semibold uppercase tracking-[0.25em]">sg</th>
                                                <th class="px-3 py-2 text-left font-semibold uppercase tracking-[0.25em]">γ (kN/m³)</th>
                                                <th class="px-3 py-2 text-left font-semibold uppercase tracking-[0.25em]">ρ (kg/m³)</th>
                                                <th class="px-3 py-2 text-left font-semibold uppercase tracking-[0.25em]">μ (Pa·s)</th>
                                                <th class="px-3 py-2 text-left font-semibold uppercase tracking-[0.25em]">ν (m²/s)</th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-white/5">
                                            @foreach ($thermoTables['fluids'] as $row)
                                                <tr class="hover:bg-slate-900/60">
                                                    <td class="px-3 py-2">{{ $row['name'] }}</td>
                                                    <td class="px-3 py-2">{{ $row['sg'] }}</td>
                                                    <td class="px-3 py-2">{{ $row['gamma'] }}</td>
                                                    <td class="px-3 py-2">{{ $row['rho'] }}</td>
                                                    <td class="px-3 py-2">{{ $row['mu'] }}</td>
                                                    <td class="px-3 py-2">{{ $row['nu'] }}</td>
                                                </tr>
                                            @endforeach
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div class="grid gap-8 lg:grid-cols-2">
                                <div>
                                    <h3 class="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">Tabla A.1 • Propiedades del agua (SI)</h3>
                                    <div class="mt-4 overflow-x-auto rounded-xl border border-white/5">
                                        <table class="min-w-full divide-y divide-white/10 text-xs">
                                            <thead class="bg-slate-900/80 text-cyan-100">
                                                <tr>
                                                    <th class="px-3 py-2 text-left font-semibold uppercase tracking-[0.25em]">T (°C)</th>
                                                    <th class="px-3 py-2 text-left font-semibold uppercase tracking-[0.25em]">γ (kN/m³)</th>
                                                    <th class="px-3 py-2 text-left font-semibold uppercase tracking-[0.25em]">ρ (kg/m³)</th>
                                                    <th class="px-3 py-2 text-left font-semibold uppercase tracking-[0.25em]">μ (Pa·s)</th>
                                                    <th class="px-3 py-2 text-left font-semibold uppercase tracking-[0.25em]">ν (m²/s)</th>
                                                </tr>
                                            </thead>
                                            <tbody class="divide-y divide-white/5">
                                                @foreach ($thermoTables['water_si'] as $row)
                                                    <tr class="hover:bg-slate-900/60">
                                                        <td class="px-3 py-2">{{ $row['t'] }}</td>
                                                        <td class="px-3 py-2">{{ $row['gamma'] }}</td>
                                                        <td class="px-3 py-2">{{ $row['rho'] }}</td>
                                                        <td class="px-3 py-2">{{ $row['mu'] }}</td>
                                                        <td class="px-3 py-2">{{ $row['nu'] }}</td>
                                                    </tr>
                                                @endforeach
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div>
                                    <h3 class="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">Tabla A.2 • Propiedades del agua (Sistema Inglés)</h3>
                                    <div class="mt-4 overflow-x-auto rounded-xl border border-white/5">
                                        <table class="min-w-full divide-y divide-white/10 text-xs">
                                            <thead class="bg-slate-900/80 text-cyan-100">
                                                <tr>
                                                    <th class="px-3 py-2 text-left font-semibold uppercase tracking-[0.25em]">T (°F)</th>
                                                    <th class="px-3 py-2 text-left font-semibold uppercase tracking-[0.25em]">γ (lb/pie³)</th>
                                                    <th class="px-3 py-2 text-left font-semibold uppercase tracking-[0.25em]">ρ (slug/pie³)</th>
                                                    <th class="px-3 py-2 text-left font-semibold uppercase tracking-[0.25em]">μ (lb·s/pie²)</th>
                                                    <th class="px-3 py-2 text-left font-semibold uppercase tracking-[0.25em]">ν (pie²/s)</th>
                                                </tr>
                                            </thead>
                                            <tbody class="divide-y divide-white/5">
                                                @foreach ($thermoTables['water_imperial'] as $row)
                                                    <tr class="hover:bg-slate-900/60">
                                                        <td class="px-3 py-2">{{ $row['t'] }}</td>
                                                        <td class="px-3 py-2">{{ $row['gamma'] }}</td>
                                                        <td class="px-3 py-2">{{ $row['rho'] }}</td>
                                                        <td class="px-3 py-2">{{ $row['mu'] }}</td>
                                                        <td class="px-3 py-2">{{ $row['nu'] }}</td>
                                                    </tr>
                                                @endforeach
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <div class="grid gap-8 lg:grid-cols-2">
                                <div>
                                    <h3 class="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">Tabla E.1 • Aire a presión atmosférica (SI)</h3>
                                    <div class="mt-4 overflow-x-auto rounded-xl border border-white/5">
                                        <table class="min-w-full divide-y divide-white/10 text-xs">
                                            <thead class="bg-slate-900/80 text-cyan-100">
                                                <tr>
                                                    <th class="px-3 py-2 text-left font-semibold uppercase tracking-[0.25em]">T (°C)</th>
                                                    <th class="px-3 py-2 text-left font-semibold uppercase tracking-[0.25em]">γ (N/m³)</th>
                                                    <th class="px-3 py-2 text-left font-semibold uppercase tracking-[0.25em]">ρ (kg/m³)</th>
                                                    <th class="px-3 py-2 text-left font-semibold uppercase tracking-[0.25em]">μ (Pa·s)</th>
                                                    <th class="px-3 py-2 text-left font-semibold uppercase tracking-[0.25em]">ν (m²/s)</th>
                                                </tr>
                                            </thead>
                                            <tbody class="divide-y divide-white/5">
                                                @foreach ($thermoTables['air_si'] as $row)
                                                    <tr class="hover:bg-slate-900/60">
                                                        <td class="px-3 py-2">{{ $row['t'] }}</td>
                                                        <td class="px-3 py-2">{{ $row['gamma'] }}</td>
                                                        <td class="px-3 py-2">{{ $row['rho'] }}</td>
                                                        <td class="px-3 py-2">{{ $row['mu'] }}</td>
                                                        <td class="px-3 py-2">{{ $row['nu'] }}</td>
                                                    </tr>
                                                @endforeach
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div>
                                    <h3 class="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">Tabla E.2 • Aire a presión atmosférica (Sistema Inglés)</h3>
                                    <div class="mt-4 overflow-x-auto rounded-xl border border-white/5">
                                        <table class="min-w-full divide-y divide-white/10 text-xs">
                                            <thead class="bg-slate-900/80 text-cyan-100">
                                                <tr>
                                                    <th class="px-3 py-2 text-left font-semibold uppercase tracking-[0.25em]">T (°F)</th>
                                                    <th class="px-3 py-2 text-left font-semibold uppercase tracking-[0.25em]">ρ (slug/pie³)</th>
                                                    <th class="px-3 py-2 text-left font-semibold uppercase tracking-[0.25em]">γ (lb/pie³)</th>
                                                    <th class="px-3 py-2 text-left font-semibold uppercase tracking-[0.25em]">μ (lb·s/pie²)</th>
                                                    <th class="px-3 py-2 text-left font-semibold uppercase tracking-[0.25em]">ν (pie²/s)</th>
                                                </tr>
                                            </thead>
                                            <tbody class="divide-y divide-white/5">
                                                @foreach ($thermoTables['air_imperial'] as $row)
                                                    <tr class="hover:bg-slate-900/60">
                                                        <td class="px-3 py-2">{{ $row['t'] }}</td>
                                                        <td class="px-3 py-2">{{ $row['rho'] }}</td>
                                                        <td class="px-3 py-2">{{ $row['gamma'] }}</td>
                                                        <td class="px-3 py-2">{{ $row['mu'] }}</td>
                                                        <td class="px-3 py-2">{{ $row['nu'] }}</td>
                                                    </tr>
                                                @endforeach
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

</div>
@endsection

