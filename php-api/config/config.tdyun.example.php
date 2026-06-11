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
        'password' => 'PASTE_DATABASE_PASSWORD_ON_SERVER',
        'charset' => 'utf8mb4',
    ],
    'mail' => [
        'from_email' => 'PASTE_QQ_EMAIL@qq.com',
        'from_name' => 'API2image',
        'smtp_host' => 'smtp.qq.com',
        'smtp_port' => 465,
        'smtp_secure' => 'ssl',
        'smtp_username' => 'PASTE_QQ_EMAIL@qq.com',
        'smtp_password' => 'PASTE_QQ_SMTP_AUTH_CODE',
        'debug_log' => __DIR__ . '/../storage/mail.log',
    ],
    'platform' => [
        'text_endpoint' => 'PASTE_PLATFORM_TEXT_ENDPOINT',
        'edit_endpoint' => '',
        'api_key' => 'PASTE_PLATFORM_API_KEY',
        'price_cents' => 10,
        'upstream_cost_cents' => 4,
        'max_count' => 4,
    ],
    'security' => [
        'secret' => 'PASTE_LONG_RANDOM_SECRET',
        'admin_password' => 'PASTE_ADMIN_PASSWORD',
    ],
];
