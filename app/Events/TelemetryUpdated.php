<?php

namespace App\Events;

use App\Models\Device;
use App\Models\Measurement;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TelemetryUpdated
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public readonly Device $device,
        public readonly Measurement $measurement
    ) {
    }
}
