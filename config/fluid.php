<?php

return [
    'default' => 'bisonbyte-m25',

    'catalog' => [
        'bisonbyte-m25' => [
            'name' => 'Mezcla térmica BisonByte M-25',
            'status' => 'Recomendado',
            'description' => 'Fluido de transferencia térmica base glicol-agua diseñado para la bomba IoT. Mantiene estabilidad térmica y protección anticorrosiva en operación prolongada.',
            'properties' => [
                [
                    'label' => 'Densidad',
                    'value' => '1.035 kg/L @ 25°C',
                    'note' => 'Equivale a 1035 kg/m³; aporta presión estática adecuada en el circuito cerrado.',
                ],
                [
                    'label' => 'Viscosidad dinámica',
                    'value' => '3.4 mPa·s @ 25°C',
                    'note' => 'Valor dentro del rango óptimo del impulsor centrífugo, minimiza cavitación.',
                ],
                [
                    'label' => 'Peso específico',
                    'value' => '10.15 kN/m³',
                    'note' => 'Útil para estimar la carga hidráulica total requerida.',
                ],
                [
                    'label' => 'Capacidad calorífica',
                    'value' => '3.45 kJ/(kg·K)',
                    'note' => 'Facilita cálculos de remoción térmica en el intercambiador.',
                ],
            ],
            'operating' => [
                [
                    'label' => 'Temperatura recomendada',
                    'value' => '18°C – 34°C',
                    'note' => 'Mantiene la viscosidad dentro de la ventana objetivo y evita cavitación.',
                ],
                [
                    'label' => 'pH operativo',
                    'value' => '7.1 – 7.6',
                    'note' => 'Controla corrosión en tuberías y componentes metálicos.',
                ],
            ],
            'monitoring' => [
                'alerts' => [
                    'Viscosidad por encima de 4.5 mPa·s incrementa el consumo energético.',
                    'Densidad inferior a 1.01 kg/L indica dilución excesiva o fuga.',
                ],
                'sampling' => 'Programar muestreos semanales cuando la bomba opere en ciclo continuo.',
            ],
        ],

        'water-deionized' => [
            'name' => 'Agua desionizada',
            'status' => 'Complemento',
            'description' => 'Alternativa económica para pruebas, requiere aditivos anticorrosivos y control microbiológico.',
            'properties' => [
                [
                    'label' => 'Densidad',
                    'value' => '0.998 kg/L @ 20°C',
                ],
                [
                    'label' => 'Viscosidad dinámica',
                    'value' => '1.00 mPa·s',
                ],
                [
                    'label' => 'Peso específico',
                    'value' => '9.79 kN/m³',
                ],
            ],
            'operating' => [
                [
                    'label' => 'Temperatura recomendada',
                    'value' => '10°C – 28°C',
                ],
            ],
            'monitoring' => [
                'alerts' => [
                    'Añadir inhibidores de corrosión antes de ciclos largos.',
                    'Verificar biocida cuando el sistema permanezca detenido >48h.',
                ],
            ],
        ],

        'thermal-oil-vg32' => [
            'name' => 'Aceite térmico ISO VG32',
            'status' => 'Descartado',
            'description' => 'Alta viscosidad que sobrecarga la bomba actual; reservado para rediseños con impulsor positivo.',
            'properties' => [
                [
                    'label' => 'Densidad',
                    'value' => '0.865 kg/L @ 40°C',
                ],
                [
                    'label' => 'Viscosidad cinemática',
                    'value' => '32 cSt @ 40°C',
                ],
                [
                    'label' => 'Peso específico',
                    'value' => '8.49 kN/m³',
                ],
            ],
            'operating' => [
                [
                    'label' => 'Temperatura recomendada',
                    'value' => '40°C – 90°C',
                ],
            ],
            'monitoring' => [
                'alerts' => [
                    'Requiere bomba de desplazamiento positivo y sellos resistentes a hidrocarburos.',
                ],
            ],
        ],

        'glycol-mix-40' => [
            'name' => 'Mezcla glicol 40%',
            'status' => 'Reserva',
            'description' => 'Mayor protección anticongelante; incrementa viscosidad y demanda energética.',
            'properties' => [
                [
                    'label' => 'Densidad',
                    'value' => '1.05 kg/L @ 25°C',
                ],
                [
                    'label' => 'Viscosidad dinámica',
                    'value' => '5.1 mPa·s',
                ],
                [
                    'label' => 'Peso específico',
                    'value' => '10.30 kN/m³',
                ],
            ],
            'operating' => [
                [
                    'label' => 'Temperatura recomendada',
                    'value' => '-5°C – 30°C',
                ],
            ],
            'monitoring' => [
                'alerts' => [
                    'Asegurar ventilación adecuada en tanques de expansión.',
                ],
            ],
        ],
    ],
];
