@extends('layouts.app')

@section('title', 'Editor hidráulico')

@push('scripts')
    @vite('resources/ts/main.tsx')
@endpush

@section('content')
    <div class="min-h-screen" id="system-editor-root"></div>
@endsection
