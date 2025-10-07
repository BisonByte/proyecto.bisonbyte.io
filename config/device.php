<?php

return [
    'esp32' => [
        'enabled' => filter_var(env('ESP32_ENABLED', false), FILTER_VALIDATE_BOOL),
        'device_id' => env('ESP32_DEVICE_ID', 'BB-ESP32-01'),
        'firmware_version' => env('ESP32_FIRMWARE_VERSION', '1.0.0'),
        'activation_mode' => env('ESP32_ACTIVATION_MODE', 'http'),
        'http_endpoint' => env('ESP32_HTTP_ENDPOINT', 'https://api.ejemplo.com/esp32/activate'),
        'mqtt_topic' => env('ESP32_MQTT_TOPIC', 'iot/bisonbyte/pump/control'),
        'activation_key' => env('ESP32_ACTIVATION_KEY', 'CLAVE-DEMO-1234'),
    ],
];
