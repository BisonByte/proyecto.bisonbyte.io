<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureDemoAuthenticated
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response|RedirectResponse
    {
        if (! $request->session()->get('demo_authenticated')) {
            $request->session()->put('intended_url', $request->fullUrl());

            return redirect()->route('login')->with('status', __('Por favor inicia sesión para continuar.'));
        }

        return $next($request);
    }
}
