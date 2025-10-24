<!DOCTYPE html>
<html lang="es" class="h-full">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Control IoT | Acceso demo</title>
        <meta name="description" content="Panel demostrativo de control IoT para sistema de bombeo." />
        <meta name="csrf-token" content="{{ csrf_token() }}" />
        @vite(['resources/css/app.css', 'resources/js/app.js'])
    </head>
    <body class="h-full bg-slate-950 text-white">
        <div class="relative flex min-h-full items-center justify-center overflow-hidden px-6 py-16">
            <div class="absolute inset-0 -z-10">
                <div class="absolute inset-0 opacity-60">
                    <div class="animate-[spin_28s_linear_infinite] absolute -left-32 top-10 h-96 w-96 rounded-full bg-gradient-to-br from-sky-500 via-purple-500 to-indigo-600 blur-3xl"></div>
                    <div class="animate-[spin_22s_linear_infinite] absolute -right-24 bottom-0 h-[28rem] w-[28rem] rounded-full bg-gradient-to-tr from-emerald-400 via-cyan-500 to-blue-600 blur-3xl opacity-80"></div>
                </div>
                <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),_transparent),_radial-gradient(circle_at_bottom,_rgba(129,140,248,0.15),_transparent)]"></div>
            </div>

            <div class="w-full max-w-xl space-y-8 rounded-3xl border border-white/10 bg-white/5 p-10 backdrop-blur">
                <div class="space-y-3 text-center">
                    <span class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">
                        Demo exclusiva
                    </span>
                    <h1 class="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Sistema IoT de Bombeo</h1>
                    <p class="text-sm text-white/70">
                        Accede con las credenciales de demostración <span class="font-semibold text-cyan-200">demo / demo</span> para explorar el prototipo de control en tiempo real.
                    </p>
                </div>

                @if ($errors->any())
                    <div class="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200 shadow-inner">
                        {{ $errors->first() }}
                    </div>
                @endif

                @if (session('status'))
                    <div class="rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100 shadow-inner">
                        {{ session('status') }}
                    </div>
                @endif

                <form action="{{ route('login') }}" method="POST" class="space-y-5">
                    @csrf
                    <div class="space-y-2">
                        <label for="username" class="block text-sm font-medium text-white/80">Usuario</label>
                        <div class="relative">
                            <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-white/40">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 10a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 0114 0H3z" /></svg>
                            </span>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                value="{{ old('username', 'demo') }}"
                                required
                                autocomplete="username"
                                class="w-full rounded-xl border border-white/10 bg-white/10 py-3 pl-10 pr-4 text-sm text-white/90 shadow-lg shadow-slate-900/20 transition focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                                placeholder="Ingresa el usuario"
                            />
                        </div>
                    </div>
                    <div class="space-y-2">
                        <label for="password" class="block text-sm font-medium text-white/80">Contraseña</label>
                        <div class="relative">
                            <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-white/40">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5 8a5 5 0 0110 0v1h.5A1.5 1.5 0 0117 10.5v6A1.5 1.5 0 0115.5 18h-11A1.5 1.5 0 013 16.5v-6A1.5 1.5 0 014.5 9H5V8zm2 1h6V8a3 3 0 10-6 0v1z" clip-rule="evenodd" /></svg>
                            </span>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                value="demo"
                                required
                                class="w-full rounded-xl border border-white/10 bg-white/10 py-3 pl-10 pr-4 text-sm text-white/90 shadow-lg shadow-slate-900/20 transition focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
                                placeholder="Ingresa la contraseña"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        class="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/30 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 focus:ring-cyan-300/60 hover:from-cyan-300 hover:via-blue-400 hover:to-indigo-500"
                    >
                        <span>Ingresar al panel</span>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l5 5a.999.999 0 010 1.414l-5 5a1 1 0 11-1.414-1.414L13.586 11H3a1 1 0 110-2h10.586l-3.293-3.293a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                    </button>
                </form>

                <p class="text-center text-xs text-white/60">
                    Prototipo académico &bull; Integración prevista con hardware ESP32 y relé industrial.
                </p>
            </div>
        </div>
    </body>
</html>
