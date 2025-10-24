<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Device extends Model
{
    protected $fillable = [
        'mac',
        'name',
        'firmware',
        'ip',
        'topic',
        'connection_type',
        'token',
        'token_expires_at',
        'should_run',
        'reported_is_on',
        'telemetry',
        'last_seen_at',
        'last_telemetry_at',
        'last_command_at',
    ];

    protected $casts = [
        'should_run' => 'boolean',
        'reported_is_on' => 'boolean',
        'telemetry' => 'array',
        'token_expires_at' => 'datetime',
        'last_seen_at' => 'datetime',
        'last_telemetry_at' => 'datetime',
        'last_command_at' => 'datetime',
    ];

    public function measurements()
    {
        return $this->hasMany(Measurement::class);
    }

    public function pumpEvents()
    {
        return $this->hasMany(PumpEvent::class);
    }

    public function isTokenExpired(): bool
    {
        if (! $this->token_expires_at) {
            return false;
        }

        return $this->token_expires_at->isPast();
    }
}
