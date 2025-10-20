<?php

namespace App\Http\Middleware;

use App\Models\Device;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureDeviceTokenIsValid
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $deviceId = (int) ($request->input('device_id') ?? $request->route('device_id') ?? $request->route('device'));
        $token = $request->bearerToken() ?? $request->input('token');

        if (! $deviceId || ! $token) {
            abort(403, __('Credenciales del dispositivo no proporcionadas.'));
        }

        $device = Device::query()->find($deviceId);

        if (! $device) {
            abort(404, __('Dispositivo no encontrado.'));
        }

        if (! hash_equals($device->token, hash('sha256', $token))) {
            abort(403, __('Token inválido para el dispositivo solicitado.'));
        }

        if ($device->isTokenExpired()) {
            abort(403, __('El token del dispositivo ha caducado.'));
        }

        $request->attributes->set('device', $device);

        return $next($request);
    }
}
