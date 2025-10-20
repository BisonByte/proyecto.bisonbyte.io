<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PumpEvent extends Model
{
    /** @use HasFactory<\Database\Factories\PumpEventFactory> */
    use HasFactory;

    protected $fillable = [
        'device_id',
        'recorded_at',
        'state',
        'context',
    ];

    protected $casts = [
        'recorded_at' => 'datetime',
        'context' => 'array',
    ];

    public const STATE_ON = 'on';
    public const STATE_OFF = 'off';

    public function device()
    {
        return $this->belongsTo(Device::class);
    }
}
