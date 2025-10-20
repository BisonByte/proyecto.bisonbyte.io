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
        Schema::create('devices', function (Blueprint $table) {
            $table->id();
            $table->string('mac', 32)->unique();
            $table->string('name')->nullable();
            $table->string('firmware', 64)->nullable();
            $table->string('ip', 45)->nullable();
            $table->string('topic', 180)->nullable();
            $table->string('connection_type', 20)->default('http');
            $table->string('token', 80)->unique();
            $table->timestamp('token_expires_at')->nullable();
            $table->boolean('should_run')->default(false);
            $table->boolean('reported_is_on')->nullable();
            $table->json('telemetry')->nullable();
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamp('last_telemetry_at')->nullable();
            $table->timestamp('last_command_at')->nullable();
            $table->timestamps();
            $table->index(['connection_type']);
            $table->index(['last_seen_at']);
            $table->index(['last_telemetry_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('devices');
    }
};
