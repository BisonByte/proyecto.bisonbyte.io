<!DOCTYPE html>
<html lang="es" class="h-full">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>@yield('title', 'Panel IoT de Bombeo')</title>
        <meta name="description" content="Panel demostrativo de control IoT para bomba de fluidos." />
        <meta name="csrf-token" content="{{ csrf_token() }}" />
        @stack('head')
        @vite(['resources/css/app.css', 'resources/js/app.js'])
    </head>
    <body class="h-full bg-slate-950 text-slate-100">
        <div class="relative min-h-full overflow-hidden">
            <div class="pointer-events-none absolute inset-0 -z-10">
                <div class="absolute inset-0 opacity-40">
                    <div class="animate-[spin_40s_linear_infinite] absolute -top-20 left-10 h-[30rem] w-[30rem] rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-600 blur-3xl"></div>
                    <div class="animate-[spin_30s_linear_infinite] absolute -bottom-24 right-10 h-[26rem] w-[26rem] rounded-full bg-gradient-to-tr from-emerald-400 via-teal-500 to-sky-600 blur-3xl opacity-70"></div>
                </div>
                <div class="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.18),transparent),radial-gradient(circle_at_80%_80%,rgba(129,140,248,0.12),transparent)]"></div>
            </div>

            <main class="relative z-10 min-h-full">
                @yield('content')
            </main>
        </div>

        @stack('scripts')
    </body>
</html>
