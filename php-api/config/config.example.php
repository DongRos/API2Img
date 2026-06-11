<?php

return [
    'app' => [
        'env' => 'production',
        'allowed_origins' => [
            'https://api2image.top',
            'https://www.api2image.top',
        ],
        'cookie_domain' => '',
        'secure_cookies' => true,
        'cookie_samesite' => 'Lax',
        'session_days' => 30,
        'code_ttl_minutes' => 10,
        'recharge_url' => 'https://deep666.top/',
        'public_api_base_url' => '',
    ],
    'db' => [
        'host' => 'localhost',
        'port' => 3306,
        'database' => 'a666002',
        'username' => 'a666002',
        'password' => 'CHANGE_ME',
        'charset' => 'utf8mb4',
    ],
    'mail' => [
        'from_email' => 'CHANGE_ME@qq.com',
        'from_name' => 'API2image',
        'smtp_host' => 'smtp.qq.com',
        'smtp_port' => 465,
        'smtp_secure' => 'ssl',
        'smtp_username' => 'CHANGE_ME@qq.com',
        'smtp_password' => 'CHANGE_ME',
        'debug_log' => __DIR__ . '/../storage/mail.log',
    ],
    'platform' => [
        'text_endpoint' => 'CHANGE_ME',
        'edit_endpoint' => '',
        'api_key' => 'CHANGE_ME',
        'price_cents' => 10,
        'upstream_cost_cents' => 4,
        'max_count' => 4,
    ],
    'security' => [
        'secret' => 'CHANGE_ME_TO_A_LONG_RANDOM_STRING',
        'admin_password' => 'CHANGE_ME',
    ],
];
