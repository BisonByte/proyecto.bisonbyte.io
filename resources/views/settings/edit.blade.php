@extends('layouts.app')

@section('title', 'Configuración del sistema')

@section('content')
    @php
        $esp32Enabled = (bool) ($esp32['enabled'] ?? false);
        $activationMode = strtoupper($esp32['activation_mode'] ?? 'HTTP');
        $activationTag = $esp32Enabled ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200' : 'border-amber-500/40 bg-amber-500/10 text-amber-200';
    @endphp

    <div class="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header class="mb-10 flex flex-wrap items-center justify-between gap-4">
            <div>
                <p class="text-xs font-semibold uppercase tracking-[0.4em] text-cyan-200">Centro de configuración</p>
                <h1 class="mt-2 text-3xl font-semibold tracking-tight text-white">Ajustes del ESP32 y acceso demo</h1>
                <p class="mt-2 max-w-2xl text-sm text-white/70">
                    Actualiza las credenciales del panel de demostración y los parámetros de conexión hacia el módulo ESP32. 
                    Los cambios se almacenan en el servidor y se aplican inmediatamente al dashboard principal.
                </p>
            </div>
            <a
                href="{{ route('dashboard') }}"
                class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white/80 transition hover:border-cyan-400/40 hover:bg-cyan-500/10 hover:text-cyan-100"
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 10.707a1 1 0 01-1.414 0L11 6.414V17a1 1 0 11-2 0V6.414L4.707 10.707a1 1 0 01-1.414-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 010 1.414z" clip-rule="evenodd" /></svg>
                Volver al dashboard
            </a>
        </header>

        @if ($status)
            <div class="mb-6 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-5 text-sm text-emerald-100 shadow-lg shadow-emerald-500/20">
                {{ $status }}
            </div>
        @endif

        @if ($errors->any())
            <div class="mb-6 rounded-3xl border border-rose-500/30 bg-rose-500/10 px-6 py-5 text-sm text-rose-100 shadow-lg shadow-rose-500/20">
                {{ __('Revisa los campos marcados e intenta nuevamente.') }}
            </div>
        @endif

        <div class="grid gap-8 lg:grid-cols-2">
            <section class="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs uppercase tracking-widest text-white/50">Configuración</p>
                        <h2 class="text-2xl font-semibold text-white">Configuración ESP32</h2>
                        <p class="mt-2 text-sm text-white/60">
                            Define cómo Laravel se comunica con el módulo de control. Activa el hardware cuando esté listo para recibir los comandos ON/OFF.
                        </p>
                    </div>
                    <span class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] {{ $activationTag }}">
                        <span class="h-1.5 w-1.5 rounded-full {{ $esp32Enabled ? 'bg-emerald-300 animate-pulse' : 'bg-amber-300' }}"></span>
                        {{ $esp32Enabled ? 'Activo' : 'Pendiente' }}
                    </span>
                </div>

                <form action="{{ route('settings.esp32.update') }}" method="POST" class="mt-6 space-y-5">
                    @csrf
                    @method('PUT')

                    <div class="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                        <label for="esp32-enabled" class="text-sm font-semibold text-white">Hardware habilitado</label>
                        <div class="flex items-center gap-3">
                            <span class="text-xs uppercase tracking-[0.3em] text-white/60">{{ $esp32Enabled ? 'Sí' : 'No' }}</span>
                            <label class="relative inline-flex cursor-pointer items-center">
                                <input type="checkbox" id="esp32-enabled" name="enabled" value="1" class="peer sr-only" {{ $esp32Enabled ? 'checked' : '' }}>
                                <div class="h-6 w-11 rounded-full bg-white/10 transition peer-checked:bg-emerald-400/70"></div>
                                <div class="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5"></div>
                            </label>
                        </div>
                    </div>

                    <div class="grid gap-4 text-sm text-white/70 sm:grid-cols-2">
                        <div>
                            <label for="device_id" class="text-xs uppercase tracking-widest text-white/50">Identificador</label>
                            <input
                                id="device_id"
                                name="device_id"
                                type="text"
                                value="{{ old('device_id', $esp32['device_id'] ?? '') }}"
                                required
                                class="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/90 focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                            >
                        </div>
                        <div>
                            <label for="firmware_version" class="text-xs uppercase tracking-widest text-white/50">Firmware</label>
                            <input
                                id="firmware_version"
                                name="firmware_version"
                                type="text"
                                value="{{ old('firmware_version', $esp32['firmware_version'] ?? '') }}"
                                required
                                class="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/90 focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                            >
                        </div>
                        <div>
                            <label for="activation_mode" class="text-xs uppercase tracking-widest text-white/50">Modo de activación</label>
                            <select
                                id="activation_mode"
                                name="activation_mode"
                                class="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/90 focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                            >
                                <option value="http" {{ ($esp32['activation_mode'] ?? '') === 'http' ? 'selected' : '' }}>HTTP</option>
                                <option value="mqtt" {{ ($esp32['activation_mode'] ?? '') === 'mqtt' ? 'selected' : '' }}>MQTT</option>
                            </select>
                        </div>
                        <div>
                            <label for="activation_key" class="text-xs uppercase tracking-widest text-white/50">Clave de activación</label>
                            <input
                                id="activation_key"
                                name="activation_key"
                                type="text"
                                value="{{ old('activation_key', $esp32['activation_key'] ?? '') }}"
                                required
                                class="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/90 focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                            >
                        </div>
                        <div class="sm:col-span-2">
                            <label for="http_endpoint" class="text-xs uppercase tracking-widest text-white/50">HTTP Endpoint</label>
                            <input
                                id="http_endpoint"
                                name="http_endpoint"
                                type="url"
                                value="{{ old('http_endpoint', $esp32['http_endpoint'] ?? '') }}"
                                placeholder="https://api.ejemplo.com/esp32/activate"
                                class="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/90 focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                            >
                        </div>
                        <div class="sm:col-span-2">
                            <label for="mqtt_topic" class="text-xs uppercase tracking-widest text-white/50">Tópico MQTT</label>
                            <input
                                id="mqtt_topic"
                                name="mqtt_topic"
                                type="text"
                                value="{{ old('mqtt_topic', $esp32['mqtt_topic'] ?? '') }}"
                                placeholder="iot/bisonbyte/pump/control"
                                class="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/90 focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                            >
                        </div>
                    </div>

                    <button
                        type="submit"
                        class="w-full rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-500 to-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:from-emerald-300 hover:via-cyan-400 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-cyan-300/60"
                    >
                        Guardar configuración del ESP32
                    </button>
                </form>
            </section>

            <section class="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs uppercase tracking-widest text-white/50">Acceso al panel</p>
                        <h2 class="text-2xl font-semibold text-white">Credenciales de demostración</h2>
                        <p class="mt-2 text-sm text-white/60">
                            Define las credenciales que se usarán para ingresar al panel. Cambia estos valores después de cada demostración.
                        </p>
                    </div>
                    <span class="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/60">Demo</span>
                </div>

                <form action="{{ route('settings.demo.update') }}" method="POST" class="mt-6 space-y-5">
                    @csrf
                    @method('PUT')

                    <div>
                        <label for="demo-username" class="text-xs uppercase tracking-widest text-white/50">Usuario</label>
                        <input
                            id="demo-username"
                            name="username"
                            type="text"
                            value="{{ old('username', $demo['username'] ?? '') }}"
                            required
                            class="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/90 focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                        >
                    </div>
                    <div>
                        <label for="demo-password" class="text-xs uppercase tracking-widest text-white/50">Contraseña</label>
                        <input
                            id="demo-password"
                            name="password"
                            type="text"
                            value="{{ old('password', $demo['password'] ?? '') }}"
                            required
                            class="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/90 focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                        >
                    </div>

                    <button
                        type="submit"
                        class="w-full rounded-2xl bg-gradient-to-r from-indigo-400 via-blue-500 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-300 hover:via-blue-400 hover:to-cyan-400 focus:outline-none focus:ring-2 focus:ring-indigo-300/60"
                    >
                        Guardar credenciales de demo
                    </button>
                </form>

                <div class="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/60">
                    Consejo: comparte estas credenciales solo durante presentaciones controladas. Para la versión final, conecta el panel a un sistema de usuarios real.
                </div>
            </section>
        </div>
    </div>
@endsection
