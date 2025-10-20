<?php

$defaultPasswordHash = '$2y$12$HcK1CRNsMyG6FaKl682MKeVD4hktG.PCJa.Q8r/z5NZKnB8CbWd86';

$passwordHash = env('DEMO_PASSWORD_HASH');

if ($passwordHash === null) {
    $password = env('DEMO_PASSWORD');

    $passwordHash = $password !== null
        ? password_hash($password, PASSWORD_BCRYPT)
        : $defaultPasswordHash;
}

return [
    'credentials' => [
        'username' => env('DEMO_USERNAME', 'demo'),
        'password_hash' => $passwordHash,
    ],
];
