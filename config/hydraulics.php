<?php

return [
    'pipe' => [
        'diameter_m' => env('PIPE_DIAMETER_M', 0.032),
        'length_m' => env('PIPE_LENGTH_M', 12.0),
        'roughness_m' => env('PIPE_ROUGHNESS_M', 0.000045),
    ],

    'fluids' => [
        'bisonbyte-m25' => [
            'density_kg_m3' => 1035,
            'viscosity' => [
                'reference_mpa_s' => 3.4,
                'reference_temp_c' => 25,
                'temp_coefficient' => 0.026,
            ],
        ],
        'water-deionized' => [
            'density_kg_m3' => 998,
            'viscosity' => [
                'reference_mpa_s' => 1.0,
                'reference_temp_c' => 20,
                'temp_coefficient' => 0.024,
            ],
        ],
        'thermal-oil-vg32' => [
            'density_kg_m3' => 865,
            'viscosity' => [
                'reference_mpa_s' => 32.0,
                'reference_temp_c' => 40,
                'temp_coefficient' => 0.035,
            ],
        ],
        'glycol-mix-40' => [
            'density_kg_m3' => 1050,
            'viscosity' => [
                'reference_mpa_s' => 5.1,
                'reference_temp_c' => 25,
                'temp_coefficient' => 0.03,
            ],
        ],
    ],
];
