@extends('layouts.app')

@section('title', 'Editor hidráulico')

@push('scripts')
    @php
        $vite = app(\Illuminate\Foundation\Vite::class);

        try {
            echo $vite('resources/ts/hydraulic-designer/main.tsx');
        } catch (\Illuminate\Foundation\ViteException $exception) {
            report($exception);

            echo $vite('resources/ts/main.tsx');
        }
    @endphp
@endpush

@section('content')
    <div class="min-h-screen" id="system-editor-root">
        <div class="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-300">
            <p>
                Preparando el diseñador hidráulico… Si esta pantalla permanece, verifica tu conexión o recarga la página.
            </p>
        </div>
    </div>
@endsection
