@extends('layouts.app')

@section('title', 'Editor hidráulico')

@push('scripts')
    @vite('resources/ts/hydraulic-designer/main.tsx')
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
