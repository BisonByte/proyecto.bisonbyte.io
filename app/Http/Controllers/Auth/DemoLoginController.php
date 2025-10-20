<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\SettingsRepository;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\View\View;

class DemoLoginController extends Controller
{
    public function __construct(private readonly SettingsRepository $settings)
    {
    }

    public function show(): View
    {
        return view('auth.login');
    }

    public function login(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $validCredentials = $this->settings->getDemoCredentials();

        if (
            hash_equals($credentials['username'], $validCredentials['username']) &&
            ($validCredentials['password_hash'] ?? false) &&
            Hash::check($credentials['password'], $validCredentials['password_hash'])
        ) {
            $request->session()->put('demo_authenticated', true);
            $request->session()->flash('just_logged_in', true);
            $request->session()->regenerate();

            $redirectTo = $request->session()->pull('intended_url', route('dashboard'));

            return redirect()->to($redirectTo);
        }

        return back()
            ->withErrors([
                'username' => __('Las credenciales ingresadas no son válidas en la demo.'),
            ])
            ->onlyInput('username');
    }

    public function logout(Request $request): RedirectResponse
    {
        $request->session()->forget('demo_authenticated');
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
