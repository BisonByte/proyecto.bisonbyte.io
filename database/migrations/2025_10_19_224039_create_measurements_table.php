<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('measurements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_id')->constrained()->cascadeOnDelete();
            $table->timestamp('recorded_at')->index();
            $table->json('payload')->nullable();
            $table->float('flow_l_min')->nullable();
            $table->float('pressure_bar')->nullable();
            $table->float('temperature_c')->nullable();
            $table->float('voltage_v')->nullable();
            $table->float('current_a')->nullable();
            $table->float('velocity_m_s')->nullable();
            $table->float('density_kg_m3')->nullable();
            $table->float('dynamic_viscosity_pa_s')->nullable();
            $table->float('reynolds_number')->nullable();
            $table->float('friction_factor')->nullable();
            $table->float('pressure_drop_pa')->nullable();
            $table->float('head_loss_m')->nullable();
            $table->float('hydraulic_power_w')->nullable();
            $table->json('calculation_details')->nullable();
            $table->timestamps();

            $table->index(['device_id', 'recorded_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('measurements');
    }
};
