<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Measurement extends Model
{
    /** @use HasFactory<\Database\Factories\MeasurementFactory> */
    use HasFactory;

    protected $fillable = [
        'device_id',
        'recorded_at',
        'payload',
        'flow_l_min',
        'pressure_bar',
        'temperature_c',
        'voltage_v',
        'current_a',
        'velocity_m_s',
        'density_kg_m3',
        'dynamic_viscosity_pa_s',
        'reynolds_number',
        'friction_factor',
        'pressure_drop_pa',
        'head_loss_m',
        'hydraulic_power_w',
        'calculation_details',
    ];

    protected $casts = [
        'recorded_at' => 'datetime',
        'payload' => 'array',
        'calculation_details' => 'array',
    ];

    public function device()
    {
        return $this->belongsTo(Device::class);
    }

    public function scopeForDevice($query, Device $device)
    {
        return $query->where('device_id', $device->id);
    }
}
