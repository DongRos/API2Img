<?php

ob_start();
ini_set('display_errors', '0');
ini_set('html_errors', '0');

require __DIR__ . '/../src/helpers.php';

$config = load_config();
$pdo = null;

handle_cors($config);
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    try {
        $pdo = pdo($config);
    } catch (Throwable $dbError) {
        if (is_health_request()) {
            api_health(null, $config, $dbError);
            exit;
        }
        throw $dbError;
    }
    route_request($pdo, $config);
} catch (HttpError $error) {
    if ($pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_response($error->getMessage(), $error->status, $error->errorCode);
} catch (Throwable $error) {
    if ($pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_response($config['app']['env'] === 'production' ? '服务器错误，请稍后再试' : $error->getMessage(), 500, 'server_error');
}

function handle_cors(array $config): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowed = $config['app']['allowed_origins'] ?? [];
    if ($origin !== '' && in_array($origin, $allowed, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
    }
    header('Access-Control-Allow-Headers: Content-Type, X-Admin-Password, X-Api2Image-Session');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Vary: Origin');
}

function route_request(PDO $pdo, array $config): void
{
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $path = current_path();

    if ($method === 'GET' && $path === '/api/health') {
        api_health($pdo, $config);
        return;
    }
    if ($method === 'POST' && $path === '/api/auth/send-code') {
        auth_send_code($pdo, $config);
        return;
    }
    if ($method === 'POST' && $path === '/api/auth/verify') {
        auth_verify($pdo, $config);
        return;
    }
    if ($method === 'GET' && $path === '/api/auth/me') {
        auth_me($pdo, $config);
        return;
    }
    if ($method === 'POST' && $path === '/api/auth/logout') {
        auth_logout($pdo, $config);
        return;
    }
    if ($method === 'GET' && $path === '/api/billing/config') {
        billing_config($pdo, $config);
        return;
    }
    if ($method === 'POST' && $path === '/api/billing/redeem') {
        billing_redeem($pdo, $config);
        return;
    }
    if ($method === 'GET' && $path === '/api/billing/ledger') {
        billing_ledger($pdo, $config);
        return;
    }
    if ($method === 'GET' && $path === '/api/site/stats') {
        site_stats($pdo, $config);
        return;
    }
    if ($method === 'POST' && $path === '/api/site/track') {
        site_track($pdo, $config);
        return;
    }
    if ($method === 'GET' && $path === '/api/gallery') {
        gallery_list($pdo, $config);
        return;
    }
    if ($method === 'POST' && $path === '/api/gallery') {
        gallery_upload($pdo, $config);
        return;
    }
    if ($method === 'GET' && preg_match('#^/api/gallery/image/([^/]+)$#', $path, $matches)) {
        gallery_image_read((string)$matches[1]);
        return;
    }
    if ($method === 'POST' && $path === '/api/generate/ticket') {
        generate_ticket($pdo, $config);
        return;
    }
    if ($method === 'POST' && $path === '/api/generate/direct-config') {
        generate_direct_config($pdo, $config);
        return;
    }
    if ($method === 'POST' && $path === '/api/generate/platform') {
        generate_platform($pdo, $config);
        return;
    }
    if ($method === 'POST' && $path === '/api/generate/platform-image-task/start') {
        generate_platform_image_task_start($pdo, $config);
        return;
    }
    if ($method === 'POST' && $path === '/api/generate/platform-image-task/poll') {
        generate_platform_image_task_poll($pdo, $config);
        return;
    }
    if ($method === 'POST' && $path === '/api/generate/platform-async/start') {
        generate_platform_async_start($pdo, $config);
        return;
    }
    if ($method === 'POST' && $path === '/api/generate/platform-async/poll') {
        generate_platform_async_poll($pdo, $config);
        return;
    }
    if ($method === 'POST' && $path === '/api/generate/settle') {
        settle_generation($pdo, $config);
        return;
    }
    if ($method === 'POST' && $path === '/api/generate/failure-log') {
        generation_failure_log($pdo, $config);
        return;
    }
    if ($method === 'POST' && $path === '/api/reference-image') {
        reference_image_upload($config);
        return;
    }
    if ($method === 'GET' && preg_match('#^/api/reference-image/([^/]+)$#', $path, $matches)) {
        reference_image_read((string)$matches[1]);
        return;
    }
    if ($method === 'POST' && $path === '/api/admin/redeem-codes') {
        admin_create_redeem_codes($pdo, $config);
        return;
    }
    if ($method === 'GET' && $path === '/api/admin/ping') {
        admin_ping($pdo, $config);
        return;
    }
    if ($method === 'GET' && $path === '/api/admin/redeem-codes') {
        admin_list_redeem_codes($pdo, $config);
        return;
    }
    if ($method === 'GET' && $path === '/api/admin/user-usage') {
        admin_user_usage($pdo, $config);
        return;
    }
    if ($method === 'GET' && $path === '/api/admin/custom-api') {
        admin_get_custom_api($pdo, $config);
        return;
    }
    if ($method === 'POST' && $path === '/api/admin/custom-api') {
        admin_save_custom_api($pdo, $config);
        return;
    }
    if ($method === 'POST' && $path === '/api/admin/custom-api/global') {
        admin_apply_custom_api_global($pdo, $config);
        return;
    }
    if ($method === 'POST' && $path === '/api/admin/custom-api/history/delete') {
        admin_delete_custom_api_history($pdo, $config);
        return;
    }
    if ($method === 'POST' && $path === '/api/admin/gallery/delete') {
        gallery_delete($pdo, $config);
        return;
    }
    if ($method === 'POST' && $path === '/api/admin/gallery/pin') {
        gallery_pin($pdo, $config);
        return;
    }
    if ($method === 'POST' && $path === '/api/admin/proxy-image') {
        admin_proxy_image($pdo, $config);
        return;
    }

    error_response('接口不存在', 404, 'not_found');
}

function current_path(): string
{
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $script = dirname($_SERVER['SCRIPT_NAME'] ?? '');
    if ($script !== '/' && $script !== '\\' && starts_with($path, $script)) {
        $path = substr($path, strlen($script)) ?: '/';
    }
    if (starts_with($path, '/index.php')) {
        $path = substr($path, strlen('/index.php')) ?: '/';
    }
    return rtrim($path, '/') ?: '/';
}

function is_health_request(): bool
{
    return ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET' && current_path() === '/api/health';
}

function auth_send_code(PDO $pdo, array $config): void
{
    $payload = read_json();
    $email = normalize_email((string)($payload['email'] ?? ''));
    if ($email === '') {
        throw new HttpError('请输入有效邮箱', 400, 'invalid_email');
    }
    $recent = $pdo->prepare(
        "SELECT created_at
         FROM email_codes
         WHERE email = ? AND purpose = 'login'
         ORDER BY id DESC
         LIMIT 1"
    );
    $recent->execute([$email]);
    $createdAt = (string)($recent->fetchColumn() ?: '');
    if ($createdAt !== '' && utc_sql_age_seconds($createdAt) < 60) {
        throw new HttpError('请等待 60 秒后重新发送验证码', 429, 'code_cooldown');
    }
    enforce_rate_limit($pdo, $config, 'send_code_email', $email, 5, 3600);
    enforce_rate_limit($pdo, $config, 'send_code_ip', client_ip(), 20, 3600);

    $code = random_numeric_code();
    $codeHash = secret_hash($config, 'email-code:' . $email, $code);
    $ttl = max(1, (int)$config['app']['code_ttl_minutes']);
    $stmt = $pdo->prepare(
        'INSERT INTO email_codes (email, code_hash, purpose, expires_at, used_at, attempts, ip_hash, created_at)
         VALUES (?, ?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? MINUTE), NULL, 0, ?, UTC_TIMESTAMP())'
    );
    $stmt->execute([$email, $codeHash, 'login', $ttl, secret_hash($config, 'ip', client_ip())]);
    $codeId = (int)$pdo->lastInsertId();
    try {
        send_login_mail($config, $email, $code);
    } catch (Throwable $error) {
        $cleanup = $pdo->prepare('DELETE FROM email_codes WHERE id = ? AND used_at IS NULL');
        $cleanup->execute([$codeId]);
        throw $error;
    }
    json_response(['ok' => true, 'message' => '验证码已发送']);
}

function auth_verify(PDO $pdo, array $config): void
{
    $payload = read_json();
    $email = normalize_email((string)($payload['email'] ?? ''));
    $code = preg_replace('/\D/', '', (string)($payload['code'] ?? ''));
    if ($email === '' || strlen($code) !== 6) {
        throw new HttpError('邮箱或验证码不正确', 400, 'invalid_code');
    }
    enforce_rate_limit($pdo, $config, 'verify_code_email', $email, 20, 3600);

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare(
            "SELECT * FROM email_codes
             WHERE email = ? AND purpose = 'login' AND used_at IS NULL AND expires_at > UTC_TIMESTAMP()
             ORDER BY id DESC
             LIMIT 1
             FOR UPDATE"
        );
        $stmt->execute([$email]);
        $record = $stmt->fetch();
        if (!$record) {
            throw new HttpError('验证码已过期，请重新获取', 400, 'code_expired');
        }
        if ((int)$record['attempts'] >= 5) {
            throw new HttpError('验证码尝试次数过多，请重新获取', 429, 'too_many_attempts');
        }
        $expected = secret_hash($config, 'email-code:' . $email, $code);
        if (!hash_equals((string)$record['code_hash'], $expected)) {
            $pdo->prepare('UPDATE email_codes SET attempts = attempts + 1 WHERE id = ?')->execute([(int)$record['id']]);
            $pdo->commit();
            throw new HttpError('验证码不正确', 400, 'invalid_code');
        }
        $pdo->prepare('UPDATE email_codes SET used_at = UTC_TIMESTAMP() WHERE id = ?')->execute([(int)$record['id']]);

        $emailHash = secret_hash($config, 'email', $email);
        $userStmt = $pdo->prepare('SELECT * FROM users WHERE email = ? LIMIT 1 FOR UPDATE');
        $userStmt->execute([$email]);
        $user = $userStmt->fetch();
        if (!$user) {
            $insert = $pdo->prepare(
                "INSERT INTO users (email, email_hash, balance_cents, status, created_at, updated_at, last_login_at)
                 VALUES (?, ?, 0, 'active', UTC_TIMESTAMP(), UTC_TIMESTAMP(), UTC_TIMESTAMP())"
            );
            $insert->execute([$email, $emailHash]);
            $userId = (int)$pdo->lastInsertId();
            $userStmt = $pdo->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
            $userStmt->execute([$userId]);
            $user = $userStmt->fetch();
        } else {
            if ($user['status'] !== 'active') {
                throw new HttpError('账号已停用，请联系站长', 403, 'user_disabled');
            }
            $pdo->prepare('UPDATE users SET last_login_at = UTC_TIMESTAMP(), updated_at = UTC_TIMESTAMP() WHERE id = ?')->execute([(int)$user['id']]);
            $user['last_login_at'] = now_sql();
        }

        $token = random_token();
        $tokenHash = secret_hash($config, 'session', $token);
        $days = max(1, (int)$config['app']['session_days']);
        $session = $pdo->prepare(
            'INSERT INTO sessions (user_id, token_hash, expires_at, revoked_at, created_at, last_seen_at)
             VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? DAY), NULL, UTC_TIMESTAMP(), UTC_TIMESTAMP())'
        );
        $session->execute([(int)$user['id'], $tokenHash, $days]);
        $pdo->commit();
        set_session_cookie($config, $token, $days * 86400);
        $platform = platform_config($pdo, $config);
        $modelOptions = $platform['model_options'] ?? custom_api_model_options([], (string)$platform['model_name'], (int)$platform['price_cents']);
        json_response([
            'ok' => true,
            'user' => public_user($user),
            'priceCents' => (int)($modelOptions[0]['priceCents'] ?? $platform['price_cents']),
            'modelName' => (string)$platform['model_name'],
            'modelOptions' => $modelOptions,
            'sessionToken' => $token,
        ]);
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $error;
    }
}

function auth_me(PDO $pdo, array $config): void
{
    $user = current_user($pdo, $config);
    $platform = platform_config($pdo, $config);
    $modelOptions = $platform['model_options'] ?? custom_api_model_options([], (string)$platform['model_name'], (int)$platform['price_cents']);
    json_response([
        'ok' => true,
        'authenticated' => (bool)$user,
        'user' => $user ? public_user($user) : null,
        'priceCents' => (int)($modelOptions[0]['priceCents'] ?? $platform['price_cents']),
        'modelName' => (string)$platform['model_name'],
        'modelOptions' => $modelOptions,
        'currency' => 'CNY',
        'rechargeUrl' => public_mobile_safe_url((string)$config['app']['recharge_url']),
        'sessionToken' => $user ? current_session_token() : '',
        'displayName' => (string)($platform['display_name'] ?? '站点配置1'),
    ]);
}

function auth_logout(PDO $pdo, array $config): void
{
    $token = current_session_token();
    if ($token !== '') {
        $tokenHash = secret_hash($config, 'session', $token);
        $stmt = $pdo->prepare('UPDATE sessions SET revoked_at = UTC_TIMESTAMP() WHERE token_hash = ?');
        $stmt->execute([$tokenHash]);
    }
    clear_session_cookie($config);
    json_response(['ok' => true]);
}

function api_health(?PDO $pdo, array $config, ?Throwable $dbError = null): void
{
    $dbOk = false;
    if ($pdo instanceof PDO) {
        try {
            $dbOk = (bool)$pdo->query('SELECT 1')->fetchColumn();
        } catch (Throwable $error) {
            $dbError = $error;
            $dbOk = false;
        }
    }
    $platform = ($dbOk && $pdo instanceof PDO) ? platform_config($pdo, $config) : fallback_platform_config($config);
    json_response([
        'ok' => $dbOk,
        'service' => 'api2image-php-wallet',
        'time' => now_sql(),
        'phpVersion' => PHP_VERSION,
        'dbOk' => $dbOk,
        'extensions' => [
            'pdo_mysql' => extension_loaded('pdo_mysql'),
            'curl' => extension_loaded('curl'),
            'openssl' => extension_loaded('openssl'),
        ],
        'platformConfigured' => platform_is_configured($platform),
        'mailConfigured' => trim((string)$config['mail']['smtp_host']) !== '' && trim((string)$config['mail']['smtp_username']) !== '',
        'secretConfigured' => is_secret_configured($config),
        'dbError' => $dbOk || !$dbError ? '' : substr($dbError->getMessage(), 0, 180),
    ], $dbOk ? 200 : 500);
}

function public_mobile_safe_url(string $url): string
{
    return preg_replace('/^https?:\/\/(?:www\.|api\.)?api2img\.shop(?=\/|$)/i', 'https://deep666.top', $url) ?? $url;
}

function public_generation_api_base_url(array $config): string
{
    $configured = rtrim(public_mobile_safe_url((string)($config['app']['public_api_base_url'] ?? '')), '/');
    if ($configured !== '' && !preg_match('#^https?://(?:www\.)?deep666\.top(?:/|$)#i', $configured)) {
        return $configured;
    }
    return request_public_site_origin_url();
}

function reference_image_upload(array $config): void
{
    $payload = read_json();
    [$bytes, $mime, $extension] = reference_image_decode((string)($payload['dataUrl'] ?? ''));
    if (strlen($bytes) > 4 * 1024 * 1024) {
        throw new HttpError('参考图不能超过 4MB', 413, 'reference_image_too_large');
    }

    json_response([
        'ok' => true,
        'url' => reference_image_store($config, $bytes, $extension),
        'mime' => $mime,
        'expiresIn' => 21600,
    ]);
}

function reference_image_read(string $filename): void
{
    $filename = basename(rawurldecode($filename));
    if (!preg_match('/^[A-Za-z0-9_-]+\.(?:png|jpe?g|webp)$/', $filename)) {
        throw new HttpError('参考图不存在', 404, 'reference_image_not_found');
    }
    $path = reference_image_dir() . DIRECTORY_SEPARATOR . $filename;
    if (!is_file($path) || time() - (int)filemtime($path) > 21600) {
        throw new HttpError('参考图不存在或已过期', 404, 'reference_image_not_found');
    }

    discard_accidental_output();
    $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    $mime = $extension === 'png' ? 'image/png' : ($extension === 'webp' ? 'image/webp' : 'image/jpeg');
    header('Content-Type: ' . $mime);
    header('Cache-Control: public, max-age=21600');
    header('Content-Length: ' . filesize($path));
    readfile($path);
    exit;
}

function reference_image_decode(string $dataUrl): array
{
    if (!preg_match('/^data:(image\/(?:png|jpe?g|webp))(;base64)?,(.*)$/is', $dataUrl, $matches)) {
        throw new HttpError('参考图格式无效', 400, 'invalid_reference_image');
    }
    $mime = strtolower($matches[1]);
    $raw = $matches[2] !== ''
        ? base64_decode(preg_replace('/\s+/', '', $matches[3]), true)
        : rawurldecode($matches[3]);
    if ($raw === false || $raw === '') {
        throw new HttpError('参考图数据无效', 400, 'invalid_reference_image');
    }
    $extension = $mime === 'image/png' ? 'png' : ($mime === 'image/webp' ? 'webp' : 'jpg');
    return [$raw, $mime, $extension];
}

function reference_image_store(array $config, string $bytes, string $extension, string $baseOverride = ''): string
{
    $dir = reference_image_dir();
    if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
        throw new HttpError('参考图临时目录不可写', 500, 'reference_image_storage_failed');
    }
    reference_image_cleanup($dir);

    $extension = in_array($extension, ['png', 'jpg', 'jpeg', 'webp'], true) ? $extension : 'png';
    $filename = random_token(18) . '.' . $extension;
    $path = $dir . DIRECTORY_SEPARATOR . $filename;
    if (file_put_contents($path, $bytes, LOCK_EX) === false) {
        throw new HttpError('参考图保存失败', 500, 'reference_image_storage_failed');
    }

    $base = rtrim($baseOverride, '/');
    if ($base === '') {
        $base = public_generation_api_base_url($config);
    }
    if ($base === '') {
        $base = request_public_api_base_url();
    }
    return $base . '/api/reference-image/' . rawurlencode($filename);
}

function reference_image_dir(): string
{
    return rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'api2img_reference_images';
}

function reference_image_cleanup(string $dir): void
{
    foreach (glob($dir . DIRECTORY_SEPARATOR . '*.{png,jpg,jpeg,webp}', GLOB_BRACE) ?: [] as $path) {
        if (is_file($path) && time() - (int)filemtime($path) > 21600) {
            @unlink($path);
        }
    }
}

function request_public_api_base_url(): string
{
    $host = (string)($_SERVER['HTTP_X_FORWARDED_HOST'] ?? $_SERVER['HTTP_HOST'] ?? '');
    $proto = (string)($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '');
    if ($proto === '') {
        $proto = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    }
    $script = (string)($_SERVER['SCRIPT_NAME'] ?? '/index.php');
    $basePath = rtrim(str_replace('\\', '/', dirname($script)), '/');
    return rtrim($proto . '://' . $host . ($basePath === '' ? '' : $basePath) . '/index.php', '/');
}

function request_public_origin_url(): string
{
    $host = (string)($_SERVER['HTTP_X_FORWARDED_HOST'] ?? $_SERVER['HTTP_HOST'] ?? '');
    $proto = (string)($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '');
    if ($proto === '') {
        $proto = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    }
    return rtrim($proto . '://' . $host, '/');
}

function request_public_site_origin_url(): string
{
    $origin = request_header_public_origin((string)($_SERVER['HTTP_ORIGIN'] ?? ''));
    if ($origin !== '') {
        return $origin;
    }
    $referer = request_header_public_origin((string)($_SERVER['HTTP_REFERER'] ?? ''));
    if ($referer !== '') {
        return $referer;
    }
    $host = (string)($_SERVER['HTTP_X_FORWARDED_HOST'] ?? $_SERVER['HTTP_HOST'] ?? '');
    if ($host !== '' && !preg_match('/(?:^|\.)qcloudteo\.com$/i', $host)) {
        return request_public_origin_url();
    }
    return 'https://api2image.top';
}

function request_header_public_origin(string $value): string
{
    $value = trim($value);
    if ($value === '') {
        return '';
    }
    $scheme = strtolower((string)parse_url($value, PHP_URL_SCHEME));
    $host = strtolower((string)parse_url($value, PHP_URL_HOST));
    if (!in_array($scheme, ['http', 'https'], true) || $host === '') {
        return '';
    }
    if (!preg_match('/(?:^|\.)api2image\.top$/i', $host)) {
        return '';
    }
    $port = parse_url($value, PHP_URL_PORT);
    return $scheme . '://' . $host . ($port ? ':' . $port : '');
}

function billing_config(PDO $pdo, array $config): void
{
    $platform = platform_config($pdo, $config);
    $modelOptions = $platform['model_options'] ?? custom_api_model_options([], (string)$platform['model_name'], (int)$platform['price_cents']);
    json_response([
        'ok' => true,
        'priceCents' => (int)($modelOptions[0]['priceCents'] ?? $platform['price_cents']),
        'upstreamCostCents' => (int)$platform['upstream_cost_cents'],
        'currency' => 'CNY',
        'platformEnabled' => platform_is_configured($platform),
        'rechargeUrl' => public_mobile_safe_url((string)$config['app']['recharge_url']),
        'directBaseUrl' => public_generation_api_base_url($config),
        'requestFormat' => (string)$platform['request_format'],
        'transportMode' => (string)($platform['transport_mode'] ?? 'proxy'),
        'customTemplate' => (string)$platform['custom_template'],
        'modelName' => (string)$platform['model_name'],
        'modelOptions' => $modelOptions,
        'displayName' => (string)($platform['display_name'] ?? '站点配置1'),
    ]);
}

function billing_redeem(PDO $pdo, array $config): void
{
    $user = require_user($pdo, $config);
    $payload = read_json();
    $code = normalize_code((string)($payload['code'] ?? ''));
    if ($code === '') {
        throw new HttpError('请输入充值码', 400, 'invalid_redeem_code');
    }
    enforce_rate_limit($pdo, $config, 'redeem_user', (string)$user['id'], 30, 3600);
    enforce_rate_limit($pdo, $config, 'redeem_ip', client_ip(), 80, 3600);
    $codeHash = secret_hash($config, 'redeem-code', $code);
    ensure_usage_log_columns($pdo);

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare('SELECT * FROM redeem_codes WHERE code_hash = ? LIMIT 1 FOR UPDATE');
        $stmt->execute([$codeHash]);
        $redeem = $stmt->fetch();
        if (!$redeem || $redeem['status'] !== 'active') {
            throw new HttpError('充值码不存在或已使用', 400, 'redeem_unavailable');
        }
        $fresh = $pdo->prepare('SELECT * FROM users WHERE id = ? FOR UPDATE');
        $fresh->execute([(int)$user['id']]);
        $lockedUser = $fresh->fetch();
        $before = (int)$lockedUser['balance_cents'];
        $amount = (int)$redeem['amount_cents'];
        $after = $before + $amount;
        $pdo->prepare(
            "UPDATE redeem_codes SET status = 'used', used_by_user_id = ?, used_at = UTC_TIMESTAMP() WHERE id = ? AND status = 'active'"
        )->execute([(int)$user['id'], (int)$redeem['id']]);
        $pdo->prepare('UPDATE users SET balance_cents = ?, updated_at = UTC_TIMESTAMP() WHERE id = ?')->execute([$after, (int)$user['id']]);
        create_ledger($pdo, (int)$user['id'], 'redeem', $amount, $before, $after, (string)$redeem['id'], (string)$redeem['label']);
        $pdo->commit();
        $lockedUser['balance_cents'] = $after;
        json_response([
            'ok' => true,
            'user' => public_user($lockedUser),
            'redemption' => [
                'amountCents' => $amount,
                'label' => (string)$redeem['label'],
                'code' => mask_code($code),
            ],
        ]);
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $error;
    }
}

function billing_ledger(PDO $pdo, array $config): void
{
    $user = require_user($pdo, $config);
    ensure_usage_log_columns($pdo);
    backfill_redeem_ledger_log_codes($pdo, (int)$user['id']);
    $stmt = $pdo->prepare(
        'SELECT * FROM wallet_ledger WHERE user_id = ? ORDER BY id DESC LIMIT 50'
    );
    $stmt->execute([(int)$user['id']]);
    $countStmt = $pdo->prepare('SELECT COUNT(*) FROM wallet_ledger WHERE user_id = ?');
    $countStmt->execute([(int)$user['id']]);
    $ledgerCount = (int)$countStmt->fetchColumn();
    $items = [];
    foreach ($stmt->fetchAll() as $item) {
        $items[] = public_ledger_item($item);
    }
    json_response(['ok' => true, 'ledger' => $items, 'ledgerCount' => $ledgerCount]);
}

function public_ledger_item(array $item): array
{
    return [
        'id' => (int)$item['id'],
        'type' => (string)$item['type'],
        'amountCents' => (int)$item['amount_cents'],
        'balanceBeforeCents' => (int)$item['balance_before_cents'],
        'balanceAfterCents' => (int)$item['balance_after_cents'],
        'relatedId' => (string)$item['related_id'],
        'logCode' => (string)($item['log_code'] ?? ''),
        'note' => public_ledger_note((string)$item['note']),
        'createdAt' => utc_sql_timestamp_ms((string)$item['created_at']),
    ];
}

function public_generation_request_item(array $item): array
{
    $requestPreview = trim((string)($item['request_preview'] ?? ''));
    if ($requestPreview === '') {
        $requestPreview = public_generation_request_preview($item);
    }
    $responsePreview = trim((string)($item['response_preview'] ?? ''));
    if ($responsePreview === '') {
        $responsePreview = public_generation_response_preview($item);
    }
    return [
        'id' => (int)($item['id'] ?? 0),
        'requestId' => (string)($item['request_id'] ?? ''),
        'logCode' => (string)($item['log_code'] ?? ''),
        'mode' => (string)($item['mode'] ?? ''),
        'model' => (string)($item['model'] ?? ''),
        'prompt' => (string)($item['prompt'] ?? ''),
        'size' => (string)($item['size'] ?? ''),
        'ratio' => (string)($item['ratio'] ?? ''),
        'batchIndex' => (int)($item['batch_index'] ?? 0),
        'batchTotal' => (int)($item['batch_total'] ?? 0),
        'imageCount' => (int)($item['image_count'] ?? 0),
        'priceCents' => (int)($item['price_cents'] ?? 0),
        'totalCents' => (int)($item['total_cents'] ?? 0),
        'status' => (string)($item['status'] ?? ''),
        'errorMessage' => (string)($item['error_message'] ?? ''),
        'requestPreview' => $requestPreview,
        'responsePreview' => $responsePreview,
        'httpStatus' => (int)($item['http_status'] ?? 0),
        'contentType' => (string)($item['content_type'] ?? ''),
        'requestVariant' => (string)($item['request_variant'] ?? ''),
        'createdAt' => utc_sql_timestamp_ms((string)($item['created_at'] ?? '')),
        'completedAt' => !empty($item['completed_at']) ? utc_sql_timestamp_ms((string)$item['completed_at']) : 0,
    ];
}

function public_generation_request_preview(array $item): string
{
    $request = [
        'mode' => (string)($item['mode'] ?? ''),
        'model' => (string)($item['model'] ?? ''),
        'prompt' => (string)($item['prompt'] ?? ''),
        'size' => (string)($item['size'] ?? ''),
        'ratio' => (string)($item['ratio'] ?? ''),
        'batchIndex' => (int)($item['batch_index'] ?? 0),
        'batchTotal' => (int)($item['batch_total'] ?? 0),
        'requestVariant' => (string)($item['request_variant'] ?? ''),
        'httpStatus' => (int)($item['http_status'] ?? 0),
        'contentType' => (string)($item['content_type'] ?? ''),
    ];
    $json = json_encode(array_filter($request, static fn($value) => $value !== '' && $value !== 0 && $value !== []), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    return $json !== false ? $json : '';
}

function public_generation_response_preview(array $item): string
{
    $status = (string)($item['status'] ?? '');
    $error = trim((string)($item['error_message'] ?? ''));
    $contentType = trim((string)($item['content_type'] ?? ''));
    $httpStatus = (int)($item['http_status'] ?? 0);
    $parts = [];
    if ($httpStatus > 0) {
        $parts[] = 'HTTP ' . $httpStatus;
    }
    if ($contentType !== '') {
        $parts[] = $contentType;
    }
    if ($status !== '') {
        $parts[] = $status;
    }
    if ($error !== '') {
        $parts[] = $error;
    }
    return implode(' · ', $parts);
}

function public_ledger_note(string $note): string
{
    $note = trim($note);
    if ($note === '') {
        return '';
    }
    $note = preg_replace('/\s+mp[a-z0-9]{5,}(?:-[a-z0-9]{4,})?\s*$/i', '', $note) ?? $note;
    $note = preg_replace('/\s+image2-[a-z0-9-]{6,}\s*$/i', '', $note) ?? $note;
    return trim($note);
}

function site_track(PDO $pdo, array $config): void
{
    $payload = read_json();
    $kind = strtolower(trim((string)($payload['kind'] ?? 'visit')));
    $visitorId = trim((string)($payload['visitorId'] ?? ''));
    record_site_activity($pdo, $config, $visitorId, $kind === 'heartbeat' ? 'heartbeat' : 'visit');
    json_response(['ok' => true, 'siteStats' => site_public_stats_payload($pdo)]);
}

function site_stats(PDO $pdo, array $config): void
{
    require_admin($pdo, $config);
    json_response(['ok' => true, 'siteStats' => site_stats_payload($pdo)]);
}

function gallery_list(PDO $pdo, array $config): void
{
    ensure_gallery_tables($pdo);
    $limit = max(1, min(120, (int)($_GET['limit'] ?? 80)));
    $stmt = $pdo->prepare(
        "SELECT g.*, u.email AS user_email
         FROM gallery_images g
         LEFT JOIN users u ON u.id = g.user_id
         WHERE g.status = 'active'
         ORDER BY g.pinned_at IS NULL ASC, g.pinned_at DESC, g.id DESC
         LIMIT ?"
    );
    $stmt->bindValue(1, $limit, PDO::PARAM_INT);
    $stmt->execute();
    $items = [];
    foreach ($stmt->fetchAll() as $row) {
        $item = public_gallery_item($row);
        if ($item !== []) {
            $items[] = $item;
        }
    }
    json_response(['ok' => true, 'gallery' => $items]);
}

function gallery_upload(PDO $pdo, array $config): void
{
    $user = require_user($pdo, $config);
    ensure_gallery_tables($pdo);
    $payload = read_json();
    [$bytes, $mime, $extension] = reference_image_decode((string)($payload['dataUrl'] ?? ''));
    if (strlen($bytes) > 5 * 1024 * 1024) {
        throw new HttpError('上传到画廊的图片不能超过 5MB', 413, 'gallery_image_too_large');
    }
    $info = @getimagesizefromstring($bytes);
    $width = is_array($info) ? max(1, (int)($info[0] ?? 1)) : max(1, (int)($payload['width'] ?? 1));
    $height = is_array($info) ? max(1, (int)($info[1] ?? 1)) : max(1, (int)($payload['height'] ?? 1));
    $dir = gallery_image_dir();
    if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
        throw new HttpError('画廊目录不可写', 500, 'gallery_storage_failed');
    }
    $filename = random_token(18) . '.' . ($extension === 'jpeg' ? 'jpg' : $extension);
    $path = $dir . DIRECTORY_SEPARATOR . $filename;
    if (file_put_contents($path, $bytes, LOCK_EX) === false) {
        throw new HttpError('画廊图片保存失败', 500, 'gallery_storage_failed');
    }

    $stmt = $pdo->prepare(
        "INSERT INTO gallery_images
         (user_id, image_filename, mime_type, prompt, model, ratio, resolution_tier, size, quality, width, height, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', UTC_TIMESTAMP())"
    );
    $stmt->execute([
        (int)$user['id'],
        $filename,
        $mime,
        usage_log_text((string)($payload['prompt'] ?? ''), 1000),
        custom_api_model_name((string)($payload['model'] ?? '')),
        gallery_ratio((string)($payload['ratio'] ?? '')),
        gallery_resolution_tier((string)($payload['resolutionTier'] ?? $payload['resolution_tier'] ?? '')),
        usage_log_text((string)($payload['size'] ?? ''), 40),
        usage_log_text((string)($payload['quality'] ?? ''), 40),
        $width,
        $height,
    ]);
    $id = (int)$pdo->lastInsertId();
    $row = [
        'id' => $id,
        'image_filename' => $filename,
        'mime_type' => $mime,
        'prompt' => usage_log_text((string)($payload['prompt'] ?? ''), 1000),
        'model' => custom_api_model_name((string)($payload['model'] ?? '')),
        'ratio' => gallery_ratio((string)($payload['ratio'] ?? '')),
        'resolution_tier' => gallery_resolution_tier((string)($payload['resolutionTier'] ?? $payload['resolution_tier'] ?? '')),
        'size' => usage_log_text((string)($payload['size'] ?? ''), 40),
        'quality' => usage_log_text((string)($payload['quality'] ?? ''), 40),
        'width' => $width,
        'height' => $height,
        'created_at' => now_sql(),
        'user_email' => (string)($user['email'] ?? ''),
    ];
    json_response(['ok' => true, 'item' => public_gallery_item($row)]);
}

function gallery_image_read(string $filename): void
{
    $filename = basename(rawurldecode($filename));
    if (!preg_match('/^[A-Za-z0-9_-]+\.(?:png|jpe?g|webp)$/', $filename)) {
        throw new HttpError('画廊图片不存在', 404, 'gallery_image_not_found');
    }
    $path = gallery_image_dir() . DIRECTORY_SEPARATOR . $filename;
    if (!is_file($path)) {
        throw new HttpError('画廊图片不存在', 404, 'gallery_image_not_found');
    }
    discard_accidental_output();
    $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    $mime = $extension === 'png' ? 'image/png' : ($extension === 'webp' ? 'image/webp' : 'image/jpeg');
    header('Content-Type: ' . $mime);
    header('Cache-Control: public, max-age=31536000, immutable');
    header('Content-Length: ' . filesize($path));
    readfile($path);
    exit;
}

function gallery_delete(PDO $pdo, array $config): void
{
    require_admin($pdo, $config);
    ensure_gallery_tables($pdo);
    $payload = read_json();
    $action = strtolower(trim((string)($payload['action'] ?? 'delete')));
    if ($action === 'pin' || $action === 'toggle-pin') {
        gallery_pin_payload($pdo, $payload);
        return;
    }
    $id = max(0, (int)($payload['id'] ?? 0));
    if ($id <= 0) {
        throw new HttpError('画廊图片不存在', 404, 'gallery_image_not_found');
    }

    $stmt = $pdo->prepare("SELECT id, image_filename FROM gallery_images WHERE id = ? AND status = 'active' LIMIT 1");
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) {
        throw new HttpError('画廊图片不存在', 404, 'gallery_image_not_found');
    }

    $pdo->prepare("UPDATE gallery_images SET status = 'hidden' WHERE id = ?")->execute([$id]);
    $filename = basename((string)($row['image_filename'] ?? ''));
    if ($filename !== '' && preg_match('/^[A-Za-z0-9_-]+\.(?:png|jpe?g|webp)$/', $filename)) {
        $path = gallery_image_dir() . DIRECTORY_SEPARATOR . $filename;
        if (is_file($path)) {
            @unlink($path);
        }
    }
    json_response(['ok' => true, 'deletedId' => (string)$id]);
}

function gallery_pin(PDO $pdo, array $config): void
{
    require_admin($pdo, $config);
    ensure_gallery_tables($pdo);
    $payload = read_json();
    gallery_pin_payload($pdo, $payload);
}

function gallery_pin_payload(PDO $pdo, array $payload): void
{
    $id = max(0, (int)($payload['id'] ?? 0));
    if ($id <= 0) {
        throw new HttpError('画廊图片不存在', 404, 'gallery_image_not_found');
    }

    $stmt = $pdo->prepare("SELECT id FROM gallery_images WHERE id = ? AND status = 'active' LIMIT 1");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        throw new HttpError('画廊图片不存在', 404, 'gallery_image_not_found');
    }

    $shouldPin = filter_var($payload['pinned'] ?? true, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
    if ($shouldPin === null) {
        $shouldPin = true;
    }
    $pdo->prepare("UPDATE gallery_images SET pinned_at = " . ($shouldPin ? 'UTC_TIMESTAMP()' : 'NULL') . " WHERE id = ? AND status = 'active'")->execute([$id]);
    $rowStmt = $pdo->prepare(
        "SELECT g.*, u.email AS user_email
         FROM gallery_images g
         LEFT JOIN users u ON u.id = g.user_id
         WHERE g.id = ? AND g.status = 'active'
         LIMIT 1"
    );
    $rowStmt->execute([$id]);
    $row = $rowStmt->fetch();
    json_response(['ok' => true, 'item' => public_gallery_item($row ?: [])]);
}

function public_gallery_item(array $row): array
{
    $filename = (string)($row['image_filename'] ?? '');
    if ($filename === '') {
        return [];
    }
    return [
        'id' => (string)($row['id'] ?? ''),
        'src' => '/api/gallery/image/' . rawurlencode($filename),
        'prompt' => (string)($row['prompt'] ?? ''),
        'model' => (string)($row['model'] ?? ''),
        'ratio' => (string)($row['ratio'] ?? ''),
        'resolutionTier' => (string)($row['resolution_tier'] ?? ''),
        'size' => (string)($row['size'] ?? ''),
        'quality' => (string)($row['quality'] ?? ''),
        'width' => max(1, (int)($row['width'] ?? 1)),
        'height' => max(1, (int)($row['height'] ?? 1)),
        'createdAt' => isset($row['created_at']) ? utc_sql_timestamp_ms((string)$row['created_at']) : 0,
        'pinnedAt' => !empty($row['pinned_at']) ? utc_sql_timestamp_ms((string)$row['pinned_at']) : 0,
        'uploader' => mask_gallery_email((string)($row['user_email'] ?? '')),
    ];
}

function gallery_image_dir(): string
{
    return dirname(__DIR__) . DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR . 'gallery';
}

function ensure_gallery_tables(PDO $pdo): void
{
    static $done = false;
    if ($done) {
        return;
    }
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS gallery_images (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          user_id BIGINT UNSIGNED NOT NULL,
          image_filename VARCHAR(120) NOT NULL,
          mime_type VARCHAR(80) NOT NULL DEFAULT 'image/jpeg',
          prompt VARCHAR(1000) NOT NULL DEFAULT '',
          model VARCHAR(120) NOT NULL DEFAULT '',
          ratio VARCHAR(20) NOT NULL DEFAULT '',
          resolution_tier VARCHAR(10) NOT NULL DEFAULT '',
          size VARCHAR(40) NOT NULL DEFAULT '',
          quality VARCHAR(40) NOT NULL DEFAULT '',
          width INT NOT NULL DEFAULT 1,
          height INT NOT NULL DEFAULT 1,
          status ENUM('active','hidden') NOT NULL DEFAULT 'active',
          pinned_at DATETIME NULL,
          created_at DATETIME NOT NULL,
          PRIMARY KEY (id),
          KEY idx_gallery_status_created (status, id),
          KEY idx_gallery_status_pinned_created (status, pinned_at, id),
          KEY idx_gallery_user_created (user_id, id),
          UNIQUE KEY uniq_gallery_filename (image_filename)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
    ensure_table_column($pdo, 'gallery_images', 'ratio', "VARCHAR(20) NOT NULL DEFAULT '' AFTER model");
    ensure_table_column($pdo, 'gallery_images', 'resolution_tier', "VARCHAR(10) NOT NULL DEFAULT '' AFTER ratio");
    ensure_table_column($pdo, 'gallery_images', 'quality', "VARCHAR(40) NOT NULL DEFAULT '' AFTER size");
    ensure_table_column($pdo, 'gallery_images', 'pinned_at', "DATETIME NULL AFTER status");
    ensure_table_index($pdo, 'gallery_images', 'idx_gallery_status_pinned_created', '(status, pinned_at, id)');
    $done = true;
}

function gallery_ratio(string $value): string
{
    $value = trim($value);
    return preg_match('/^(?:auto|\d{1,2}:\d{1,2})$/', $value) ? substr($value, 0, 20) : '';
}

function gallery_resolution_tier(string $value): string
{
    $value = strtoupper(trim($value));
    return in_array($value, ['1K', '2K', '4K'], true) ? $value : '';
}

function mask_gallery_email(string $email): string
{
    $email = normalize_email($email);
    if ($email === '') {
        return '';
    }
    [$name, $domain] = array_pad(explode('@', $email, 2), 2, '');
    if ($domain === '') {
        return '';
    }
    $prefix = function_exists('mb_substr') ? mb_substr($name, 0, 2) : substr($name, 0, 2);
    return $prefix . '***@' . $domain;
}

function record_site_activity(PDO $pdo, array $config, string $visitorId, string $kind): void
{
    ensure_site_stats_tables($pdo);
    $visitorKey = $visitorId !== '' ? $visitorId : current_session_token();
    if ($visitorKey === '') {
        $visitorKey = client_ip() . '|' . ($_SERVER['HTTP_USER_AGENT'] ?? '');
    }
    $visitorHash = secret_hash($config, 'site-visitor', substr($visitorKey, 0, 300));
    $pdo->prepare(
        "INSERT INTO site_visitors (visitor_hash, first_seen_at, last_seen_at)
         VALUES (?, UTC_TIMESTAMP(), UTC_TIMESTAMP())
         ON DUPLICATE KEY UPDATE last_seen_at = UTC_TIMESTAMP()"
    )->execute([$visitorHash]);

    $today = beijing_date_expr();
    $pdo->prepare(
        "INSERT INTO site_daily_stats (stat_date, total_visits, peak_online, updated_at)
         VALUES ($today, ?, 0, UTC_TIMESTAMP())
         ON DUPLICATE KEY UPDATE
           total_visits = total_visits + VALUES(total_visits),
           updated_at = UTC_TIMESTAMP()"
    )->execute([$kind === 'visit' ? 1 : 0]);

    refresh_today_peak_online($pdo);
}

function site_stats_payload(PDO $pdo): array
{
    ensure_site_stats_tables($pdo);
    refresh_today_peak_online($pdo);
    $today = beijing_date_expr();
    $yesterday = "DATE_SUB($today, INTERVAL 1 DAY)";
    $onlineWindowSeconds = 180;

    $onlineStmt = $pdo->query(
        "SELECT COUNT(*) FROM site_visitors
         WHERE last_seen_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL $onlineWindowSeconds SECOND)"
    );
    $onlineCount = (int)$onlineStmt->fetchColumn();

    $peakStmt = $pdo->query(
        "SELECT
           COALESCE(MAX(CASE WHEN stat_date = $today THEN peak_online END), 0) AS today_peak,
           COALESCE(MAX(CASE WHEN stat_date = $yesterday THEN peak_online END), 0) AS yesterday_peak,
           COALESCE(MAX(CASE WHEN stat_date = $today THEN total_visits END), 0) AS today_visits,
           COALESCE(SUM(total_visits), 0) AS total_visits
         FROM site_daily_stats"
    );
    $peaks = $peakStmt->fetch() ?: [];

    $registeredUsers = (int)$pdo->query("SELECT COUNT(DISTINCT LOWER(TRIM(email))) FROM users WHERE TRIM(email) <> ''")->fetchColumn();
    $emailStatsStmt = $pdo->query(
        "SELECT
           LOWER(TRIM(u.email)) AS email,
           MIN(u.created_at) AS registered_at,
           COALESCE(SUM(CASE WHEN wl.type = 'redeem' AND wl.amount_cents > 0 THEN wl.amount_cents ELSE 0 END), 0) AS total_recharge_cents,
           COALESCE(SUM(CASE WHEN wl.type = 'charge' AND wl.amount_cents < 0 THEN -wl.amount_cents ELSE 0 END), 0) AS total_spent_cents
         FROM users u
         LEFT JOIN wallet_ledger wl ON wl.user_id = u.id
         WHERE TRIM(u.email) <> ''
         GROUP BY LOWER(TRIM(u.email))
         ORDER BY email ASC"
    );
    $registeredEmailStats = [];
    foreach ($emailStatsStmt->fetchAll() as $row) {
        $email = trim((string)($row['email'] ?? ''));
        if ($email === '') {
            continue;
        }
        $registeredEmailStats[] = [
            'email' => $email,
            'registeredAt' => utc_sql_timestamp_ms((string)($row['registered_at'] ?? '')),
            'totalRechargeCents' => (int)($row['total_recharge_cents'] ?? 0),
            'totalSpentCents' => (int)($row['total_spent_cents'] ?? 0),
        ];
    }
    $registeredEmails = array_map(static fn(array $item): string => (string)$item['email'], $registeredEmailStats);
    $totalRechargeCents = array_reduce($registeredEmailStats, static fn(int $sum, array $item): int => $sum + (int)$item['totalRechargeCents'], 0);
    $totalRevenueCents = array_reduce($registeredEmailStats, static fn(int $sum, array $item): int => $sum + (int)$item['totalSpentCents'], 0);
    $sessionVisitors = (int)$pdo->query("SELECT COUNT(DISTINCT user_id) FROM sessions")->fetchColumn();
    $totalVisitors = max((int)$pdo->query("SELECT COUNT(*) FROM site_visitors")->fetchColumn(), $sessionVisitors);
    $updatedAt = (int)round(microtime(true) * 1000);

    return [
        'onlineCount' => php_online_count($pdo, $onlineWindowSeconds, $onlineCount),
        'loggedInOnlineCount' => php_logged_in_online_count($pdo, $onlineWindowSeconds),
        'todayPeak' => max(php_online_count($pdo, $onlineWindowSeconds, $onlineCount), (int)($peaks['today_peak'] ?? 0)),
        'yesterdayPeak' => (int)($peaks['yesterday_peak'] ?? 0),
        'registeredUsers' => $registeredUsers,
        'registeredEmails' => $registeredEmails,
        'registeredEmailStats' => $registeredEmailStats,
        'totalRechargeCents' => $totalRechargeCents,
        'totalRevenueCents' => $totalRevenueCents,
        'totalVisits' => (int)($peaks['total_visits'] ?? 0),
        'todayVisits' => (int)($peaks['today_visits'] ?? 0),
        'totalVisitors' => $totalVisitors,
        'lastVisitAt' => $updatedAt,
        'updatedAt' => $updatedAt,
        'onlineWindowMs' => $onlineWindowSeconds * 1000,
    ];
}

function site_public_stats_payload(PDO $pdo): array
{
    ensure_site_stats_tables($pdo);
    refresh_today_peak_online($pdo);
    $today = beijing_date_expr();
    $yesterday = "DATE_SUB($today, INTERVAL 1 DAY)";
    $onlineWindowSeconds = 180;
    $onlineCount = (int)$pdo
        ->query("SELECT COUNT(*) FROM site_visitors WHERE last_seen_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL $onlineWindowSeconds SECOND)")
        ->fetchColumn();
    $peakStmt = $pdo->query(
        "SELECT
           COALESCE(MAX(CASE WHEN stat_date = $today THEN peak_online END), 0) AS today_peak,
           COALESCE(MAX(CASE WHEN stat_date = $yesterday THEN peak_online END), 0) AS yesterday_peak,
           COALESCE(MAX(CASE WHEN stat_date = $today THEN total_visits END), 0) AS today_visits,
           COALESCE(SUM(total_visits), 0) AS total_visits
         FROM site_daily_stats"
    );
    $peaks = $peakStmt->fetch() ?: [];
    $updatedAt = (int)round(microtime(true) * 1000);
    $sessionVisitors = (int)$pdo->query("SELECT COUNT(DISTINCT user_id) FROM sessions")->fetchColumn();
    return [
        'onlineCount' => php_online_count($pdo, $onlineWindowSeconds, $onlineCount),
        'loggedInOnlineCount' => php_logged_in_online_count($pdo, $onlineWindowSeconds),
        'todayPeak' => max(php_online_count($pdo, $onlineWindowSeconds, $onlineCount), (int)($peaks['today_peak'] ?? 0)),
        'yesterdayPeak' => (int)($peaks['yesterday_peak'] ?? 0),
        'totalVisits' => (int)($peaks['total_visits'] ?? 0),
        'todayVisits' => (int)($peaks['today_visits'] ?? 0),
        'totalVisitors' => max((int)$pdo->query("SELECT COUNT(*) FROM site_visitors")->fetchColumn(), $sessionVisitors),
        'lastVisitAt' => $updatedAt,
        'updatedAt' => $updatedAt,
        'onlineWindowMs' => $onlineWindowSeconds * 1000,
    ];
}

function php_online_count(PDO $pdo, int $onlineWindowSeconds, int $visitorOnlineCount = 0): int
{
    return max($visitorOnlineCount, php_logged_in_online_count($pdo, $onlineWindowSeconds));
}

function php_logged_in_online_count(PDO $pdo, int $onlineWindowSeconds): int
{
    return (int)$pdo
        ->query(
            "SELECT COUNT(DISTINCT user_id) FROM sessions
             WHERE revoked_at IS NULL
               AND expires_at > UTC_TIMESTAMP()
               AND last_seen_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL $onlineWindowSeconds SECOND)"
        )
        ->fetchColumn();
}

function refresh_today_peak_online(PDO $pdo): void
{
    ensure_site_stats_tables($pdo);
    $today = beijing_date_expr();
    $onlineCount = (int)$pdo
        ->query("SELECT COUNT(*) FROM site_visitors WHERE last_seen_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 180 SECOND)")
        ->fetchColumn();
    $pdo->prepare(
        "INSERT INTO site_daily_stats (stat_date, total_visits, peak_online, updated_at)
         VALUES ($today, 0, ?, UTC_TIMESTAMP())
         ON DUPLICATE KEY UPDATE
           peak_online = GREATEST(peak_online, VALUES(peak_online)),
           updated_at = UTC_TIMESTAMP()"
    )->execute([$onlineCount]);
}

function ensure_site_stats_tables(PDO $pdo): void
{
    static $done = false;
    if ($done) {
        return;
    }
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS site_visitors (
          visitor_hash CHAR(64) NOT NULL,
          first_seen_at DATETIME NOT NULL,
          last_seen_at DATETIME NOT NULL,
          PRIMARY KEY (visitor_hash),
          KEY idx_site_visitors_last_seen (last_seen_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS site_daily_stats (
          stat_date DATE NOT NULL,
          total_visits INT NOT NULL DEFAULT 0,
          peak_online INT NOT NULL DEFAULT 0,
          updated_at DATETIME NOT NULL,
          PRIMARY KEY (stat_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
    $done = true;
}

function beijing_date_expr(): string
{
    return "DATE(DATE_ADD(UTC_TIMESTAMP(), INTERVAL 8 HOUR))";
}

function ensure_usage_log_columns(PDO $pdo): bool
{
    static $done = null;
    if ($done !== null) {
        return $done;
    }
    $done = false;
    try {
        ensure_table_column($pdo, 'wallet_ledger', 'log_code', "VARCHAR(40) NOT NULL DEFAULT '' AFTER related_id");
        ensure_table_index($pdo, 'wallet_ledger', 'idx_wallet_ledger_log_code', '(log_code)');
        ensure_table_column($pdo, 'generation_requests', 'log_code', "VARCHAR(40) NOT NULL DEFAULT '' AFTER request_id");
        ensure_table_column($pdo, 'generation_requests', 'prompt', "VARCHAR(1000) NOT NULL DEFAULT '' AFTER model");
        ensure_table_column($pdo, 'generation_requests', 'size', "VARCHAR(40) NOT NULL DEFAULT '' AFTER prompt");
        ensure_table_column($pdo, 'generation_requests', 'ratio', "VARCHAR(40) NOT NULL DEFAULT '' AFTER size");
        ensure_table_column($pdo, 'generation_requests', 'batch_index', "INT NOT NULL DEFAULT 0 AFTER ratio");
        ensure_table_column($pdo, 'generation_requests', 'batch_total', "INT NOT NULL DEFAULT 0 AFTER batch_index");
        ensure_table_column($pdo, 'generation_requests', 'request_preview', "TEXT NULL AFTER batch_total");
        ensure_table_column($pdo, 'generation_requests', 'response_preview', "TEXT NULL AFTER request_preview");
        ensure_table_column($pdo, 'generation_requests', 'http_status', "INT NOT NULL DEFAULT 0 AFTER response_preview");
        ensure_table_column($pdo, 'generation_requests', 'content_type', "VARCHAR(120) NOT NULL DEFAULT '' AFTER http_status");
        ensure_table_column($pdo, 'generation_requests', 'request_variant', "VARCHAR(40) NOT NULL DEFAULT '' AFTER content_type");
        ensure_table_index($pdo, 'generation_requests', 'idx_generation_log_code', '(log_code)');
        $done = true;
    } catch (Throwable $error) {
        $done = false;
    }
    return $done;
}

function backfill_redeem_ledger_log_codes(PDO $pdo, int $userId): void
{
    try {
        $stmt = $pdo->prepare(
            "SELECT id FROM wallet_ledger
             WHERE user_id = ? AND type = 'redeem' AND log_code = ''
             ORDER BY id DESC
             LIMIT 100"
        );
        $stmt->execute([$userId]);
        $ids = array_map('intval', array_column($stmt->fetchAll(), 'id'));
        if (!count($ids)) {
            return;
        }
        $update = $pdo->prepare("UPDATE wallet_ledger SET log_code = ? WHERE id = ? AND log_code = ''");
        foreach ($ids as $id) {
            $update->execute([make_ledger_log_code(), $id]);
        }
    } catch (Throwable $error) {
        error_log('redeem ledger log code backfill failed: ' . $error->getMessage());
    }
}

function ensure_table_column(PDO $pdo, string $table, string $column, string $definition): void
{
    $stmt = $pdo->prepare(
        "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?"
    );
    $stmt->execute([$table, $column]);
    if ((int)$stmt->fetchColumn() > 0) {
        return;
    }
    $pdo->exec("ALTER TABLE `{$table}` ADD COLUMN `{$column}` {$definition}");
}

function ensure_table_index(PDO $pdo, string $table, string $index, string $columns): void
{
    $stmt = $pdo->prepare(
        "SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?"
    );
    $stmt->execute([$table, $index]);
    if ((int)$stmt->fetchColumn() > 0) {
        return;
    }
    $pdo->exec("ALTER TABLE `{$table}` ADD KEY `{$index}` {$columns}");
}

function usage_log_code(string $value): string
{
    $value = strtoupper(preg_replace('/[^A-Za-z0-9_-]+/', '', trim($value)) ?? '');
    return substr($value, 0, 40);
}

function usage_log_text(string $value, int $limit): string
{
    $value = trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]+/', '', $value) ?? '');
    if ($value === '') {
        return '';
    }
    if (function_exists('mb_substr')) {
        return mb_substr($value, 0, $limit);
    }
    return strlen($value) > $limit ? substr($value, 0, $limit) : $value;
}

function charge_ledger_note(string $mode, array $usageMeta): string
{
    $modeLabel = $mode === 'image' ? '图生图' : '文生图';
    $tier = charge_ledger_tier_label((string)($usageMeta['tier'] ?? ''), (string)($usageMeta['size'] ?? ''));
    $size = charge_ledger_size_label((string)($usageMeta['size'] ?? ''));
    $siteConfig = usage_log_text((string)($usageMeta['siteConfig'] ?? ''), 80);
    $parts = [$modeLabel . '成功扣费'];
    if ($tier !== '') {
        $parts[] = $tier;
    }
    if ($size !== '') {
        $parts[] = '尺寸 ' . $size;
    }
    if ($siteConfig !== '') {
        $parts[] = $siteConfig;
    }
    return implode('；', $parts);
}

function charge_ledger_tier_label(string $tier, string $size): string
{
    $tier = strtoupper(preg_replace('/[^0-9K]+/', '', trim($tier)) ?? '');
    if (in_array($tier, ['1K', '2K', '4K'], true)) {
        return $tier;
    }
    if (preg_match('/^(\d{2,5})x(\d{2,5})$/i', trim($size), $match)) {
        $max = max((int)$match[1], (int)$match[2]);
        if ($max >= 2800) {
            return '4K';
        }
        if ($max >= 1900) {
            return '2K';
        }
        return '1K';
    }
    return '';
}

function charge_ledger_size_label(string $size): string
{
    $size = usage_log_text($size, 40);
    if ($size === '' || strtolower($size) === 'auto') {
        return '自动';
    }
    return $size;
}

function generate_ticket(PDO $pdo, array $config): void
{
    $user = require_user($pdo, $config);
    $payload = read_json();
    $platform = platform_config($pdo, $config);
    $mode = (($payload['mode'] ?? 'text') === 'image') ? 'image' : 'text';
    $modelOption = select_platform_model_option($platform, (string)($payload['model'] ?? ''));
    $model = (string)$modelOption['name'];
    $count = max(1, min((int)$platform['max_count'], (int)($payload['count'] ?? 1)));
    $price = custom_api_model_price_cents($modelOption['priceCents'] ?? null, $model, (int)$platform['price_cents']);
    $total = $count * $price;
    if (!platform_is_configured($platform)) {
        throw new HttpError('站点 API 尚未配置', 503, 'platform_not_configured');
    }
    ensure_user_can_afford($pdo, (int)$user['id'], $total);
    $token = random_token(32);
    $ticket = sign_generation_ticket($config, [
        'uid' => (int)$user['id'],
        'mode' => $mode,
        'count' => $count,
        'price' => $price,
        'model' => $model,
        'tier' => usage_log_text((string)($payload['tier'] ?? ''), 16),
        'size' => usage_log_text((string)($payload['size'] ?? ''), 40),
        'siteConfig' => usage_log_text((string)($platform['display_name'] ?? '站点配置1'), 80),
        'exp' => time() + 600,
        'nonce' => random_token(12),
    ], $token);
    json_response([
        'ok' => true,
        'ticket' => $ticket,
        'directBaseUrl' => public_generation_api_base_url($config),
        'priceCents' => $price,
        'balanceCents' => current_balance($pdo, (int)$user['id']),
        'displayName' => (string)($platform['display_name'] ?? '站点配置1'),
    ]);
}

function generate_direct_config(PDO $pdo, array $config): void
{
    $user = require_user($pdo, $config);
    $payload = read_json();
    $platform = platform_config($pdo, $config);
    $mode = (($payload['mode'] ?? 'text') === 'image') ? 'image' : 'text';
    $modelOption = select_platform_model_option($platform, (string)($payload['model'] ?? ''));
    $model = (string)$modelOption['name'];
    $count = max(1, min((int)$platform['max_count'], (int)($payload['count'] ?? 1)));
    $price = custom_api_model_price_cents($modelOption['priceCents'] ?? null, $model, (int)$platform['price_cents']);
    $total = $count * $price;
    if (!platform_is_configured($platform)) {
        throw new HttpError('站点 API 尚未配置', 503, 'platform_not_configured');
    }
    ensure_user_can_afford($pdo, (int)$user['id'], $total);
    $endpoint = $mode === 'image' ? platform_image_endpoint($platform) : (string)$platform['text_endpoint'];
    if ($endpoint === '') {
        throw new HttpError('站点 API 尚未配置', 503, 'platform_not_configured');
    }
    $ticket = sign_generation_ticket($config, [
        'uid' => (int)$user['id'],
        'mode' => $mode,
        'count' => $count,
        'price' => $price,
        'model' => $model,
        'tier' => usage_log_text((string)($payload['tier'] ?? ''), 16),
        'size' => usage_log_text((string)($payload['size'] ?? ''), 40),
        'siteConfig' => usage_log_text((string)($platform['display_name'] ?? '站点配置1'), 80),
        'exp' => time() + 600,
        'nonce' => random_token(12),
    ], random_token(32));
    json_response([
        'ok' => true,
        'ticket' => $ticket,
        'priceCents' => $price,
        'balanceCents' => current_balance($pdo, (int)$user['id']),
        'displayName' => (string)($platform['display_name'] ?? '站点配置1'),
    ]);
}

function generate_platform(PDO $pdo, array $config): void
{
    $payload = read_json();
    $platform = platform_config($pdo, $config);
    $modelOption = select_platform_model_option($platform, (string)($payload['model'] ?? ''));
    $model = (string)$modelOption['name'];
    $ticket = verify_generation_ticket($config, (string)($payload['ticket'] ?? ''));
    if (!$ticket) {
        $user = require_user($pdo, $config);
        $ticket = [
            'uid' => (int)$user['id'],
            'mode' => (($payload['mode'] ?? 'text') === 'image') ? 'image' : 'text',
            'count' => max(1, min((int)$platform['max_count'], (int)($payload['count'] ?? 1))),
            'price' => custom_api_model_price_cents($modelOption['priceCents'] ?? null, $model, (int)$platform['price_cents']),
            'model' => $model,
            'tier' => usage_log_text((string)($payload['tier'] ?? ''), 16),
            'size' => usage_log_text((string)($payload['size'] ?? ''), 40),
            'siteConfig' => usage_log_text((string)($platform['display_name'] ?? '站点配置1'), 80),
        ];
    }
    $mode = (($ticket['mode'] ?? ($payload['mode'] ?? 'text')) === 'image') ? 'image' : 'text';
    $request = is_array($payload['request'] ?? null) ? $payload['request'] : [];
    $requestId = normalize_request_id((string)($payload['requestId'] ?? ''));
    $count = max(1, min((int)$ticket['count'], (int)$platform['max_count'], (int)($payload['count'] ?? 1)));
    $modelOption = select_platform_model_option($platform, (string)($ticket['model'] ?? $payload['model'] ?? ''));
    $model = (string)$modelOption['name'];
    $price = max(1, (int)($ticket['price'] ?? custom_api_model_price_cents($modelOption['priceCents'] ?? null, $model, (int)$platform['price_cents'])));
    ensure_user_can_afford($pdo, (int)$ticket['uid'], $count * $price);
    $request = enforce_platform_request_count($request, $count);
    $request = platform_request_with_model($request, $model);
    $endpoint = $mode === 'image' ? platform_image_endpoint($platform) : (string)$platform['text_endpoint'];
    if ($endpoint === '' || trim((string)$platform['api_key']) === '') {
        throw new HttpError('站点 API 尚未配置', 503, 'platform_not_configured');
    }

    try {
        $upstream = call_platform_upstream($config, $platform, $endpoint, $request);
        $bodyPayload = json_decode($upstream['body'], true);
        $images = upstream_response_images($upstream, is_array($bodyPayload) ? $bodyPayload : null);
        if ($upstream['status'] < 200 || $upstream['status'] >= 300) {
            throw new RuntimeException(platform_upstream_error_message($upstream, is_array($bodyPayload) ? $bodyPayload : null));
        }
        if (!count($images)) {
            throw new RuntimeException(platform_upstream_no_image_message($upstream, is_array($bodyPayload) ? $bodyPayload : null));
        }
        json_response([
            'ok' => true,
            'data' => $images,
            'settlementRequired' => true,
        ]);
    } catch (Throwable $error) {
        $message = $error->getMessage() ?: '生成失败，未扣费';
        try {
            record_generation_failure($pdo, (int)$ticket['uid'], $requestId, [
                'logCode' => (string)($payload['logCode'] ?? $payload['traceCode'] ?? ''),
                'mode' => $mode,
                'model' => $model,
                'prompt' => platform_request_prompt($request),
                'size' => usage_log_text((string)($payload['size'] ?? ($ticket['size'] ?? platform_request_size($request))), 40),
                'ratio' => '',
                'batchIndex' => 0,
                'batchTotal' => $count,
                'imageCount' => 0,
                'priceCents' => $price,
                'errorMessage' => $message,
                'requestPreview' => platform_backend_request_preview($platform, $endpoint, $request, $payload),
                'responsePreview' => $message,
                'httpStatus' => isset($upstream) ? max(0, (int)($upstream['status'] ?? 0)) : 0,
                'contentType' => isset($upstream) ? usage_log_text(upstream_content_type((string)($upstream['headers'] ?? '')), 120) : '',
                'requestVariant' => usage_log_text((string)($request['payloadVariant'] ?? $payload['requestVariant'] ?? ''), 40),
            ]);
        } catch (Throwable $logError) {
            error_log('generation failure log failed: ' . $logError->getMessage());
        }
        json_response([
            'ok' => false,
            'error' => [
                'message' => $message,
                'code' => 'platform_failed',
            ],
            'debug' => platform_generation_failure_debug($endpoint ?? '', $request ?? [], $upstream ?? null, $message, $mode ?? '', $model ?? ''),
        ], 502);
        return;
    }
}

function generate_platform_image_task_start(PDO $pdo, array $config): void
{
    $payload = read_json();
    $context = platform_generation_context($pdo, $config, $payload);
    if ((string)$context['mode'] !== 'image') {
        throw new HttpError('image task only supports image mode', 400, 'platform_image_task_mode');
    }
    if (!platform_image_task_has_reference($context['request'])) {
        throw new HttpError('image task requires reference image', 400, 'platform_image_task_no_reference');
    }
    if (!endpoint_uses_reference_image_json((string)$context['endpoint'], (string)$context['model'])) {
        throw new HttpError('current site api does not support image task json references', 409, 'platform_image_task_unsupported');
    }

    platform_image_task_cleanup(platform_image_task_dir());
    $taskId = platform_image_task_id();
    $taskToken = sign_generation_ticket($config, [
        'uid' => (int)$context['ticket']['uid'],
        'mode' => 'image',
        'count' => (int)$context['count'],
        'price' => (int)$context['price'],
        'model' => (string)$context['model'],
        'tier' => usage_log_text((string)($context['ticket']['tier'] ?? $payload['tier'] ?? ''), 16),
        'size' => usage_log_text((string)($context['ticket']['size'] ?? $payload['size'] ?? platform_request_size($context['request'])), 40),
        'siteConfig' => usage_log_text((string)($context['ticket']['siteConfig'] ?? $context['platform']['display_name'] ?? 'site api'), 80),
        'requestId' => (string)$context['requestId'],
        'taskId' => $taskId,
        'exp' => time() + 1800,
        'nonce' => random_token(12),
    ], random_token(32));

    platform_image_task_write($taskId, [
        'taskId' => $taskId,
        'status' => 'PENDING',
        'createdAt' => time(),
        'updatedAt' => time(),
        'payload' => $payload,
        'context' => platform_image_task_context_snapshot($context, $payload),
        'attempts' => 0,
    ]);

    platform_image_task_json_response([
        'ok' => true,
        'completed' => false,
        'taskId' => $taskId,
        'taskToken' => $taskToken,
        'status' => 'PENDING',
        'pollAfterMs' => 2500,
    ]);

    platform_image_task_after_response_run($pdo, $config, $taskId);
}

function generate_platform_image_task_poll(PDO $pdo, array $config): void
{
    $payload = read_json();
    $taskToken = verify_generation_ticket($config, (string)($payload['taskToken'] ?? ''));
    if (!$taskToken) {
        throw new HttpError('image task expired, please retry', 401, 'platform_image_task_expired');
    }
    if (($taskToken['mode'] ?? '') !== 'image') {
        throw new HttpError('invalid image task token', 400, 'platform_image_task_invalid');
    }
    $taskId = platform_image_task_clean_id((string)($payload['taskId'] ?? $taskToken['taskId'] ?? ''));
    if ($taskId === '' || $taskId !== platform_image_task_clean_id((string)($taskToken['taskId'] ?? ''))) {
        throw new HttpError('invalid image task id', 400, 'platform_image_task_invalid');
    }

    $task = platform_image_task_read($taskId);
    if (!$task) {
        throw new HttpError('image task not found or expired', 404, 'platform_image_task_not_found');
    }

    $status = (string)($task['status'] ?? 'PENDING');
    $taskAge = time() - (int)($task['createdAt'] ?? time());
    if ($status === 'PENDING') {
        platform_image_task_try_async_run($pdo, $config, $taskId);
        $task = platform_image_task_read($taskId) ?: $task;
        $status = (string)($task['status'] ?? $status);
    } elseif ($status === 'RUNNING' && $taskAge > 330) {
        platform_image_task_mark_failed($pdo, $config, $taskId, 'image task timed out before upstream response', null, null);
        $task = platform_image_task_read($taskId) ?: $task;
        $status = (string)($task['status'] ?? $status);
    }

    if ($status === 'SUCCEEDED') {
        json_response([
            'ok' => true,
            'completed' => true,
            'status' => 'SUCCESS',
            'taskId' => $taskId,
            'data' => is_array($task['images'] ?? null) ? $task['images'] : [],
            'settlementRequired' => true,
            'upstream' => platform_image_task_public_upstream($task),
        ]);
        return;
    }
    if ($status === 'FAILED') {
        json_response([
            'ok' => false,
            'completed' => true,
            'status' => 'FAILED',
            'taskId' => $taskId,
            'error' => [
                'message' => usage_log_text((string)($task['error'] ?? 'image task failed'), 800),
                'code' => 'platform_image_task_failed',
            ],
            'upstream' => platform_image_task_public_upstream($task),
        ], 502);
        return;
    }

    json_response([
        'ok' => true,
        'completed' => false,
        'status' => $status ?: 'PENDING',
        'upstreamStatus' => usage_log_text((string)($task['upstreamStatus'] ?? ''), 80),
        'progress' => usage_log_text((string)($task['progress'] ?? ''), 40),
        'phase' => usage_log_text((string)($task['phase'] ?? ''), 40),
        'upstreamTaskId' => usage_log_text((string)($task['upstreamTaskId'] ?? ''), 120),
        'taskId' => $taskId,
        'startedAt' => (int)($task['startedAt'] ?? 0),
        'updatedAt' => (int)($task['updatedAt'] ?? 0),
    ]);
}

function platform_image_task_after_response_run(PDO $pdo, array $config, string $taskId): void
{
    ignore_user_abort(true);
    @ini_set('max_execution_time', '360');
    @set_time_limit(360);
    if (function_exists('fastcgi_finish_request')) {
        fastcgi_finish_request();
        platform_image_task_run($pdo, $config, $taskId);
        return;
    }
    if (function_exists('session_write_close')) {
        session_write_close();
    }
    @ob_flush();
    @flush();
}

function platform_image_task_try_async_run(PDO $pdo, array $config, string $taskId): void
{
    $task = platform_image_task_read($taskId);
    if (!$task) {
        return;
    }
    if (time() - (int)($task['createdAt'] ?? time()) > 330) {
        platform_image_task_mark_failed($pdo, $config, $taskId, 'image task timed out before upstream response', null, null);
        return;
    }
    platform_image_task_run($pdo, $config, $taskId);
}

function platform_image_task_run(PDO $pdo, array $config, string $taskId): void
{
    ignore_user_abort(true);
    @ini_set('max_execution_time', '360');
    @set_time_limit(360);
    $lockPath = platform_image_task_path($taskId) . '.lock';
    $lock = @fopen($lockPath, 'c');
    if (!$lock) {
        platform_image_task_mark_failed($pdo, $config, $taskId, 'image task lock failed', null, null);
        return;
    }
    try {
        if (!flock($lock, LOCK_EX | LOCK_NB)) {
            return;
        }
        $task = platform_image_task_read($taskId);
        if (!$task || in_array((string)($task['status'] ?? ''), ['SUCCEEDED', 'FAILED'], true)) {
            return;
        }
        $task['status'] = 'RUNNING';
        $task['startedAt'] = (int)($task['startedAt'] ?? time()) ?: time();
        $task['updatedAt'] = time();
        $task['attempts'] = max(1, (int)($task['attempts'] ?? 0) + 1);
        platform_image_task_write($taskId, $task);

        $payload = is_array($task['payload'] ?? null) ? $task['payload'] : [];
        $context = platform_generation_context($pdo, $config, $payload);
        if ((string)$context['mode'] !== 'image') {
            throw new RuntimeException('image task payload mode changed');
        }
        $endpoint = (string)$context['endpoint'];
        $request = $context['request'];
        if (!endpoint_uses_reference_image_json($endpoint, (string)$context['model'])) {
            throw new RuntimeException('current site api does not support image task json references');
        }

        $upstream = platform_image_task_call_upstream($config, $context['platform'], $endpoint, $request, $taskId);
        $bodyPayload = json_decode((string)($upstream['body'] ?? ''), true);
        $decoded = is_array($bodyPayload) ? $bodyPayload : null;
        $images = upstream_response_images($upstream, $decoded);
        if ((int)($upstream['status'] ?? 0) < 200 || (int)($upstream['status'] ?? 0) >= 300) {
            throw new RuntimeException(platform_upstream_error_message($upstream, $decoded));
        }
        if (!count($images)) {
            throw new RuntimeException(platform_upstream_no_image_message($upstream, $decoded));
        }

        $task['status'] = 'SUCCEEDED';
        $task['completedAt'] = time();
        $task['updatedAt'] = time();
        $task['images'] = $images;
        $task['upstream'] = [
            'status' => (int)($upstream['status'] ?? 0),
            'contentType' => usage_log_text(upstream_content_type((string)($upstream['headers'] ?? '')), 120),
            'bodyPreview' => platform_body_preview((string)($upstream['body'] ?? '')),
        ];
        unset($task['payload']);
        platform_image_task_write($taskId, $task);
    } catch (Throwable $error) {
        platform_image_task_mark_failed($pdo, $config, $taskId, $error->getMessage() ?: 'image task failed', $upstream ?? null, $context ?? null);
    } finally {
        if (is_resource($lock)) {
            @flock($lock, LOCK_UN);
            @fclose($lock);
        }
    }
}

function platform_image_task_call_upstream(array $config, array $platform, string $endpoint, array $request, string $taskId): array
{
    if (platform_supports_async_generation($endpoint)) {
        return platform_image_task_call_async_upstream($config, $platform, $endpoint, $request, $taskId);
    }
    return call_platform_upstream($config, $platform, $endpoint, $request);
}

function platform_image_task_call_async_upstream(array $config, array $platform, string $endpoint, array $request, string $taskId): array
{
    [$jsonEndpoint, $jsonRequest] = platform_json_generation_request_with_base($config, $platform, $endpoint, $request, request_public_origin_url());
    $startEndpoint = platform_async_start_endpoint($jsonEndpoint);
    $startUpstream = call_upstream_request($startEndpoint, $jsonRequest, [
        'Authorization' => 'Bearer ' . (string)$platform['api_key'],
    ]);
    $startPayload = json_decode((string)($startUpstream['body'] ?? ''), true);
    $startDecoded = is_array($startPayload) ? $startPayload : null;
    $startImages = upstream_response_images($startUpstream, $startDecoded);
    platform_image_task_update_progress($taskId, [
        'phase' => 'ASYNC_START',
        'upstreamStatus' => platform_async_status($startDecoded ?? []) ?: 'PENDING',
        'progress' => platform_async_progress($startDecoded ?? []),
        'upstream' => [
            'status' => (int)($startUpstream['status'] ?? 0),
            'contentType' => usage_log_text(upstream_content_type((string)($startUpstream['headers'] ?? '')), 120),
            'bodyPreview' => platform_body_preview((string)($startUpstream['body'] ?? '')),
        ],
    ]);
    if (count($startImages)) {
        return $startUpstream;
    }

    $upstreamTaskId = platform_async_task_id($startDecoded ?? []);
    if (((int)($startUpstream['status'] ?? 0) < 200 || (int)($startUpstream['status'] ?? 0) >= 300) && $upstreamTaskId === '') {
        throw new RuntimeException(platform_upstream_error_message($startUpstream, $startDecoded));
    }
    if ($upstreamTaskId === '') {
        throw new RuntimeException(platform_upstream_no_image_message($startUpstream, $startDecoded));
    }

    platform_image_task_update_progress($taskId, [
        'phase' => 'ASYNC_POLL',
        'upstreamTaskId' => $upstreamTaskId,
        'upstreamStatus' => platform_async_status($startDecoded ?? []) ?: 'PENDING',
        'progress' => platform_async_progress($startDecoded ?? []),
    ]);

    $queryEndpoint = platform_async_query_endpoint($jsonEndpoint, $upstreamTaskId);
    $startedAt = time();
    $pollCount = 0;
    $lastUpstream = $startUpstream;
    while (time() - $startedAt < 330) {
        sleep($pollCount === 0 ? 2 : 3);
        $pollCount++;
        try {
            $pollUpstream = call_upstream_request($queryEndpoint, [
                'method' => 'GET',
                'headers' => [],
                'bodyType' => 'json',
                'body' => '',
            ], [
                'Authorization' => 'Bearer ' . (string)$platform['api_key'],
            ]);
            $lastUpstream = $pollUpstream;
        } catch (Throwable $error) {
            if (!platform_async_poll_error_is_retryable($error->getMessage(), 0)) {
                throw $error;
            }
            platform_image_task_update_progress($taskId, [
                'phase' => 'ASYNC_POLL',
                'upstreamTaskId' => $upstreamTaskId,
                'upstreamStatus' => 'PENDING',
                'progress' => '',
                'pollCount' => $pollCount,
                'upstream' => [
                    'status' => 0,
                    'contentType' => '',
                    'bodyPreview' => usage_log_text($error->getMessage(), 1200),
                ],
            ]);
            continue;
        }

        $pollPayload = json_decode((string)($pollUpstream['body'] ?? ''), true);
        $pollDecoded = is_array($pollPayload) ? $pollPayload : null;
        $pollImages = upstream_response_images($pollUpstream, $pollDecoded);
        platform_image_task_update_progress($taskId, [
            'phase' => 'ASYNC_POLL',
            'upstreamTaskId' => $upstreamTaskId,
            'upstreamStatus' => platform_async_status($pollDecoded ?? []) ?: 'PENDING',
            'progress' => platform_async_progress($pollDecoded ?? []),
            'pollCount' => $pollCount,
            'upstream' => [
                'status' => (int)($pollUpstream['status'] ?? 0),
                'contentType' => usage_log_text(upstream_content_type((string)($pollUpstream['headers'] ?? '')), 120),
                'bodyPreview' => platform_body_preview((string)($pollUpstream['body'] ?? '')),
            ],
        ]);
        if (count($pollImages)) {
            return $pollUpstream;
        }

        $pollStatus = (int)($pollUpstream['status'] ?? 0);
        if ($pollStatus < 200 || $pollStatus >= 300) {
            $message = platform_upstream_error_message($pollUpstream, $pollDecoded);
            if (platform_async_is_pending_timeout($pollDecoded) || platform_async_poll_error_is_retryable($message, $pollStatus)) {
                continue;
            }
            throw new RuntimeException($message);
        }
        if (platform_async_is_failed($pollDecoded ?? [])) {
            throw new RuntimeException(platform_async_failure_message($pollDecoded ?? []) ?: platform_upstream_no_image_message($pollUpstream, $pollDecoded));
        }
    }
    throw new RuntimeException('async image task poll timeout without any image: ' . platform_body_preview((string)($lastUpstream['body'] ?? '')));
}

function platform_image_task_update_progress(string $taskId, array $fields): void
{
    try {
        $task = platform_image_task_read($taskId);
        if (!$task || in_array((string)($task['status'] ?? ''), ['SUCCEEDED', 'FAILED'], true)) {
            return;
        }
        foreach ($fields as $key => $value) {
            $task[$key] = $value;
        }
        $task['updatedAt'] = time();
        platform_image_task_write($taskId, $task);
    } catch (Throwable $error) {
        error_log('platform image task progress update failed: ' . $error->getMessage());
    }
}

function platform_image_task_mark_failed(PDO $pdo, array $config, string $taskId, string $message, ?array $upstream, ?array $context): void
{
    $task = platform_image_task_read($taskId) ?: ['taskId' => $taskId, 'createdAt' => time()];
    $payload = is_array($task['payload'] ?? null) ? $task['payload'] : [];
    if (!$context) {
        try {
            $context = $payload ? platform_generation_context($pdo, $config, $payload) : null;
        } catch (Throwable $ignored) {
            $context = null;
        }
    }
    $task['status'] = 'FAILED';
    $task['error'] = usage_log_text($message, 1000);
    $task['completedAt'] = time();
    $task['updatedAt'] = time();
    if (!$upstream && is_array($task['upstream'] ?? null)) {
        $upstream = [
            'status' => (int)($task['upstream']['status'] ?? 0),
            'headers' => 'Content-Type: ' . (string)($task['upstream']['contentType'] ?? ''),
            'body' => (string)($task['upstream']['bodyPreview'] ?? ''),
        ];
    }
    if ($upstream) {
        $task['upstream'] = [
            'status' => (int)($upstream['status'] ?? 0),
            'contentType' => usage_log_text(upstream_content_type((string)($upstream['headers'] ?? '')), 120),
            'bodyPreview' => platform_body_preview((string)($upstream['body'] ?? '')),
        ];
    }
    unset($task['payload']);
    platform_image_task_write($taskId, $task);

    if (!$context) {
        return;
    }
    try {
        record_generation_failure($pdo, (int)$context['ticket']['uid'], (string)$context['requestId'], [
            'logCode' => (string)($payload['logCode'] ?? $payload['traceCode'] ?? ''),
            'mode' => 'image',
            'model' => (string)$context['model'],
            'prompt' => platform_request_prompt($context['request']),
            'size' => usage_log_text((string)($payload['size'] ?? ($context['ticket']['size'] ?? platform_request_size($context['request']))), 40),
            'ratio' => '',
            'batchIndex' => max(0, (int)($payload['batchIndex'] ?? 0)),
            'batchTotal' => (int)($context['count'] ?? 1),
            'imageCount' => 0,
            'priceCents' => 0,
            'errorMessage' => $message,
            'requestPreview' => platform_backend_request_preview($context['platform'], (string)$context['endpoint'], $context['request'], $payload),
            'responsePreview' => $upstream ? platform_log_json([
                'taskId' => $taskId,
                'status' => (int)($upstream['status'] ?? 0),
                'contentType' => upstream_content_type((string)($upstream['headers'] ?? '')),
                'body' => platform_body_preview((string)($upstream['body'] ?? '')),
                'message' => $message,
            ]) : platform_log_json(['taskId' => $taskId, 'message' => $message]),
            'httpStatus' => $upstream ? max(0, (int)($upstream['status'] ?? 0)) : 0,
            'contentType' => $upstream ? usage_log_text(upstream_content_type((string)($upstream['headers'] ?? '')), 120) : '',
            'requestVariant' => usage_log_text((string)($context['request']['payloadVariant'] ?? $payload['requestVariant'] ?? 'image-task'), 40),
        ]);
    } catch (Throwable $logError) {
        error_log('platform image task failure log failed: ' . $logError->getMessage());
    }
}

function platform_image_task_has_reference(array $request): bool
{
    if (($request['bodyType'] ?? '') === 'multipart') {
        return count(is_array($request['files'] ?? null) ? $request['files'] : []) > 0;
    }
    $body = json_decode((string)($request['body'] ?? ''), true);
    return is_array($body) && count(is_array($body['reference_images'] ?? null) ? $body['reference_images'] : []) > 0;
}

function platform_image_task_context_snapshot(array $context, array $payload): array
{
    return [
        'mode' => (string)$context['mode'],
        'requestId' => (string)$context['requestId'],
        'count' => (int)$context['count'],
        'model' => (string)$context['model'],
        'price' => (int)$context['price'],
        'endpointKind' => endpoint_is_hfsy_api((string)$context['endpoint']) ? 'hfsy' : 'custom',
        'requestBodyType' => (string)($context['request']['bodyType'] ?? ''),
        'payloadBytes' => strlen(json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: ''),
        'referenceCount' => count(is_array($context['request']['files'] ?? null) ? $context['request']['files'] : []),
    ];
}

function platform_image_task_public_upstream(array $task): array
{
    $upstream = is_array($task['upstream'] ?? null) ? $task['upstream'] : [];
    return [
        'status' => (int)($upstream['status'] ?? 0),
        'contentType' => (string)($upstream['contentType'] ?? ''),
        'bodyPreview' => usage_log_text((string)($upstream['bodyPreview'] ?? ''), 1200),
    ];
}

function platform_image_task_json_response(array $payload, int $status = 200): void
{
    discard_accidental_output();
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

function platform_image_task_dir(): string
{
    return rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'api2img_platform_image_tasks';
}

function platform_image_task_id(): string
{
    return 'pit_' . bin2hex(random_bytes(12));
}

function platform_image_task_clean_id(string $taskId): string
{
    return substr(preg_replace('/[^A-Za-z0-9_-]+/', '', trim($taskId)) ?? '', 0, 80);
}

function platform_image_task_path(string $taskId): string
{
    $taskId = platform_image_task_clean_id($taskId);
    return platform_image_task_dir() . DIRECTORY_SEPARATOR . $taskId . '.json';
}

function platform_image_task_read(string $taskId): ?array
{
    $path = platform_image_task_path($taskId);
    if ($taskId === '' || !is_file($path)) {
        return null;
    }
    $raw = file_get_contents($path);
    if ($raw === false || $raw === '') {
        return null;
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : null;
}

function platform_image_task_write(string $taskId, array $task): void
{
    $dir = platform_image_task_dir();
    if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
        throw new RuntimeException('image task directory is not writable');
    }
    $path = platform_image_task_path($taskId);
    $temp = $path . '.' . bin2hex(random_bytes(4)) . '.tmp';
    $json = json_encode($task, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false || file_put_contents($temp, $json, LOCK_EX) === false || !rename($temp, $path)) {
        @unlink($temp);
        throw new RuntimeException('image task write failed');
    }
}

function platform_image_task_cleanup(string $dir): void
{
    if (!is_dir($dir)) {
        return;
    }
    foreach (glob($dir . DIRECTORY_SEPARATOR . 'pit_*.{json,lock}', GLOB_BRACE) ?: [] as $path) {
        if (is_file($path) && time() - (int)filemtime($path) > 86400) {
            @unlink($path);
        }
    }
}

function generate_platform_async_start(PDO $pdo, array $config): void
{
    $payload = read_json();
    $context = platform_generation_context($pdo, $config, $payload);
    if (!platform_supports_async_generation((string)$context['endpoint'])) {
        throw new HttpError('当前站点 API 不支持异步生图', 409, 'platform_async_unsupported');
    }

    [$endpoint, $request] = platform_async_start_request(
        $config,
        $context['platform'],
        (string)$context['endpoint'],
        $context['request']
    );

    $upstream = call_upstream_request($endpoint, $request, [
        'Authorization' => 'Bearer ' . (string)$context['platform']['api_key'],
    ]);
    $bodyPayload = json_decode($upstream['body'], true);
    $decoded = is_array($bodyPayload) ? $bodyPayload : null;

    $images = upstream_response_images($upstream, $decoded);
    if (count($images)) {
        json_response([
            'ok' => true,
            'completed' => true,
            'status' => 'SUCCESS',
            'data' => $images,
            'settlementRequired' => true,
        ]);
        return;
    }

    $taskId = platform_async_task_id($decoded ?? []);
    if (($upstream['status'] < 200 || $upstream['status'] >= 300) && $taskId === '') {
        throw new HttpError(platform_upstream_error_message($upstream, $decoded), 502, 'platform_failed');
    }
    if ($taskId === '') {
        throw new HttpError(platform_upstream_no_image_message($upstream, $decoded), 502, 'platform_failed');
    }

    $taskToken = sign_generation_ticket($config, [
        'uid' => (int)$context['ticket']['uid'],
        'mode' => (string)$context['mode'],
        'count' => (int)$context['count'],
        'price' => (int)$context['price'],
        'model' => (string)$context['model'],
        'tier' => usage_log_text((string)($context['ticket']['tier'] ?? $payload['tier'] ?? ''), 16),
        'size' => usage_log_text((string)($context['ticket']['size'] ?? $payload['size'] ?? platform_request_size($context['request'])), 40),
        'siteConfig' => usage_log_text((string)($context['ticket']['siteConfig'] ?? $context['platform']['display_name'] ?? '站点配置1'), 80),
        'requestId' => (string)$context['requestId'],
        'taskId' => $taskId,
        'exp' => time() + 900,
        'nonce' => random_token(12),
    ], random_token(32));

    json_response([
        'ok' => true,
        'completed' => false,
        'taskId' => $taskId,
        'taskToken' => $taskToken,
        'status' => platform_async_status($decoded ?? []),
        'progress' => platform_async_progress($decoded ?? []),
    ]);
}

function generate_platform_async_poll(PDO $pdo, array $config): void
{
    $payload = read_json();
    $taskToken = verify_generation_ticket($config, (string)($payload['taskToken'] ?? ''));
    if (!$taskToken) {
        throw new HttpError('异步任务已过期，请重新生成', 401, 'platform_async_expired');
    }
    $taskId = platform_async_clean_task_id((string)($payload['taskId'] ?? $taskToken['taskId'] ?? ''));
    if ($taskId === '' || $taskId !== platform_async_clean_task_id((string)($taskToken['taskId'] ?? ''))) {
        throw new HttpError('异步任务参数无效', 400, 'platform_async_invalid_task');
    }

    $platform = platform_config($pdo, $config);
    $modelOption = select_platform_model_option($platform, (string)($taskToken['model'] ?? ''));
    $model = (string)$modelOption['name'];
    $mode = (($taskToken['mode'] ?? 'text') === 'image') ? 'image' : 'text';
    $endpoint = $mode === 'image' ? platform_image_endpoint($platform) : (string)$platform['text_endpoint'];
    if (!platform_supports_async_generation($endpoint) || trim((string)$platform['api_key']) === '') {
        throw new HttpError('当前站点 API 不支持异步生图', 409, 'platform_async_unsupported');
    }

    $queryEndpoint = platform_async_query_endpoint($endpoint, $taskId);
    try {
        $upstream = call_upstream_request($queryEndpoint, [
            'method' => 'GET',
            'headers' => [],
            'bodyType' => 'json',
            'body' => '',
        ], [
            'Authorization' => 'Bearer ' . (string)$platform['api_key'],
        ]);
    } catch (Throwable $error) {
        if (platform_async_poll_error_is_retryable($error->getMessage(), 0)) {
            json_response([
                'ok' => true,
                'completed' => false,
                'status' => 'PENDING',
                'progress' => '',
                'taskId' => $taskId,
                'message' => usage_log_text($error->getMessage() ?: 'upstream poll interrupted', 500),
            ]);
            return;
        }
        throw $error;
    }
    $bodyPayload = json_decode($upstream['body'], true);
    $decoded = is_array($bodyPayload) ? $bodyPayload : null;
    if ($upstream['status'] < 200 || $upstream['status'] >= 300) {
        $message = platform_upstream_error_message($upstream, $decoded);
        if (platform_async_is_pending_timeout($decoded) || platform_async_poll_error_is_retryable($message, (int)$upstream['status'])) {
            json_response([
                'ok' => true,
                'completed' => false,
                'status' => platform_async_status($decoded ?? []) ?: 'PENDING',
                'progress' => platform_async_progress($decoded ?? []),
                'taskId' => $taskId,
                'message' => platform_async_failure_message($decoded ?? []) ?: usage_log_text($message ?: 'upstream poll pending', 500),
            ]);
            return;
        }
        throw new HttpError($message, 502, 'platform_failed');
    }

    $images = upstream_response_images($upstream, $decoded);
    if (count($images)) {
        json_response([
            'ok' => true,
            'completed' => true,
            'status' => 'SUCCESS',
            'data' => $images,
            'settlementRequired' => true,
            'taskId' => $taskId,
            'progress' => platform_async_progress($decoded ?? []),
        ]);
        return;
    }

    if (platform_async_is_failed($decoded ?? [])) {
        $message = platform_async_failure_message($decoded ?? []) ?: platform_upstream_no_image_message($upstream, $decoded);
        try {
            record_generation_failure($pdo, (int)$taskToken['uid'], (string)($taskToken['requestId'] ?? ''), [
                'logCode' => (string)($payload['logCode'] ?? $payload['traceCode'] ?? ''),
                'mode' => $mode,
                'model' => $model,
                'prompt' => '',
                'size' => usage_log_text((string)($taskToken['size'] ?? ''), 40),
                'ratio' => '',
                'batchIndex' => 0,
                'batchTotal' => (int)($taskToken['count'] ?? 1),
                'imageCount' => 0,
                'priceCents' => (int)($taskToken['price'] ?? 0),
                'errorMessage' => $message,
                'requestPreview' => '异步任务查询: ' . platform_log_json(['taskId' => $taskId, 'endpoint' => '[站点 API 地址已隐藏]']),
                'responsePreview' => platform_log_json($decoded ?? platform_body_preview((string)($upstream['body'] ?? ''))),
                'httpStatus' => (int)($upstream['status'] ?? 0),
                'contentType' => usage_log_text(upstream_content_type((string)($upstream['headers'] ?? '')), 120),
                'requestVariant' => 'async-poll',
            ]);
        } catch (Throwable $logError) {
            error_log('generation async failure log failed: ' . $logError->getMessage());
        }
        throw new HttpError($message, 502, 'platform_failed');
    }

    json_response([
        'ok' => true,
        'completed' => false,
        'status' => platform_async_status($decoded ?? []),
        'progress' => platform_async_progress($decoded ?? []),
        'taskId' => $taskId,
    ]);
}

function platform_generation_context(PDO $pdo, array $config, array $payload): array
{
    $platform = platform_config($pdo, $config);
    $modelOption = select_platform_model_option($platform, (string)($payload['model'] ?? ''));
    $model = (string)$modelOption['name'];
    $ticket = verify_generation_ticket($config, (string)($payload['ticket'] ?? ''));
    if (!$ticket) {
        $user = require_user($pdo, $config);
        $ticket = [
            'uid' => (int)$user['id'],
            'mode' => (($payload['mode'] ?? 'text') === 'image') ? 'image' : 'text',
            'count' => max(1, min((int)$platform['max_count'], (int)($payload['count'] ?? 1))),
            'price' => custom_api_model_price_cents($modelOption['priceCents'] ?? null, $model, (int)$platform['price_cents']),
            'model' => $model,
            'tier' => usage_log_text((string)($payload['tier'] ?? ''), 16),
            'size' => usage_log_text((string)($payload['size'] ?? ''), 40),
            'siteConfig' => usage_log_text((string)($platform['display_name'] ?? '站点配置1'), 80),
        ];
    }
    $mode = (($ticket['mode'] ?? ($payload['mode'] ?? 'text')) === 'image') ? 'image' : 'text';
    $request = is_array($payload['request'] ?? null) ? $payload['request'] : [];
    $requestId = normalize_request_id((string)($payload['requestId'] ?? ''));
    $count = max(1, min((int)$ticket['count'], (int)$platform['max_count'], (int)($payload['count'] ?? 1)));
    $modelOption = select_platform_model_option($platform, (string)($ticket['model'] ?? $payload['model'] ?? ''));
    $model = (string)$modelOption['name'];
    $price = max(1, (int)($ticket['price'] ?? custom_api_model_price_cents($modelOption['priceCents'] ?? null, $model, (int)$platform['price_cents'])));
    ensure_user_can_afford($pdo, (int)$ticket['uid'], $count * $price);
    $request = enforce_platform_request_count($request, $count);
    $request = platform_request_with_model($request, $model);
    $endpoint = $mode === 'image' ? platform_image_endpoint($platform) : (string)$platform['text_endpoint'];
    if ($endpoint === '' || trim((string)$platform['api_key']) === '') {
        throw new HttpError('站点 API 尚未配置', 503, 'platform_not_configured');
    }
    return compact('platform', 'ticket', 'mode', 'request', 'requestId', 'count', 'model', 'price', 'endpoint');
}

function platform_supports_async_generation(string $endpoint): bool
{
    return endpoint_is_hfsy_api($endpoint)
        && preg_match('#/v\d+/images/generations/?(\?.*)?$#i', (string)parse_url($endpoint, PHP_URL_PATH)) === 1;
}

function platform_async_start_request(array $config, array $platform, string $endpoint, array $request): array
{
    [$jsonEndpoint, $jsonRequest] = platform_json_generation_request($config, $platform, $endpoint, $request);
    return [platform_async_start_endpoint($jsonEndpoint), $jsonRequest];
}

function platform_json_generation_request(array $config, array $platform, string $endpoint, array $request): array
{
    return platform_json_generation_request_with_base($config, $platform, $endpoint, $request, '');
}

function platform_json_generation_request_with_base(array $config, array $platform, string $endpoint, array $request, string $baseOverride = ''): array
{
    $model = platform_request_model($request, $platform);
    if (endpoint_uses_reference_image_json($endpoint, $model) && ($request['bodyType'] ?? '') === 'multipart') {
        [$endpoint, $request] = platform_reference_json_request($config, $endpoint, $request, $baseOverride);
    }
    if (($request['bodyType'] ?? '') === 'multipart') {
        throw new RuntimeException('当前站点 API 异步生图只支持 JSON 请求');
    }
    $body = json_decode((string)($request['body'] ?? ''), true);
    if (!is_array($body)) {
        throw new RuntimeException('站点 API 请求体不是有效 JSON');
    }
    if (!isset($body['size']) || trim((string)$body['size']) === '' || trim((string)$body['size']) === 'auto') {
        $body['size'] = '1024x1024';
    }
    if (!isset($body['response_format']) || trim((string)$body['response_format']) === '') {
        $body['response_format'] = 'b64_json';
    }
    $request['method'] = 'POST';
    $request['headers'] = ['Content-Type' => 'application/json'];
    $request['bodyType'] = 'json';
    $request['body'] = json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    return [$endpoint, $request];
}

function platform_async_start_endpoint(string $endpoint): string
{
    return preg_replace('#/v(\d+)/images/generations/?(\?.*)?$#i', '/v$1/images/generations/async$2', $endpoint) ?: $endpoint;
}

function platform_async_query_endpoint(string $endpoint, string $taskId): string
{
    $taskId = rawurlencode(platform_async_clean_task_id($taskId));
    return preg_replace('#/v(\d+)/images/generations/?(\?.*)?$#i', '/v$1/images/generations/' . $taskId . '$2', $endpoint) ?: $endpoint;
}

function platform_async_clean_task_id(string $taskId): string
{
    return substr(preg_replace('/[^A-Za-z0-9._:-]+/', '', trim($taskId)) ?? '', 0, 120);
}

function platform_async_task_id(array $payload): string
{
    foreach (['task_id', 'taskId'] as $key) {
        if (isset($payload[$key]) && is_scalar($payload[$key])) {
            $value = platform_async_clean_task_id((string)$payload[$key]);
            if ($value !== '') {
                return $value;
            }
        }
    }
    foreach (['data', 'result'] as $key) {
        if (isset($payload[$key]) && is_array($payload[$key])) {
            $value = platform_async_task_id($payload[$key]);
            if ($value !== '') {
                return $value;
            }
        }
    }
    foreach (['id'] as $key) {
        if (isset($payload[$key]) && is_scalar($payload[$key])) {
            $value = platform_async_clean_task_id((string)$payload[$key]);
            if ($value !== '' && !ctype_digit($value)) {
                return $value;
            }
        }
    }
    return '';
}

function platform_async_status(array $payload): string
{
    foreach (['status', 'state', 'task_status'] as $key) {
        if (isset($payload[$key]) && is_scalar($payload[$key])) {
            return usage_log_text((string)$payload[$key], 80);
        }
    }
    foreach (['data', 'result'] as $key) {
        if (isset($payload[$key]) && is_array($payload[$key])) {
            $value = platform_async_status($payload[$key]);
            if ($value !== '') {
                return $value;
            }
        }
    }
    return '';
}

function platform_async_progress(array $payload): string
{
    foreach (['progress', 'percentage'] as $key) {
        if (isset($payload[$key]) && is_scalar($payload[$key])) {
            return usage_log_text((string)$payload[$key], 40);
        }
    }
    foreach (['data', 'result'] as $key) {
        if (isset($payload[$key]) && is_array($payload[$key])) {
            $value = platform_async_progress($payload[$key]);
            if ($value !== '') {
                return $value;
            }
        }
    }
    return '';
}

function platform_async_is_failed(array $payload): bool
{
    if (platform_async_is_pending_timeout($payload)) {
        return false;
    }
    $status = strtolower(platform_async_status($payload));
    if (preg_match('/fail|failed|error|cancel|reject/', $status)) {
        return true;
    }
    $reason = platform_async_failure_message($payload);
    return $reason !== '' && !preg_match('/success|running|pending|processing|queue|100%/i', $status);
}

function platform_async_is_pending_timeout(?array $payload): bool
{
    if (!$payload) {
        return false;
    }
    $text = strtolower(json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: '');
    if ($text === '') {
        return false;
    }
    return strpos($text, 'poll_timeout') !== false
        || strpos($text, 'poll timeout') !== false
        || strpos($text, 'timeout without any image') !== false
        || strpos($text, 'without any image') !== false;
}

function platform_async_poll_error_is_retryable(string $message, int $status = 0): bool
{
    $text = strtolower($message);
    if (preg_match('/invalid[_ -]?(task|request|api|key|token)|unauthori[sz]ed|forbidden|permission|not found|model_not_found|insufficient|balance|quota|rate limit/', $text)) {
        return false;
    }
    if (in_array($status, [408, 409, 425, 429, 500, 502, 503, 504, 520, 522, 524], true)) {
        return true;
    }
    return preg_match('/poll_timeout|poll timeout|timeout without any image|without any image|timeout|timed out|upstream|gateway|bad gateway|service unavailable|connection|reset|closed|interrupted|incomplete|stream|socket|curl|empty reply|transfer closed|received from peer|rst_stream/', $text) === 1;
}

function platform_async_failure_message(array $payload): string
{
    foreach (['fail_reason', 'error', 'message', 'detail'] as $key) {
        if (!isset($payload[$key])) {
            continue;
        }
        $value = $payload[$key];
        if (is_array($value)) {
            $nested = platform_json_error_message($value);
            if ($nested !== '') {
                return usage_log_text($nested, 500);
            }
            continue;
        }
        if (is_scalar($value) && trim((string)$value) !== '') {
            return usage_log_text((string)$value, 500);
        }
    }
    foreach (['data', 'result'] as $key) {
        if (isset($payload[$key]) && is_array($payload[$key])) {
            $value = platform_async_failure_message($payload[$key]);
            if ($value !== '') {
                return $value;
            }
        }
    }
    return '';
}

function platform_backend_request_preview(array $platform, string $endpoint, array $request, array $payload = []): string
{
    $requestSummary = [
        'method' => (string)($request['method'] ?? 'POST'),
        'endpoint' => $endpoint !== '' ? '[站点 API 地址已隐藏]' : '',
        'bodyType' => (string)($request['bodyType'] ?? 'json'),
    ];
    if (($request['bodyType'] ?? '') === 'multipart') {
        $requestSummary['payloadVariant'] = (string)($request['payloadVariant'] ?? '');
        $requestSummary['fileFieldMode'] = (string)($request['fileFieldMode'] ?? '');
        $requestSummary['fields'] = platform_log_sanitize($request['fields'] ?? []);
        $requestSummary['files'] = array_map(static function ($file): array {
            $item = is_array($file) ? $file : [];
            return [
                'field' => (string)($item['field'] ?? ''),
                'filename' => (string)($item['filename'] ?? ''),
                'dataUrl' => platform_log_image_summary((string)($item['dataUrl'] ?? '')),
            ];
        }, is_array($request['files'] ?? null) ? $request['files'] : []);
    } else {
        $body = json_decode((string)($request['body'] ?? ''), true);
        $requestSummary['body'] = platform_log_sanitize(is_array($body) ? $body : (string)($request['body'] ?? ''));
    }
    $text = [
        '站点配置: ' . usage_log_text((string)($payload['siteConfig'] ?? $platform['display_name'] ?? '站点配置1'), 80),
        '提示词: ' . platform_request_prompt($request),
        '请求变体: ' . usage_log_text((string)($request['payloadVariant'] ?? $payload['requestVariant'] ?? '-'), 40),
        '请求: ' . platform_log_json($requestSummary),
    ];
    return usage_log_text(implode("\n\n", $text), 4000);
}

function platform_generation_failure_debug(string $endpoint, array $request, ?array $upstream, string $message, string $mode, string $model): array
{
    $bodyType = (string)($request['bodyType'] ?? '');
    $convertedReferenceJson = endpoint_uses_reference_image_json($endpoint, $model) && $bodyType === 'multipart';
    $debug = [
        'phase' => isset($upstream) ? 'upstream_response' : 'upstream_request',
        'mode' => $mode,
        'model' => $model,
        'endpointKind' => endpoint_is_hfsy_api($endpoint) ? 'hfsy' : 'custom',
        'requestBodyType' => $bodyType,
        'convertedReferenceJson' => $convertedReferenceJson,
        'fileCount' => is_array($request['files'] ?? null) ? count($request['files']) : 0,
        'message' => usage_log_text($message, 500),
    ];
    if (isset($upstream)) {
        $debug['upstreamStatus'] = (int)($upstream['status'] ?? 0);
        $debug['upstreamContentType'] = usage_log_text(upstream_content_type((string)($upstream['headers'] ?? '')), 120);
        $debug['upstreamBodyPreview'] = platform_body_preview((string)($upstream['body'] ?? ''));
    }
    return $debug;
}

function platform_log_sanitize($value, string $key = '', int $depth = 0)
{
    if ($depth > 6) {
        return '[已截断]';
    }
    if (is_array($value)) {
        $clean = [];
        $count = 0;
        foreach ($value as $itemKey => $itemValue) {
            $count++;
            if ($count > 30) {
                $clean['...'] = '已省略更多字段';
                break;
            }
            $clean[$itemKey] = platform_log_sanitize($itemValue, (string)$itemKey, $depth + 1);
        }
        return $clean;
    }
    if (is_string($value)) {
        if (preg_match('/authorization|api[-_ ]?key|secret|token/i', $key)) {
            return '[已隐藏]';
        }
        if (starts_with($value, 'data:image/')) {
            return platform_log_image_summary($value);
        }
        if (preg_match('/^[A-Za-z0-9+\/=_-]{800,}$/', $value)) {
            return '[base64 已隐藏，长度 ' . strlen($value) . ']';
        }
        $value = preg_replace('/Bearer\s+[A-Za-z0-9._-]+/i', 'Bearer [已隐藏]', $value) ?? $value;
        $value = preg_replace('/sk-[A-Za-z0-9._-]+/i', 'sk-[已隐藏]', $value) ?? $value;
        $value = preg_replace('#https?://[^\s"\'<>]+/v1/images/(?:generations|edits)\b[^\s"\'<>]*#i', '[站点 API 地址已隐藏]', $value) ?? $value;
        return usage_log_text($value, 1200);
    }
    return $value;
}

function platform_log_image_summary(string $value): string
{
    if ($value === '') {
        return '';
    }
    if (preg_match('/^data:(image\/[^;]+);base64,(.*)$/s', $value, $matches)) {
        return '[' . $matches[1] . ' 数据已隐藏，长度 ' . strlen($matches[2]) . ']';
    }
    return usage_log_text($value, 1200);
}

function platform_log_json($value): string
{
    $json = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    if ($json === false) {
        return '';
    }
    return usage_log_text($json, 3000);
}

function platform_upstream_error_message(array $upstream, ?array $bodyPayload): string
{
    $status = (int)($upstream['status'] ?? 0);
    $message = platform_json_error_message($bodyPayload);
    if ($message !== '') {
        return $status > 0 ? "Upstream HTTP {$status}: {$message}" : $message;
    }
    $preview = platform_body_preview((string)($upstream['body'] ?? ''));
    if ($preview !== '') {
        return $status > 0 ? "Upstream HTTP {$status}: {$preview}" : $preview;
    }
    return $status > 0 ? "Upstream HTTP {$status} failed" : 'Upstream request failed';
}

function platform_request_prompt(array $request): string
{
    $value = platform_request_field_value($request, 'prompt');
    return usage_log_text($value, 1000);
}

function platform_request_size(array $request): string
{
    $value = platform_request_field_value($request, 'size');
    return usage_log_text($value, 40);
}

function platform_request_field_value(array $request, string $field): string
{
    if (($request['bodyType'] ?? '') === 'multipart') {
        $fields = is_array($request['fields'] ?? null) ? $request['fields'] : [];
        return is_scalar($fields[$field] ?? null) ? (string)$fields[$field] : '';
    }
    $body = json_decode((string)($request['body'] ?? ''), true);
    if (!is_array($body)) {
        return '';
    }
    return is_scalar($body[$field] ?? null) ? (string)$body[$field] : '';
}

function platform_upstream_no_image_message(array $upstream, ?array $bodyPayload): string
{
    $status = (int)($upstream['status'] ?? 0);
    $preview = platform_json_error_message($bodyPayload);
    if ($preview === '') {
        $preview = platform_body_preview((string)($upstream['body'] ?? ''));
    }
    if ($preview !== '') {
        return $status > 0 ? "Upstream HTTP {$status}: no image returned ({$preview})" : "No image returned ({$preview})";
    }
    return $status > 0 ? "Upstream HTTP {$status}: no image returned" : 'Upstream response did not contain an image';
}

function platform_json_error_message(?array $payload): string
{
    if (!$payload) {
        return '';
    }
    $candidates = [
        $payload['error']['message'] ?? null,
        $payload['error']['detail'] ?? null,
        $payload['error']['type'] ?? null,
        $payload['error'] ?? null,
        $payload['message'] ?? null,
        $payload['detail'] ?? null,
        $payload['msg'] ?? null,
    ];
    foreach ($candidates as $candidate) {
        if (is_array($candidate)) {
            $candidate = json_encode($candidate, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }
        $text = trim((string)$candidate);
        if ($text === '') {
            continue;
        }
        $code = '';
        if (isset($payload['error']) && is_array($payload['error']) && isset($payload['error']['code'])) {
            $code = trim((string)$payload['error']['code']);
        } elseif (isset($payload['code'])) {
            $code = trim((string)$payload['code']);
        }
        if ($code !== '' && stripos($text, $code) === false) {
            $text .= ' (code: ' . $code . ')';
        }
        return $text;
    }
    return '';
}

function platform_body_preview(string $body): string
{
    $text = trim(preg_replace('/\s+/u', ' ', $body));
    if ($text === '') {
        return '';
    }
    $text = preg_replace('/data:image\/[a-z0-9.+-]+;base64,[A-Za-z0-9+\/=\s]+/i', '[image omitted]', $text);
    $text = preg_replace('/[A-Za-z0-9+\/_-]{180,}={0,2}/', '[base64 omitted]', $text);
    $limit = function_exists('mb_substr') ? mb_substr($text, 0, 360) : substr($text, 0, 360);
    return trim($limit);
}

function upstream_response_images(array $upstream, ?array $bodyPayload): array
{
    if (is_array($bodyPayload)) {
        return json_images($bodyPayload);
    }
    $body = (string)($upstream['body'] ?? '');
    if ($body === '') {
        return [];
    }
    $contentType = strtolower(upstream_content_type((string)($upstream['headers'] ?? '')));
    if (strpos($contentType, 'text/event-stream') !== false) {
        $images = event_stream_images($body);
        if (count($images)) {
            return $images;
        }
    }
    return json_images(['stream' => $body]);
}

function event_stream_images(string $body): array
{
    $events = parse_event_stream($body);
    if (!count($events)) {
        return [];
    }
    $final = [];
    $fallback = [];
    foreach ($events as $event) {
        $data = trim((string)($event['data'] ?? ''));
        if ($data === '' || $data === '[DONE]') {
            continue;
        }
        $decoded = json_decode($data, true);
        $payload = is_array($decoded) ? $decoded : ['stream' => $data];
        $images = json_images($payload);
        if (!count($images)) {
            continue;
        }
        if (event_stream_event_is_final((string)($event['event'] ?? ''), $payload)) {
            foreach ($images as $image) {
                $final[] = $image;
            }
        } else {
            foreach ($images as $image) {
                $fallback[] = $image;
            }
        }
    }
    $images = count($final) ? $final : $fallback;
    return dedupe_image_sources($images);
}

function parse_event_stream(string $body): array
{
    $body = str_replace(["\r\n", "\r"], "\n", $body);
    $lines = explode("\n", $body);
    $events = [];
    $current = ['event' => '', 'data' => []];
    $hasData = false;
    foreach ($lines as $line) {
        if (trim($line) === '') {
            if ($hasData) {
                $events[] = [
                    'event' => trim((string)$current['event']),
                    'data' => implode("\n", $current['data']),
                ];
            }
            $current = ['event' => '', 'data' => []];
            $hasData = false;
            continue;
        }
        if (starts_with($line, 'event:')) {
            $current['event'] = trim(substr($line, 6));
            continue;
        }
        if (starts_with($line, 'data:')) {
            $current['data'][] = ltrim(substr($line, 5));
            $hasData = true;
        }
    }
    if ($hasData) {
        $events[] = [
            'event' => trim((string)$current['event']),
            'data' => implode("\n", $current['data']),
        ];
    }
    return $events;
}

function event_stream_event_is_final(string $eventName, array $payload): bool
{
    $markers = [$eventName];
    foreach (['type', 'event', 'status', 'finish_reason', 'object'] as $key) {
        if (isset($payload[$key]) && is_scalar($payload[$key])) {
            $markers[] = (string)$payload[$key];
        }
    }
    if (isset($payload['data']) && is_array($payload['data'])) {
        foreach (['type', 'event', 'status', 'finish_reason', 'object'] as $key) {
            if (isset($payload['data'][$key]) && is_scalar($payload['data'][$key])) {
                $markers[] = (string)$payload['data'][$key];
            }
        }
    }
    $text = strtolower(implode(' ', $markers));
    return preg_match('/completed|complete|final|done|result|output|success|finish/', $text) === 1;
}

function dedupe_image_sources(array $images): array
{
    $seen = [];
    $clean = [];
    foreach ($images as $image) {
        $key = json_encode($image, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($key === false || isset($seen[$key])) {
            continue;
        }
        $seen[$key] = true;
        $clean[] = $image;
    }
    return $clean;
}

function settle_generation(PDO $pdo, array $config): void
{
    $payload = read_json();
    $ticket = verify_generation_ticket($config, (string)($payload['ticket'] ?? ''));
    if (!$ticket) {
        throw new HttpError('生成票据已失效，请重新生成', 401, 'ticket_invalid');
    }
    $imageId = normalize_request_id((string)($payload['imageId'] ?? ''));
    if ($imageId === '') {
        throw new HttpError('结算图片标识缺失', 400, 'invalid_image_id');
    }
    $requestId = normalize_request_id((string)($payload['requestId'] ?? ''));
    if ($requestId === '') {
        $requestId = 'settle_' . $imageId;
    }
    $price = max(1, (int)$ticket['price']);
    $model = custom_api_model_name((string)($ticket['model'] ?? 'gpt-image-2'));
    $logCode = usage_log_code((string)($payload['logCode'] ?? $payload['traceCode'] ?? ''));
    if ($logCode === '') {
        $logCode = make_ledger_log_code();
    }
    $usageMeta = [
        'logCode' => $logCode,
        'prompt' => usage_log_text((string)($payload['prompt'] ?? ''), 1000),
        'size' => usage_log_text((string)($payload['size'] ?? ($ticket['size'] ?? '')), 40),
        'ratio' => usage_log_text((string)($payload['ratio'] ?? ''), 40),
        'tier' => usage_log_text((string)($payload['tier'] ?? ($ticket['tier'] ?? '')), 16),
        'siteConfig' => usage_log_text((string)($payload['siteConfig'] ?? ($ticket['siteConfig'] ?? '')), 80),
        'batchIndex' => max(0, (int)($payload['batchIndex'] ?? 0)),
        'batchTotal' => max(0, (int)($payload['batchTotal'] ?? 0)),
        'requestPreview' => usage_log_text((string)($payload['requestPreview'] ?? ''), 4000),
        'responsePreview' => usage_log_text((string)($payload['responsePreview'] ?? ''), 4000),
        'httpStatus' => max(0, (int)($payload['httpStatus'] ?? 0)),
        'contentType' => usage_log_text((string)($payload['contentType'] ?? ''), 120),
        'requestVariant' => usage_log_text((string)($payload['requestVariant'] ?? ''), 40),
    ];
    $result = charge_generation_success($pdo, (int)$ticket['uid'], $requestId, (string)$ticket['mode'], $model, $price, $imageId, $usageMeta);
    $logCode = (string)($result['logCode'] ?? $logCode);
    json_response([
        'ok' => true,
        'balanceCents' => (int)$result['balance'],
        'chargedCents' => $price,
        'requestId' => $requestId,
        'logCode' => $logCode,
    ]);
}

function generation_failure_log(PDO $pdo, array $config): void
{
    $user = require_user($pdo, $config);
    $payload = read_json();
    $requestId = normalize_request_id((string)($payload['requestId'] ?? ''));
    $result = record_generation_failure($pdo, (int)$user['id'], $requestId, [
        'logCode' => (string)($payload['logCode'] ?? $payload['traceCode'] ?? ''),
        'mode' => (($payload['mode'] ?? 'text') === 'image') ? 'image' : 'text',
        'model' => custom_api_model_name((string)($payload['model'] ?? 'gpt-image-2')),
        'prompt' => usage_log_text((string)($payload['prompt'] ?? ''), 1000),
        'size' => usage_log_text((string)($payload['size'] ?? ''), 40),
        'ratio' => usage_log_text((string)($payload['ratio'] ?? ''), 40),
        'batchIndex' => max(0, (int)($payload['batchIndex'] ?? 0)),
        'batchTotal' => max(0, (int)($payload['batchTotal'] ?? 0)),
        'imageCount' => max(0, (int)($payload['imageCount'] ?? 0)),
        'priceCents' => max(0, (int)($payload['priceCents'] ?? 0)),
        'errorMessage' => usage_log_text((string)($payload['errorMessage'] ?? '生成失败'), 500),
        'requestPreview' => usage_log_text((string)($payload['requestPreview'] ?? ''), 4000),
        'responsePreview' => usage_log_text((string)($payload['responsePreview'] ?? ''), 4000),
        'httpStatus' => max(0, (int)($payload['httpStatus'] ?? 0)),
        'contentType' => usage_log_text((string)($payload['contentType'] ?? ''), 120),
        'requestVariant' => usage_log_text((string)($payload['requestVariant'] ?? ''), 40),
    ]);
    json_response(['ok' => true, 'requestId' => $result['requestId'], 'logCode' => $result['logCode']]);
}

function record_generation_failure(PDO $pdo, int $userId, string $requestId, array $payload): array
{
    $requestId = normalize_request_id($requestId);
    if ($requestId === '') {
        $requestId = 'fail_' . normalize_request_id(random_token(12));
    }
    if (!starts_with($requestId, 'fail_')) {
        $requestId = 'fail_' . $requestId;
    }
    $logCode = usage_log_code((string)($payload['logCode'] ?? ''));
    if ($logCode === '') {
        $logCode = make_ledger_log_code();
    }
    $mode = (($payload['mode'] ?? 'text') === 'image') ? 'image' : 'text';
    $model = custom_api_model_name((string)($payload['model'] ?? 'gpt-image-2'));
    $imageCount = max(0, (int)($payload['imageCount'] ?? 0));
    $priceCents = max(0, (int)($payload['priceCents'] ?? 0));
    $errorMessage = usage_log_text((string)($payload['errorMessage'] ?? '生成失败'), 500);
    if ($errorMessage === '') {
        $errorMessage = '生成失败';
    }
    $usageMeta = [
        'prompt' => usage_log_text((string)($payload['prompt'] ?? ''), 1000),
        'size' => usage_log_text((string)($payload['size'] ?? ''), 40),
        'ratio' => usage_log_text((string)($payload['ratio'] ?? ''), 40),
        'batchIndex' => max(0, (int)($payload['batchIndex'] ?? 0)),
        'batchTotal' => max(0, (int)($payload['batchTotal'] ?? 0)),
        'requestPreview' => usage_log_text((string)($payload['requestPreview'] ?? ''), 4000),
        'responsePreview' => usage_log_text((string)($payload['responsePreview'] ?? ''), 4000),
        'httpStatus' => max(0, (int)($payload['httpStatus'] ?? 0)),
        'contentType' => usage_log_text((string)($payload['contentType'] ?? ''), 120),
        'requestVariant' => usage_log_text((string)($payload['requestVariant'] ?? ''), 40),
    ];
    $hasUsageColumns = ensure_usage_log_columns($pdo);
    if ($hasUsageColumns) {
        $stmt = $pdo->prepare(
            "INSERT INTO generation_requests
             (user_id, request_id, log_code, mode, model, prompt, size, ratio, batch_index, batch_total, image_count, price_cents, total_cents, status, error_message, request_preview, response_preview, http_status, content_type, request_variant, created_at, completed_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'failed', ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())
             ON DUPLICATE KEY UPDATE
               status = IF(status = 'succeeded', status, 'failed'),
               error_message = IF(status = 'succeeded', error_message, VALUES(error_message)),
               completed_at = IF(status = 'succeeded', completed_at, UTC_TIMESTAMP()),
               log_code = IF(log_code = '', VALUES(log_code), log_code),
               prompt = IF(prompt = '', VALUES(prompt), prompt),
               size = IF(size = '', VALUES(size), size),
               ratio = IF(ratio = '', VALUES(ratio), ratio),
               batch_index = IF(batch_index = 0, VALUES(batch_index), batch_index),
               batch_total = IF(batch_total = 0, VALUES(batch_total), batch_total),
               request_preview = IF(request_preview = '', VALUES(request_preview), request_preview),
               response_preview = IF(response_preview = '', VALUES(response_preview), response_preview),
               http_status = IF(http_status = 0, VALUES(http_status), http_status),
               content_type = IF(content_type = '', VALUES(content_type), content_type),
               request_variant = IF(request_variant = '', VALUES(request_variant), request_variant)"
        );
        $stmt->execute([
            $userId,
            $requestId,
            $logCode,
            $mode,
            $model,
            $usageMeta['prompt'],
            $usageMeta['size'],
            $usageMeta['ratio'],
            $usageMeta['batchIndex'],
            $usageMeta['batchTotal'],
            $imageCount,
            $priceCents,
            $errorMessage,
            $usageMeta['requestPreview'],
            $usageMeta['responsePreview'],
            $usageMeta['httpStatus'],
            $usageMeta['contentType'],
            $usageMeta['requestVariant'],
        ]);
    } else {
        $stmt = $pdo->prepare(
            "INSERT INTO generation_requests
             (user_id, request_id, mode, model, image_count, price_cents, total_cents, status, error_message, created_at, completed_at)
             VALUES (?, ?, ?, ?, ?, ?, 0, 'failed', ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())
             ON DUPLICATE KEY UPDATE
               status = IF(status = 'succeeded', status, 'failed'),
               error_message = IF(status = 'succeeded', error_message, VALUES(error_message)),
               completed_at = IF(status = 'succeeded', completed_at, UTC_TIMESTAMP())"
        );
        $stmt->execute([$userId, $requestId, $mode, $model, $imageCount, $priceCents, $errorMessage]);
    }
    return ['requestId' => $requestId, 'logCode' => $logCode];
}

function ensure_user_can_afford(PDO $pdo, int $userId, int $total): void
{
    $stmt = $pdo->prepare("SELECT balance_cents FROM users WHERE id = ? AND status = 'active' LIMIT 1");
    $stmt->execute([$userId]);
    $balance = (int)$stmt->fetchColumn();
    if ($balance < $total) {
        throw new HttpError('余额不足，请先充值', 402, 'insufficient_balance');
    }
}

function current_balance(PDO $pdo, int $userId): int
{
    $stmt = $pdo->prepare('SELECT balance_cents FROM users WHERE id = ? LIMIT 1');
    $stmt->execute([$userId]);
    return (int)$stmt->fetchColumn();
}

function charge_generation_success(PDO $pdo, int $userId, string $requestId, string $mode, string $model, int $price, string $imageId, array $usageMeta = []): array
{
    $hasUsageColumns = ensure_usage_log_columns($pdo);
    $logCode = usage_log_code((string)($usageMeta['logCode'] ?? ''));
    if ($logCode === '') {
        $logCode = make_ledger_log_code();
    }
    $pdo->beginTransaction();
    try {
        $existing = $pdo->prepare('SELECT * FROM generation_requests WHERE request_id = ? LIMIT 1 FOR UPDATE');
        $existing->execute([$requestId]);
        $old = $existing->fetch();
        if ($old) {
            if ((int)$old['user_id'] !== $userId) {
                throw new HttpError('请勿重复提交同一次生成请求', 409, 'duplicate_request');
            }
            $oldLogCode = usage_log_code((string)($old['log_code'] ?? ''));
            if ($oldLogCode !== '') {
                $logCode = $oldLogCode;
            }
            if ($hasUsageColumns && $logCode !== '' && $oldLogCode === '') {
                $updateGeneration = $pdo->prepare(
                    "UPDATE generation_requests
                     SET log_code = IF(log_code = '', ?, log_code),
                         prompt = IF(prompt = '', ?, prompt),
                         size = IF(size = '', ?, size),
                         ratio = IF(ratio = '', ?, ratio),
                         batch_index = IF(batch_index = 0, ?, batch_index),
                         batch_total = IF(batch_total = 0, ?, batch_total),
                         request_preview = IF(request_preview = '' OR request_preview IS NULL, ?, request_preview),
                         response_preview = IF(response_preview = '' OR response_preview IS NULL, ?, response_preview),
                         http_status = IF(http_status = 0, ?, http_status),
                         content_type = IF(content_type = '', ?, content_type),
                         request_variant = IF(request_variant = '', ?, request_variant)
                     WHERE id = ?"
                );
                $updateGeneration->execute([
                    $logCode,
                    usage_log_text((string)($usageMeta['prompt'] ?? ''), 1000),
                    usage_log_text((string)($usageMeta['size'] ?? ''), 40),
                    usage_log_text((string)($usageMeta['ratio'] ?? ''), 40),
                    max(0, (int)($usageMeta['batchIndex'] ?? 0)),
                    max(0, (int)($usageMeta['batchTotal'] ?? 0)),
                    usage_log_text((string)($usageMeta['requestPreview'] ?? ''), 4000),
                    usage_log_text((string)($usageMeta['responsePreview'] ?? ''), 4000),
                    max(0, (int)($usageMeta['httpStatus'] ?? 0)),
                    usage_log_text((string)($usageMeta['contentType'] ?? ''), 120),
                    usage_log_text((string)($usageMeta['requestVariant'] ?? ''), 40),
                    (int)$old['id'],
                ]);
            }
            if ($hasUsageColumns) {
                $updateLedger = $pdo->prepare(
                    "UPDATE wallet_ledger
                     SET log_code = ?
                     WHERE user_id = ? AND type = 'charge' AND related_id = ? AND log_code = ''
                     ORDER BY id DESC
                     LIMIT 1"
                );
                $updateLedger->execute([$logCode, $userId, $requestId]);
            }
            $pdo->commit();
            return ['balance' => current_balance($pdo, $userId), 'duplicate' => true, 'logCode' => $logCode];
        }
        $beforeStmt = $pdo->prepare('SELECT balance_cents FROM users WHERE id = ? FOR UPDATE');
        $beforeStmt->execute([$userId]);
        $before = (int)$beforeStmt->fetchColumn();
        if ($before < $price) {
            throw new HttpError('余额不足，请先充值', 402, 'insufficient_balance');
        }
        $affected = $pdo->prepare(
            "UPDATE users SET balance_cents = balance_cents - ?, updated_at = UTC_TIMESTAMP()
             WHERE id = ? AND balance_cents >= ? AND status = 'active'"
        );
        $affected->execute([$price, $userId, $price]);
        if ($affected->rowCount() !== 1) {
            throw new HttpError('余额不足，请先充值', 402, 'insufficient_balance');
        }
        $after = $before - $price;
        if ($hasUsageColumns) {
            $insert = $pdo->prepare(
                "INSERT INTO generation_requests
                 (user_id, request_id, log_code, mode, model, prompt, size, ratio, batch_index, batch_total, request_preview, response_preview, http_status, content_type, request_variant, image_count, price_cents, total_cents, status, error_message, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, 'succeeded', '', UTC_TIMESTAMP())"
            );
            $insert->execute([
                $userId,
                $requestId,
                $logCode,
                $mode,
                $model,
                usage_log_text((string)($usageMeta['prompt'] ?? ''), 1000),
                usage_log_text((string)($usageMeta['size'] ?? ''), 40),
                usage_log_text((string)($usageMeta['ratio'] ?? ''), 40),
                max(0, (int)($usageMeta['batchIndex'] ?? 0)),
                max(0, (int)($usageMeta['batchTotal'] ?? 0)),
                usage_log_text((string)($usageMeta['requestPreview'] ?? ''), 4000),
                usage_log_text((string)($usageMeta['responsePreview'] ?? ''), 4000),
                max(0, (int)($usageMeta['httpStatus'] ?? 0)),
                usage_log_text((string)($usageMeta['contentType'] ?? ''), 120),
                usage_log_text((string)($usageMeta['requestVariant'] ?? ''), 40),
                $price,
                $price,
            ]);
        } else {
            $insert = $pdo->prepare(
                "INSERT INTO generation_requests
                 (user_id, request_id, mode, model, image_count, price_cents, total_cents, status, error_message, created_at)
                 VALUES (?, ?, ?, ?, 1, ?, ?, 'succeeded', '', UTC_TIMESTAMP())"
            );
            $insert->execute([$userId, $requestId, $mode, $model, $price, $price]);
        }
        $generationId = (int)$pdo->lastInsertId();
        create_ledger($pdo, $userId, 'charge', -$price, $before, $after, $requestId, charge_ledger_note($mode, $usageMeta), $logCode);
        complete_generation_charge($pdo, $generationId, 'succeeded', '');
        $pdo->commit();
        return ['balance' => $after, 'duplicate' => false, 'logCode' => $logCode];
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $error;
    }
}

function complete_generation_charge(PDO $pdo, int $generationId, string $status, string $errorMessage): void
{
    $stmt = $pdo->prepare('UPDATE generation_requests SET status = ?, error_message = ?, completed_at = UTC_TIMESTAMP() WHERE id = ?');
    $stmt->execute([$status, substr($errorMessage, 0, 500), $generationId]);
}

function refund_generation_charge(PDO $pdo, int $userId, int $generationId, string $requestId, int $total, string $message): void
{
    $pdo->beginTransaction();
    try {
        $gen = $pdo->prepare("SELECT * FROM generation_requests WHERE id = ? FOR UPDATE");
        $gen->execute([$generationId]);
        $record = $gen->fetch();
        if (!$record || $record['status'] !== 'reserved') {
            $pdo->commit();
            return;
        }
        $userStmt = $pdo->prepare('SELECT balance_cents FROM users WHERE id = ? FOR UPDATE');
        $userStmt->execute([$userId]);
        $before = (int)$userStmt->fetchColumn();
        $after = $before + $total;
        $pdo->prepare('UPDATE users SET balance_cents = ?, updated_at = UTC_TIMESTAMP() WHERE id = ?')->execute([$after, $userId]);
        $pdo->prepare("UPDATE generation_requests SET status = 'refunded', error_message = ?, completed_at = UTC_TIMESTAMP() WHERE id = ?")->execute([substr($message, 0, 500), $generationId]);
        create_ledger($pdo, $userId, 'refund', $total, $before, $after, $requestId, '站点 API 失败退款', (string)($record['log_code'] ?? ''));
        $pdo->commit();
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $error;
    }
}

function fallback_platform_config(array $config): array
{
    $platform = is_array($config['platform'] ?? null) ? $config['platform'] : [];
    $modelName = custom_api_model_name((string)($platform['model_name'] ?? $platform['modelName'] ?? 'gpt-image-2'));
    $priceCents = max(1, (int)($platform['price_cents'] ?? 10));
    $modelOptions = custom_api_model_options($platform['model_options'] ?? $platform['modelOptions'] ?? [], $modelName, $priceCents);
    return [
        'text_endpoint' => trim((string)($platform['text_endpoint'] ?? '')),
        'edit_endpoint' => trim((string)($platform['edit_endpoint'] ?? '')),
        'api_key' => trim((string)($platform['api_key'] ?? '')),
        'price_cents' => (int)($modelOptions[0]['priceCents'] ?? $priceCents),
        'upstream_cost_cents' => max(0, (int)($platform['upstream_cost_cents'] ?? 0)),
        'max_count' => max(1, (int)($platform['max_count'] ?? 4)),
        'model_name' => $modelName,
        'model_options' => $modelOptions,
        'request_format' => 'openai',
        'transport_mode' => 'proxy',
        'custom_template' => '',
        'display_name' => '站点配置1',
        'source' => 'file',
    ];
}

function platform_config(PDO $pdo, array $config): array
{
    $fallback = fallback_platform_config($config);
    $stored = read_admin_setting_json($pdo, $config, 'platform_global_api');
    if (!is_array($stored) || $stored === []) {
        return $fallback;
    }
    return normalize_global_platform_config($stored, $fallback);
}

function normalize_global_platform_config(array $value, array $fallback): array
{
    $textEndpoint = trim((string)($value['textEndpoint'] ?? $value['text_endpoint'] ?? $fallback['text_endpoint']));
    $editEndpoint = trim((string)($value['editEndpoint'] ?? $value['edit_endpoint'] ?? $fallback['edit_endpoint']));
    $apiKey = trim((string)($value['apiKey'] ?? $value['api_key'] ?? $fallback['api_key']));
    $price = max(1, (int)($value['priceCents'] ?? $value['price_cents'] ?? $fallback['price_cents']));
    $upstreamCost = max(0, (int)($value['upstreamCostCents'] ?? $value['upstream_cost_cents'] ?? $fallback['upstream_cost_cents']));
    $maxCount = max(1, (int)($value['maxCount'] ?? $value['max_count'] ?? $fallback['max_count']));
    $requestFormat = (string)($value['requestFormat'] ?? $value['request_format'] ?? $fallback['request_format']);
    if (!in_array($requestFormat, ['openai', 'json'], true)) {
        $requestFormat = 'openai';
    }
    $transportMode = (string)($value['transportMode'] ?? $value['transport_mode'] ?? $fallback['transport_mode'] ?? 'proxy');
    if (!in_array($transportMode, ['direct', 'proxy'], true)) {
        $transportMode = 'proxy';
    }
    $customTemplate = custom_api_template((string)($value['customTemplate'] ?? $value['custom_template'] ?? $fallback['custom_template']));
    $displayName = custom_api_safe_display_name((string)($value['displayName'] ?? $value['display_name'] ?? $value['title'] ?? $fallback['display_name'] ?? ''), 1);
    $modelName = custom_api_model_name((string)($value['modelName'] ?? $value['model_name'] ?? $fallback['model_name'] ?? 'gpt-image-2'));
    $modelOptions = custom_api_model_options($value['modelOptions'] ?? $value['model_options'] ?? $fallback['model_options'] ?? [], $modelName, $price);
    return [
        'text_endpoint' => $textEndpoint,
        'edit_endpoint' => $editEndpoint,
        'api_key' => $apiKey,
        'price_cents' => (int)($modelOptions[0]['priceCents'] ?? $price),
        'upstream_cost_cents' => $upstreamCost,
        'max_count' => $maxCount,
        'model_name' => $modelName,
        'model_options' => $modelOptions,
        'request_format' => $requestFormat,
        'transport_mode' => $transportMode,
        'custom_template' => $customTemplate,
        'display_name' => $displayName,
        'updated_at' => (int)($value['updatedAt'] ?? $value['updated_at'] ?? 0),
        'source' => 'database',
    ];
}

function public_global_platform_config(array $platform): array
{
    $modelOptions = $platform['model_options'] ?? custom_api_model_options([], (string)$platform['model_name'], (int)$platform['price_cents']);
    return [
        'textEndpoint' => (string)$platform['text_endpoint'],
        'editEndpoint' => (string)$platform['edit_endpoint'],
        'apiKey' => (string)$platform['api_key'],
        'priceCents' => (int)($modelOptions[0]['priceCents'] ?? $platform['price_cents']),
        'upstreamCostCents' => (int)$platform['upstream_cost_cents'],
        'maxCount' => (int)$platform['max_count'],
        'modelName' => (string)$platform['model_name'],
        'modelOptions' => $modelOptions,
        'requestFormat' => (string)$platform['request_format'],
        'transportMode' => (string)($platform['transport_mode'] ?? 'proxy'),
        'customTemplate' => (string)$platform['custom_template'],
        'displayName' => (string)($platform['display_name'] ?? '站点配置1'),
        'updatedAt' => (int)($platform['updated_at'] ?? 0),
        'source' => (string)($platform['source'] ?? 'file'),
    ];
}

function platform_is_configured(array $platform): bool
{
    return trim((string)$platform['text_endpoint']) !== '' && trim((string)$platform['api_key']) !== '';
}

function platform_image_endpoint(array $platform): string
{
    $textEndpoint = (string)$platform['text_endpoint'];
    $editEndpoint = (string)$platform['edit_endpoint'];
    $model = custom_api_model_name((string)($platform['model_name'] ?? 'gpt-image-2'));
    return reference_image_json_endpoint($editEndpoint, $model)
        ?: reference_image_json_endpoint($textEndpoint, $model)
        ?: ($editEndpoint ?: infer_edit_endpoint($textEndpoint));
}

function reference_image_json_endpoint(string $endpoint, string $model = ''): string
{
    if (!endpoint_uses_reference_image_json($endpoint, $model)) {
        return '';
    }
    return preg_replace('#/images/edits?/?(\?.*)?$#i', '/images/generations$1', $endpoint) ?: $endpoint;
}

function endpoint_uses_reference_image_json(string $endpoint, string $model = ''): bool
{
    $host = strtolower((string)parse_url($endpoint, PHP_URL_HOST));
    $path = (string)parse_url($endpoint, PHP_URL_PATH);
    if (!preg_match('#/v\d+/images/(?:generations|edits?)/?$#i', $path)) {
        return false;
    }
    return endpoint_is_hfsy_api($endpoint)
        || is_gpt_image_2_model($model);
}

function endpoint_is_hfsy_api(string $endpoint): bool
{
    $host = strtolower((string)parse_url($endpoint, PHP_URL_HOST));
    if ($host !== '') {
        return (bool)preg_match('/(^|\.)hfsyapi\.cn$/i', $host);
    }
    return (bool)preg_match('/(^|[\/:])(?:www\.)?hfsyapi\.cn(?=\/|$)/i', $endpoint);
}

function reference_image_json_prefers_base64(string $endpoint, string $model = ''): bool
{
    return is_gpt_image_2_model($model) && !endpoint_is_hfsy_api($endpoint);
}

function sign_generation_ticket(array $config, array $claims, string $token): string
{
    $claims['tok'] = secret_hash($config, 'generation-ticket-token', $token);
    $payload = base64url_encode(json_encode($claims, JSON_UNESCAPED_SLASHES));
    $signature = secret_hash($config, 'generation-ticket', $payload);
    return $payload . '.' . $signature;
}

function verify_generation_ticket(array $config, string $ticket): ?array
{
    $parts = explode('.', $ticket, 2);
    if (count($parts) !== 2 || $parts[0] === '' || $parts[1] === '') {
        return null;
    }
    $expected = secret_hash($config, 'generation-ticket', $parts[0]);
    if (!hash_equals($expected, $parts[1])) {
        return null;
    }
    $json = base64url_decode($parts[0]);
    $claims = json_decode($json, true);
    if (!is_array($claims) || (int)($claims['exp'] ?? 0) < time()) {
        return null;
    }
    if ((int)($claims['uid'] ?? 0) <= 0 || (int)($claims['count'] ?? 0) <= 0 || (int)($claims['price'] ?? 0) <= 0) {
        return null;
    }
    return $claims;
}

function base64url_encode(string $value): string
{
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
}

function base64url_decode(string $value): string
{
    $padding = strlen($value) % 4;
    if ($padding) {
        $value .= str_repeat('=', 4 - $padding);
    }
    $decoded = base64_decode(strtr($value, '-_', '+/'), true);
    return $decoded === false ? '' : $decoded;
}

function call_platform_upstream(array $config, array $platform, string $endpoint, array $request): array
{
    $model = platform_request_model($request, $platform);
    if (endpoint_uses_reference_image_json($endpoint, $model) && ($request['bodyType'] ?? '') === 'multipart') {
        [$endpoint, $request] = platform_reference_json_request($config, $endpoint, $request);
    }
    return call_upstream_request($endpoint, $request, [
        'Authorization' => 'Bearer ' . (string)$platform['api_key'],
    ]);
}

function call_proxy_upstream(string $endpoint, array $request): array
{
    return call_upstream_request($endpoint, $request, []);
}

function platform_request_model(array $request, array $platform): string
{
    if (($request['bodyType'] ?? '') === 'multipart') {
        $fields = is_array($request['fields'] ?? null) ? $request['fields'] : [];
        return custom_api_model_name((string)($fields['model'] ?? $platform['model_name'] ?? 'gpt-image-2'));
    }
    $body = json_decode((string)($request['body'] ?? ''), true);
    if (is_array($body)) {
        return custom_api_model_name((string)($body['model'] ?? $platform['model_name'] ?? 'gpt-image-2'));
    }
    return custom_api_model_name((string)($platform['model_name'] ?? 'gpt-image-2'));
}

function platform_reference_json_request(array $config, string $endpoint, array $request, string $baseOverride = ''): array
{
    $fields = is_array($request['fields'] ?? null) ? $request['fields'] : [];
    $body = [
        'model' => (string)($fields['model'] ?? 'gpt-image-2'),
        'prompt' => (string)($fields['prompt'] ?? ''),
        'reference_images' => [],
    ];
    foreach (['n', 'count'] as $key) {
        if (isset($fields[$key]) && (int)$fields[$key] > 0) {
            $body['n'] = (int)$fields[$key];
            break;
        }
    }
    if (isset($fields['size']) && trim((string)$fields['size']) !== '' && trim((string)$fields['size']) !== 'auto') {
        $body['size'] = (string)$fields['size'];
    }
    if (isset($fields['seed']) && trim((string)$fields['seed']) !== '') {
        $body['seed'] = is_numeric($fields['seed']) ? (int)$fields['seed'] : (string)$fields['seed'];
    }
    $body['response_format'] = 'b64_json';

    $preferBase64 = reference_image_json_prefers_base64($endpoint, (string)($body['model'] ?? 'gpt-image-2'));
    foreach (array_slice(is_array($request['files'] ?? null) ? $request['files'] : [], 0, 4) as $file) {
        if (!is_array($file)) {
            continue;
        }
        [$bytes, , $extension] = reference_image_decode((string)($file['dataUrl'] ?? ''));
        $body['reference_images'][] = $preferBase64
            ? base64_encode($bytes)
            : reference_image_store($config, $bytes, $extension, $baseOverride);
    }
    if (!count($body['reference_images'])) {
        throw new RuntimeException('图生图参考图为空');
    }

    return [
        reference_image_json_endpoint($endpoint, (string)($body['model'] ?? 'gpt-image-2')) ?: $endpoint,
        [
            'method' => 'POST',
            'headers' => ['Content-Type' => 'application/json'],
            'bodyType' => 'json',
            'body' => json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ],
    ];
}

function call_upstream_request(string $endpoint, array $request, array $forcedHeaders): array
{
    $request = normalize_image_edit_multipart_request($request);
    $headers = [];
    foreach (($request['headers'] ?? []) as $key => $value) {
        $lower = strtolower((string)$key);
        if ($lower === 'content-type') {
            $headers['Content-Type'] = (string)$value;
        } elseif ($lower === 'authorization') {
            $headers['Authorization'] = (string)$value;
        }
    }
    foreach ($forcedHeaders as $key => $value) {
        if ((string)$value !== '') {
            $headers[(string)$key] = (string)$value;
        }
    }
    $headers['Accept'] = $headers['Accept'] ?? (request_wants_event_stream($request) ? 'text/event-stream, application/json, */*' : 'application/json, text/plain, */*');
    $headers['Accept-Language'] = $headers['Accept-Language'] ?? 'zh-CN,zh;q=0.9,en;q=0.8';
    $headers['Expect'] = '';
    $headers['User-Agent'] = $headers['User-Agent'] ?? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36';
    $tempFiles = [];
    try {
        if (($request['bodyType'] ?? '') === 'multipart') {
            unset($headers['Content-Type']);
            $body = [];
            foreach (($request['fields'] ?? []) as $key => $value) {
                $body[(string)$key] = (string)$value;
            }
            $fileIndex = 0;
            foreach (($request['files'] ?? []) as $file) {
                if (!is_array($file)) {
                    continue;
                }
                $temp = data_url_to_temp_file((string)($file['dataUrl'] ?? ''));
                $tempFiles[] = $temp['path'];
                $field = upstream_multipart_file_field($request, (string)($file['field'] ?? 'image'), $fileIndex);
                $filename = (string)($file['filename'] ?? 'image.png');
                $body[$field] = new CURLFile($temp['path'], $temp['mime'], $filename);
                $fileIndex++;
            }
        } else {
            $body = (string)($request['body'] ?? '');
            if (!isset($headers['Content-Type'])) {
                $headers['Content-Type'] = 'application/json';
            }
        }
        return fetch_url($endpoint, [
            'method' => (string)($request['method'] ?? 'POST'),
            'headers' => $headers,
            'body' => $body,
        ]);
    } finally {
        foreach ($tempFiles as $path) {
            if (is_file($path)) {
                @unlink($path);
            }
        }
    }
}

function request_wants_event_stream(array $request): bool
{
    if (($request['bodyType'] ?? '') === 'multipart') {
        $fields = is_array($request['fields'] ?? null) ? $request['fields'] : [];
        return truthy_request_value($fields['stream'] ?? null);
    }
    $body = json_decode((string)($request['body'] ?? ''), true);
    return is_array($body) && truthy_request_value($body['stream'] ?? null);
}

function truthy_request_value($value): bool
{
    if (is_bool($value)) {
        return $value;
    }
    $text = strtolower(trim((string)$value));
    return in_array($text, ['1', 'true', 'yes', 'on'], true);
}

function normalize_image_edit_multipart_request(array $request): array
{
    if (($request['bodyType'] ?? '') !== 'multipart') {
        return $request;
    }
    $variant = (string)($request['payloadVariant'] ?? 'compatible');
    if ($variant !== 'compatible') {
        return $request;
    }
    $fields = is_array($request['fields'] ?? null) ? $request['fields'] : [];
    if (!isset($fields['size']) || trim((string)$fields['size']) === '') {
        $fields['size'] = 'auto';
    }
    if (!isset($fields['output_format']) || trim((string)$fields['output_format']) === '') {
        $fields['output_format'] = 'png';
    }
    if (!isset($fields['moderation']) || trim((string)$fields['moderation']) === '') {
        $fields['moderation'] = 'auto';
    }
    if (!isset($fields['quality']) || trim((string)$fields['quality']) === '') {
        $fields['quality'] = 'auto';
    }
    if (!isset($fields['response_format']) || trim((string)$fields['response_format']) === '') {
        $fields['response_format'] = 'b64_json';
    }
    $request['fields'] = $fields;
    return $request;
}

function upstream_multipart_file_field(array $request, string $field, int $index): string
{
    $field = trim($field) !== '' ? trim($field) : 'image';
    $mode = (string)($request['fileFieldMode'] ?? '');
    if ($mode === 'array' && preg_match('/^image(?:_\d+)?$|^image(?:\[\d*\])?$/', $field)) {
        return $index <= 0 ? 'image[]' : 'image[' . $index . ']';
    }
    if ($mode === 'indexed' && preg_match('/^image(?:_\d+)?$|^image(?:\[\d*\])?$/', $field)) {
        return 'image[' . $index . ']';
    }
    if ($mode === 'single' && preg_match('/^image(?:_\d+)?$|^image(?:\[\d*\])?$/', $field)) {
        return $index <= 0 ? 'image' : 'image_' . ($index + 1);
    }
    return $field;
}

function endpoint_requires_server_proxy(string $endpoint): bool
{
    return false;
}

function endpoint_host_matches(string $endpoint, string $pattern): bool
{
    $host = parse_url($endpoint, PHP_URL_HOST);
    return is_string($host) && preg_match($pattern, $host) === 1;
}

function enforce_platform_request_count(array $request, int $count): array
{
    $safeCount = max(1, $count);
    $bodyType = (string)($request['bodyType'] ?? 'json');

    if ($bodyType === 'multipart') {
        $fields = is_array($request['fields'] ?? null) ? $request['fields'] : [];
        $request['fields'] = force_count_fields($fields, $safeCount, true);
        return $request;
    }

    $body = (string)($request['body'] ?? '');
    $decoded = json_decode($body, true);
    if (is_array($decoded)) {
        $request['body'] = json_encode(force_count_fields($decoded, $safeCount, false), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    return $request;
}

function platform_request_with_model(array $request, string $model): array
{
    $model = custom_api_model_name($model);
    $bodyType = (string)($request['bodyType'] ?? 'json');

    if ($bodyType === 'multipart') {
        $fields = is_array($request['fields'] ?? null) ? $request['fields'] : [];
        $fields['model'] = $model;
        $request['fields'] = $fields;
        return $request;
    }

    $body = (string)($request['body'] ?? '');
    $decoded = json_decode($body, true);
    if (is_array($decoded)) {
        $decoded['model'] = $model;
        $request['body'] = json_encode($decoded, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    return $request;
}

function force_count_fields(array $payload, int $count, bool $stringValues): array
{
    $value = $stringValues ? (string)$count : $count;
    $countKeys = ['n', 'count', 'num_images', 'image_count', 'quantity'];
    if ($count > 1 || array_intersect($countKeys, array_keys($payload))) {
        $payload['n'] = $value;
    }
    foreach ($countKeys as $key) {
        if (array_key_exists($key, $payload)) {
            $payload[$key] = $value;
        }
    }
    return $payload;
}

function admin_create_redeem_codes(PDO $pdo, array $config): void
{
    require_admin($pdo, $config);
    $payload = read_json();
    $amount = max(1, (int)($payload['amountCents'] ?? 0));
    $count = max(1, min(1000, (int)($payload['count'] ?? 1)));
    $label = trim((string)($payload['label'] ?? ''));
    $created = [];
    $pdo->beginTransaction();
    try {
        $insert = $pdo->prepare(
            "INSERT INTO redeem_codes (code_hash, code_prefix, code_suffix, amount_cents, label, status, created_at)
             VALUES (?, ?, ?, ?, ?, 'active', UTC_TIMESTAMP())"
        );
        for ($i = 0; $i < $count; $i += 1) {
            $code = make_redeem_code();
            $insert->execute([
                secret_hash($config, 'redeem-code', normalize_code($code)),
                substr($code, 0, 7),
                substr($code, -6),
                $amount,
                $label,
            ]);
            $created[] = ['code' => $code, 'amountCents' => $amount, 'label' => $label];
        }
        $pdo->commit();
        json_response(['ok' => true, 'codes' => $created]);
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $error;
    }
}

function admin_list_redeem_codes(PDO $pdo, array $config): void
{
    require_admin($pdo, $config);
    $stmt = $pdo->query('SELECT id, code_prefix, code_suffix, amount_cents, label, status, used_by_user_id, used_at, created_at FROM redeem_codes ORDER BY id DESC LIMIT 100');
    $codes = [];
    foreach ($stmt->fetchAll() as $row) {
        $codes[] = [
            'id' => (int)$row['id'],
            'code' => $row['code_prefix'] . '...' . $row['code_suffix'],
            'amountCents' => (int)$row['amount_cents'],
            'label' => (string)$row['label'],
            'status' => (string)$row['status'],
            'usedByUserId' => $row['used_by_user_id'] ? (int)$row['used_by_user_id'] : 0,
            'usedAt' => $row['used_at'] ? utc_sql_timestamp_ms((string)$row['used_at']) : 0,
            'createdAt' => utc_sql_timestamp_ms((string)$row['created_at']),
        ];
    }
    json_response(['ok' => true, 'codes' => $codes]);
}

function admin_user_usage(PDO $pdo, array $config): void
{
    require_admin($pdo, $config);
    ensure_usage_log_columns($pdo);
    $email = normalize_email((string)($_GET['email'] ?? ''));
    if ($email === '') {
        throw new HttpError('请输入有效邮箱', 400, 'invalid_email');
    }
    $userStmt = $pdo->prepare("SELECT * FROM users WHERE LOWER(TRIM(email)) = ? LIMIT 1");
    $userStmt->execute([strtolower($email)]);
    $user = $userStmt->fetch();
    if (!$user) {
        throw new HttpError('用户不存在', 404, 'user_not_found');
    }
    $userId = (int)$user['id'];
    backfill_redeem_ledger_log_codes($pdo, $userId);

    $totalsStmt = $pdo->prepare(
        "SELECT
           COALESCE(SUM(CASE WHEN type = 'redeem' AND amount_cents > 0 THEN amount_cents ELSE 0 END), 0) AS total_recharge_cents,
           COALESCE(SUM(CASE WHEN type = 'charge' AND amount_cents < 0 THEN -amount_cents ELSE 0 END), 0) AS total_spent_cents
         FROM wallet_ledger
         WHERE user_id = ?"
    );
    $totalsStmt->execute([$userId]);
    $totals = $totalsStmt->fetch() ?: [];
    $totalRechargeCents = (int)($totals['total_recharge_cents'] ?? 0);
    $totalSpentCents = (int)($totals['total_spent_cents'] ?? 0);
    $ledgerCountStmt = $pdo->prepare('SELECT COUNT(*) FROM wallet_ledger WHERE user_id = ?');
    $ledgerCountStmt->execute([$userId]);
    $ledgerCount = (int)$ledgerCountStmt->fetchColumn();
    $generationCountStmt = $pdo->prepare('SELECT COUNT(*) FROM generation_requests WHERE user_id = ?');
    $generationCountStmt->execute([$userId]);
    $generationLogCount = (int)$generationCountStmt->fetchColumn();

    $ledgerStmt = $pdo->prepare(
        "SELECT * FROM wallet_ledger
         WHERE user_id = ?
         ORDER BY id DESC
         LIMIT 120"
    );
    $ledgerStmt->execute([$userId]);
    $ledger = [];
    foreach ($ledgerStmt->fetchAll() as $item) {
        $ledger[] = public_ledger_item($item);
    }

    $generationStmt = $pdo->prepare(
        "SELECT *
         FROM generation_requests
         WHERE user_id = ?
         ORDER BY id DESC
         LIMIT 120"
    );
    $generationStmt->execute([$userId]);
    $generationLogs = [];
    foreach ($generationStmt->fetchAll() as $item) {
        $generationLogs[] = public_generation_request_item($item);
    }

    json_response([
        'ok' => true,
        'user' => [
            'id' => $userId,
            'email' => (string)$user['email'],
            'balanceCents' => (int)$user['balance_cents'],
            'totalRechargeCents' => $totalRechargeCents,
            'totalSpentCents' => $totalSpentCents,
            'createdAt' => utc_sql_timestamp_ms((string)$user['created_at']),
            'lastLoginAt' => $user['last_login_at'] ? utc_sql_timestamp_ms((string)$user['last_login_at']) : 0,
        ],
        'generationLogCount' => $generationLogCount,
        'ledgerCount' => $ledgerCount,
        'generationLogs' => $generationLogs,
        'ledger' => $ledger,
    ]);
}

function admin_ping(PDO $pdo, array $config): void
{
    require_admin($pdo, $config);
    json_response(['ok' => true]);
}

function admin_get_custom_api(PDO $pdo, array $config): void
{
    require_admin($pdo, $config);
    $settings = read_admin_setting_json($pdo, $config, 'custom_api_debug');
    $current = normalize_custom_api_config($settings['current'] ?? []);
    $history = normalize_custom_api_history($settings['history'] ?? []);
    $global = public_global_platform_config(platform_config($pdo, $config));
    json_response([
        'ok' => true,
        'config' => $current,
        'history' => $history,
        'global' => $global,
    ]);
}

function admin_save_custom_api(PDO $pdo, array $config): void
{
    require_admin($pdo, $config);
    $payload = read_json();
    $settings = read_admin_setting_json($pdo, $config, 'custom_api_debug');
    $current = normalize_custom_api_config($payload);
    if ($current['enabled'] && ($current['textEndpoint'] === '' || $current['apiKey'] === '')) {
        throw new HttpError('启用自定义 API 调试前，请填写文生图 API URL 和 API Key', 400, 'custom_api_incomplete');
    }

    $history = normalize_custom_api_history($settings['history'] ?? []);
    if ($current['textEndpoint'] !== '' || $current['editEndpoint'] !== '' || $current['apiKey'] !== '') {
        $snapshot = $current;
        $snapshot['enabled'] = false;
        $snapshot['id'] = $snapshot['id'] ?: random_token(8);
        $snapshot['updatedAt'] = time() * 1000;
        $snapshot = custom_api_prepare_history_snapshot($snapshot, $history);
        $current['title'] = $snapshot['title'];
        $key = custom_api_history_key($snapshot);
        $filtered = [];
        foreach ($history as $item) {
            if (custom_api_history_key($item) !== $key) {
                $filtered[] = $item;
            }
        }
        $history = array_slice(array_merge([$snapshot], $filtered), 0, 12);
    }

    $current['updatedAt'] = time() * 1000;
    write_admin_setting_json($pdo, $config, 'custom_api_debug', [
        'current' => $current,
        'history' => $history,
    ]);
    $global = public_global_platform_config(platform_config($pdo, $config));
    json_response([
        'ok' => true,
        'config' => $current,
        'history' => $history,
        'global' => $global,
    ]);
}

function admin_apply_custom_api_global(PDO $pdo, array $config): void
{
    require_admin($pdo, $config);
    $payload = read_json();
    $current = normalize_custom_api_config($payload);
    if ($current['textEndpoint'] === '' || $current['apiKey'] === '') {
        throw new HttpError('设置全局 API 前，请填写文生图 API URL 和 API Key', 400, 'global_api_incomplete');
    }
    foreach ($current['modelOptions'] as $modelOption) {
        if ((int)($modelOption['priceCents'] ?? 0) <= 0) {
            throw new HttpError('每个模型售价都需要大于 0 元/张', 400, 'invalid_price');
        }
    }
    $existingPlatform = platform_config($pdo, $config);

    $settings = read_admin_setting_json($pdo, $config, 'custom_api_debug');
    $history = normalize_custom_api_history($settings['history'] ?? []);
    $current['updatedAt'] = time() * 1000;
    $snapshot = $current;
    $snapshot['enabled'] = false;
    $snapshot['id'] = $snapshot['id'] ?: random_token(8);
    $snapshot = custom_api_prepare_history_snapshot($snapshot, $history);
    $current['title'] = $snapshot['title'];
    $key = custom_api_history_key($snapshot);
    $filtered = [];
    foreach ($history as $item) {
        if (custom_api_history_key($item) !== $key) {
            $filtered[] = $item;
        }
    }
    $history = array_slice(array_merge([$snapshot], $filtered), 0, 12);

    write_admin_setting_json($pdo, $config, 'custom_api_debug', [
        'current' => $current,
        'history' => $history,
    ]);
    write_admin_setting_json($pdo, $config, 'platform_global_api', [
        'textEndpoint' => $current['textEndpoint'],
        'editEndpoint' => $current['editEndpoint'],
        'apiKey' => $current['apiKey'],
        'priceCents' => $current['priceCents'],
        'upstreamCostCents' => (int)$existingPlatform['upstream_cost_cents'],
        'maxCount' => (int)$existingPlatform['max_count'],
        'modelName' => $current['modelName'],
        'modelOptions' => $current['modelOptions'],
        'requestFormat' => $current['requestFormat'],
        'transportMode' => $current['transportMode'],
        'customTemplate' => $current['customTemplate'],
        'displayName' => $current['title'],
        'updatedAt' => $current['updatedAt'],
    ]);
    $global = public_global_platform_config(platform_config($pdo, $config));
    json_response([
        'ok' => true,
        'config' => $current,
        'history' => $history,
        'global' => $global,
        'priceCents' => (int)$global['priceCents'],
        'platformEnabled' => platform_is_configured(platform_config($pdo, $config)),
    ]);
}

function admin_delete_custom_api_history(PDO $pdo, array $config): void
{
    require_admin($pdo, $config);
    $payload = read_json();
    $id = preg_replace('/[^\w-]/', '', (string)($payload['id'] ?? ''));
    if ($id === '') {
        throw new HttpError('缺少要删除的配置记录', 400, 'custom_api_history_id_required');
    }

    $settings = read_admin_setting_json($pdo, $config, 'custom_api_debug');
    $history = normalize_custom_api_history($settings['history'] ?? []);
    $history = array_values(array_filter($history, static fn($item) => (string)($item['id'] ?? '') !== $id));
    write_admin_setting_json($pdo, $config, 'custom_api_debug', [
        'current' => normalize_custom_api_config($settings['current'] ?? []),
        'history' => $history,
    ]);
    $global = public_global_platform_config(platform_config($pdo, $config));
    json_response([
        'ok' => true,
        'history' => $history,
        'global' => $global,
    ]);
}

function admin_proxy_image(PDO $pdo, array $config): void
{
    require_admin($pdo, $config);
    $payload = read_json();
    $endpoint = sanitize_custom_api_url((string)($payload['endpoint'] ?? ''));
    $request = is_array($payload['request'] ?? null) ? $payload['request'] : [];
    if ($endpoint === '') {
        throw new HttpError('API URL 不能为空', 400, 'invalid_proxy_endpoint');
    }

    try {
        $upstream = call_proxy_upstream($endpoint, $request);
    } catch (Throwable $error) {
        throw new HttpError($error->getMessage() ?: '上游接口请求失败', 502, 'admin_proxy_failed');
    }

    $contentType = upstream_content_type((string)($upstream['headers'] ?? '')) ?: 'application/json; charset=utf-8';
    http_response_code((int)($upstream['status'] ?? 200));
    header('Content-Type: ' . $contentType);
    header('Cache-Control: no-store');
    echo (string)($upstream['body'] ?? '');
    exit;
}

function upstream_content_type(string $headers): string
{
    if (preg_match('/^Content-Type:\s*([^\r\n]+)/mi', $headers, $matches)) {
        return trim($matches[1]);
    }
    return '';
}

function ensure_admin_settings_table(PDO $pdo): bool
{
    try {
        $pdo->exec(
            "CREATE TABLE IF NOT EXISTS admin_settings (
              setting_key VARCHAR(80) NOT NULL,
              setting_value MEDIUMTEXT NOT NULL,
              updated_at DATETIME NOT NULL,
              PRIMARY KEY (setting_key)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
        );
        return true;
    } catch (Throwable $error) {
        return false;
    }
}

function admin_setting_payload_is_encrypted(string $value): bool
{
    return starts_with(trim($value), 'enc:v1:');
}

function encode_admin_setting_payload(array $config, string $key, string $json): string
{
    if (!function_exists('openssl_encrypt')) {
        throw new HttpError('服务器 OpenSSL 不可用，无法加密保存 API 配置', 500, 'settings_encryption_unavailable');
    }
    $iv = random_bytes(12);
    $tag = '';
    $ciphertext = openssl_encrypt(
        $json,
        'aes-256-gcm',
        admin_setting_encryption_key($config, $key),
        OPENSSL_RAW_DATA,
        $iv,
        $tag,
        admin_setting_encryption_aad($key)
    );
    if ($ciphertext === false || $tag === '') {
        throw new HttpError('API 配置加密失败', 500, 'settings_encrypt_failed');
    }
    $payload = json_encode([
        'iv' => base64_encode($iv),
        'tag' => base64_encode($tag),
        'data' => base64_encode($ciphertext),
    ], JSON_UNESCAPED_SLASHES);
    if ($payload === false) {
        throw new HttpError('API 配置加密封装失败', 500, 'settings_encrypt_encode_failed');
    }
    return 'enc:v1:' . base64_encode($payload);
}

function decode_admin_setting_payload(array $config, string $key, string $stored): string
{
    $stored = trim($stored);
    if (!admin_setting_payload_is_encrypted($stored)) {
        return $stored;
    }
    if (!function_exists('openssl_decrypt')) {
        return '';
    }
    $encoded = substr($stored, strlen('enc:v1:'));
    $json = base64_decode($encoded, true);
    $payload = is_string($json) ? json_decode($json, true) : null;
    if (!is_array($payload)) {
        return '';
    }
    $iv = base64_decode((string)($payload['iv'] ?? ''), true);
    $tag = base64_decode((string)($payload['tag'] ?? ''), true);
    $ciphertext = base64_decode((string)($payload['data'] ?? ''), true);
    if (!is_string($iv) || !is_string($tag) || !is_string($ciphertext) || $iv === '' || $tag === '') {
        return '';
    }
    try {
        $plain = openssl_decrypt(
            $ciphertext,
            'aes-256-gcm',
            admin_setting_encryption_key($config, $key),
            OPENSSL_RAW_DATA,
            $iv,
            $tag,
            admin_setting_encryption_aad($key)
        );
    } catch (Throwable $error) {
        return '';
    }
    return is_string($plain) ? $plain : '';
}

function admin_setting_encryption_key(array $config, string $key): string
{
    $hex = secret_hash($config, 'admin-setting-encryption', $key);
    $binary = hex2bin($hex);
    if (!is_string($binary) || strlen($binary) !== 32) {
        throw new HttpError('API 配置加密密钥不可用', 500, 'settings_key_failed');
    }
    return $binary;
}

function admin_setting_encryption_aad(string $key): string
{
    return 'api2image-admin-setting:' . $key;
}

function delete_admin_setting_logs(PDO $pdo, string $key): void
{
    try {
        $stmt = $pdo->prepare("DELETE FROM admin_logs WHERE action = 'admin_setting' AND target_id = ?");
        $stmt->execute([$key]);
    } catch (Throwable $error) {
        // Best-effort cleanup only; encrypted admin_settings remains the source of truth.
    }
}

function read_admin_setting_json(PDO $pdo, array $config, string $key): array
{
    $raw = '';
    if (ensure_admin_settings_table($pdo)) {
        try {
            $stmt = $pdo->prepare('SELECT setting_value FROM admin_settings WHERE setting_key = ? LIMIT 1');
            $stmt->execute([$key]);
            $raw = (string)($stmt->fetchColumn() ?: '');
        } catch (Throwable $error) {
            $raw = '';
        }
    }
    if ($raw === '') {
        $raw = read_admin_setting_log($pdo, $key);
    }
    if ($raw === '') {
        return [];
    }
    $wasEncrypted = admin_setting_payload_is_encrypted($raw);
    $raw = decode_admin_setting_payload($config, $key, $raw);
    if ($raw === '') {
        return [];
    }
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        return [];
    }
    if (!$wasEncrypted) {
        try {
            write_admin_setting_json($pdo, $config, $key, $decoded);
        } catch (Throwable $error) {
            // Keep serving the already-read legacy plaintext value; the next save will encrypt it.
        }
    }
    return $decoded;
}

function write_admin_setting_json(PDO $pdo, array $config, string $key, array $value): void
{
    $json = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        throw new HttpError('配置 JSON 编码失败', 500, 'setting_encode_failed');
    }
    $stored = encode_admin_setting_payload($config, $key, $json);
    if (ensure_admin_settings_table($pdo)) {
        try {
            $stmt = $pdo->prepare(
                'INSERT INTO admin_settings (setting_key, setting_value, updated_at)
                 VALUES (?, ?, UTC_TIMESTAMP())
                 ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = UTC_TIMESTAMP()'
            );
            $stmt->execute([$key, $stored]);
            delete_admin_setting_logs($pdo, $key);
            return;
        } catch (Throwable $error) {
            // Fall through to admin_logs for virtual hosts that restrict table writes.
        }
    }
    write_admin_setting_log($pdo, $key, $stored);
}

function read_admin_setting_log(PDO $pdo, string $key): string
{
    try {
        $stmt = $pdo->prepare("SELECT detail FROM admin_logs WHERE action = 'admin_setting' AND target_id = ? ORDER BY id DESC LIMIT 1");
        $stmt->execute([$key]);
        return (string)($stmt->fetchColumn() ?: '');
    } catch (Throwable $error) {
        return '';
    }
}

function write_admin_setting_log(PDO $pdo, string $key, string $json): void
{
    try {
        $stmt = $pdo->prepare(
            "INSERT INTO admin_logs (action, target_id, detail, created_at)
             VALUES ('admin_setting', ?, ?, UTC_TIMESTAMP())"
        );
        $stmt->execute([$key, $json]);
    } catch (Throwable $error) {
        throw new HttpError('数据库无法保存站长配置，请导入最新版 schema.sql 或检查数据库写入权限', 500, 'setting_save_failed');
    }
}

function normalize_custom_api_config(array $value): array
{
    $requestFormat = (string)($value['requestFormat'] ?? 'openai');
    if (!in_array($requestFormat, ['openai', 'json'], true)) {
        $requestFormat = 'openai';
    }
    $textEndpoint = sanitize_custom_api_url((string)($value['textEndpoint'] ?? ''));
    $editEndpoint = sanitize_custom_api_url((string)($value['editEndpoint'] ?? ''));
    $transportMode = (string)($value['transportMode'] ?? 'proxy');
    if (!in_array($transportMode, ['direct', 'proxy'], true)) {
        $transportMode = 'proxy';
    }
    $legacyPrice = custom_api_price_cents($value['priceCents'] ?? $value['price_cents'] ?? 10);
    $modelName = custom_api_model_name((string)($value['modelName'] ?? $value['model_name'] ?? 'gpt-image-2'));
    $modelOptions = custom_api_model_options($value['modelOptions'] ?? $value['model_options'] ?? [], $modelName, $legacyPrice);
    $modelName = (string)($modelOptions[0]['name'] ?? $modelName);
    return [
        'id' => preg_replace('/[^\w-]/', '', (string)($value['id'] ?? '')),
        'enabled' => (bool)($value['enabled'] ?? false),
        'title' => trim((string)($value['title'] ?? '')),
        'textEndpoint' => $textEndpoint,
        'editEndpoint' => $editEndpoint,
        'apiKey' => trim((string)($value['apiKey'] ?? '')),
        'requestFormat' => $requestFormat,
        'transportMode' => $transportMode,
        'customTemplate' => custom_api_template((string)($value['customTemplate'] ?? '')),
        'modelName' => $modelName,
        'modelOptions' => $modelOptions,
        'priceCents' => (int)($modelOptions[0]['priceCents'] ?? $legacyPrice),
        'updatedAt' => (int)($value['updatedAt'] ?? 0),
    ];
}

function custom_api_price_cents($value): int
{
    $price = (int)$value;
    if ($price < 1) {
        $price = 10;
    }
    return min(100000, $price);
}

function normalize_custom_api_history($value): array
{
    if (!is_array($value)) {
        return [];
    }
    $items = [];
    $usedTitles = [];
    $nextNumber = 1;
    foreach ($value as $item) {
        if (!is_array($item)) {
            continue;
        }
        $clean = normalize_custom_api_config($item);
        $clean['enabled'] = false;
        if ($clean['id'] === '') {
            $clean['id'] = random_token(8);
        }
        $title = custom_api_existing_display_name($clean['title']);
        if ($title === '' || isset($usedTitles[$title])) {
            while (isset($usedTitles['站点配置' . $nextNumber])) {
                $nextNumber++;
            }
            $title = '站点配置' . $nextNumber;
        }
        $clean['title'] = $title;
        $usedTitles[$title] = true;
        $number = custom_api_display_name_number($title);
        if ($number >= $nextNumber) {
            $nextNumber = $number + 1;
        }
        if ($clean['textEndpoint'] !== '' || $clean['editEndpoint'] !== '' || $clean['apiKey'] !== '') {
            $items[] = $clean;
        }
    }
    return array_slice($items, 0, 12);
}

function sanitize_custom_api_url(string $url): string
{
    $url = trim($url);
    if ($url === '') {
        return '';
    }
    if (!preg_match('#^https?://#i', $url) || strlen($url) > 500) {
        throw new HttpError('API URL 必须是 http 或 https 地址', 400, 'invalid_custom_api_url');
    }
    return $url;
}

function custom_api_template(string $template): string
{
    $template = trim($template);
    if ($template === '') {
        return '';
    }
    if (strlen($template) > 20000) {
        throw new HttpError('自定义 JSON 模板过长', 400, 'custom_template_too_long');
    }
    return $template;
}

function custom_api_model_name(string $modelName): string
{
    $modelName = preg_replace('/[\x00-\x1F\x7F]+/', '', $modelName) ?? '';
    $modelName = preg_replace('/\s+/', '', trim($modelName)) ?? '';
    if ($modelName === '') {
        return 'gpt-image-2';
    }
    return strlen($modelName) > 120 ? substr($modelName, 0, 120) : $modelName;
}

function custom_api_model_display_name(string $displayName, string $modelName): string
{
    $displayName = preg_replace('/[\x00-\x1F\x7F]+/', '', $displayName) ?? '';
    $displayName = trim(preg_replace('/\s+/u', ' ', $displayName) ?? '');
    if ($displayName === '') {
        return $modelName;
    }
    if (function_exists('mb_substr')) {
        return mb_substr($displayName, 0, 36);
    }
    return strlen($displayName) > 108 ? substr($displayName, 0, 108) : $displayName;
}

function custom_api_default_model_price_cents(string $modelName): int
{
    return stripos($modelName, 'pro') !== false ? 30 : 10;
}

function custom_api_model_price_cents($value, string $modelName = '', int $fallbackPrice = 10): int
{
    if (is_string($value) && is_numeric($value) && strpos($value, '.') !== false && (float)$value > 0 && (float)$value < 1000) {
        $value = (int)round(((float)$value) * 100);
    }
    $price = (int)$value;
    if ($price < 1) {
        $price = stripos($modelName, 'pro') !== false ? custom_api_default_model_price_cents($modelName) : ($fallbackPrice > 0 ? $fallbackPrice : custom_api_default_model_price_cents($modelName));
    }
    return min(100000, $price);
}

function custom_api_model_options($value, string $fallbackModel = 'gpt-image-2', int $fallbackPrice = 10): array
{
    $source = is_array($value) ? $value : [];
    $items = [];
    $seen = [];
    foreach ($source as $item) {
        $name = is_array($item)
            ? custom_api_model_name((string)($item['name'] ?? $item['modelName'] ?? $item['value'] ?? ''))
            : custom_api_model_name((string)$item);
        if ($name === '' || isset($seen[$name])) {
            continue;
        }
        $seen[$name] = true;
        $tiers = is_array($item) ? ($item['tiers'] ?? $item['resolutions'] ?? $item['resolutionTiers'] ?? []) : [];
        $displayName = is_array($item) ? custom_api_model_display_name((string)($item['displayName'] ?? $item['display_name'] ?? $item['label'] ?? $item['title'] ?? ''), $name) : $name;
        if (is_array($item) && array_key_exists('priceYuan', $item) && (float)$item['priceYuan'] > 0) {
            $priceCents = custom_api_model_price_cents((int)round(((float)$item['priceYuan']) * 100), $name, $fallbackPrice);
        } else {
            $priceCents = is_array($item) ? custom_api_model_price_cents($item['priceCents'] ?? $item['price_cents'] ?? $item['price'] ?? null, $name, $fallbackPrice) : custom_api_default_model_price_cents($name);
        }
        $items[] = [
            'name' => $name,
            'displayName' => $displayName,
            'tiers' => custom_api_resolution_tiers($tiers, $name),
            'priceCents' => $priceCents,
        ];
        if (count($items) >= 12) {
            break;
        }
    }
    if ($items) {
        return $items;
    }
    $fallback = custom_api_model_name($fallbackModel);
    return [[
        'name' => $fallback,
        'displayName' => $fallback,
        'tiers' => custom_api_resolution_tiers([], $fallback),
        'priceCents' => custom_api_model_price_cents(null, $fallback, $fallbackPrice),
    ]];
}

function custom_api_resolution_tiers($value, string $modelName = ''): array
{
    $source = is_array($value) ? $value : preg_split('/[,\s|\/]+/', (string)$value);
    $allowed = ['1K', '2K', '4K'];
    $tiers = [];
    foreach ($source ?: [] as $item) {
        $tier = strtoupper(trim((string)$item));
        if (in_array($tier, $allowed, true) && !in_array($tier, $tiers, true)) {
            $tiers[] = $tier;
        }
    }
    if ($tiers) {
        return $tiers;
    }
    return stripos($modelName, 'pro') !== false ? ['1K', '2K', '4K'] : ['1K'];
}

function select_platform_model(array $platform, string $requestedModel): string
{
    $option = select_platform_model_option($platform, $requestedModel);
    return (string)($option['name'] ?? custom_api_model_name((string)($platform['model_name'] ?? 'gpt-image-2')));
}

function select_platform_model_option(array $platform, string $requestedModel): array
{
    $requested = custom_api_model_name($requestedModel);
    $options = custom_api_model_options($platform['model_options'] ?? [], (string)($platform['model_name'] ?? 'gpt-image-2'), (int)($platform['price_cents'] ?? 10));
    foreach ($options as $item) {
        if ((string)($item['name'] ?? '') === $requested) {
            return $item;
        }
    }
    return $options[0] ?? [
        'name' => custom_api_model_name((string)($platform['model_name'] ?? 'gpt-image-2')),
        'displayName' => custom_api_model_name((string)($platform['model_name'] ?? 'gpt-image-2')),
        'tiers' => ['1K'],
        'priceCents' => (int)($platform['price_cents'] ?? 10),
    ];
}

function is_gpt_image_2_model(string $modelName): bool
{
    return preg_match('/^gpt-image-2(?:pro)?(?:$|[^a-z0-9])/i', trim($modelName)) === 1;
}

function custom_api_config_title(array $item): string
{
    return custom_api_safe_display_name((string)($item['title'] ?? ''), 1);
}

function custom_api_prepare_history_snapshot(array $snapshot, array $history): array
{
    $key = custom_api_history_key($snapshot);
    foreach ($history as $item) {
        if (custom_api_history_key($item) === $key) {
            $snapshot['id'] = (string)($item['id'] ?? $snapshot['id'] ?? random_token(8));
            $snapshot['title'] = custom_api_safe_display_name((string)($item['title'] ?? ''), 1);
            return $snapshot;
        }
    }
    $snapshot['title'] = custom_api_safe_display_name('', custom_api_next_display_number($history));
    return $snapshot;
}

function custom_api_safe_display_name(string $title, int $fallbackNumber = 1): string
{
    $existing = custom_api_existing_display_name($title);
    if ($existing !== '') {
        return $existing;
    }
    return '站点配置' . max(1, $fallbackNumber);
}

function custom_api_existing_display_name(string $title): string
{
    $title = trim($title);
    return preg_match('/^站点配置[1-9][0-9]*$/u', $title) ? $title : '';
}

function custom_api_display_name_number(string $title): int
{
    if (preg_match('/^站点配置([1-9][0-9]*)$/u', trim($title), $matches)) {
        return (int)$matches[1];
    }
    return 0;
}

function custom_api_next_display_number(array $history): int
{
    $max = 0;
    foreach ($history as $item) {
        $max = max($max, custom_api_display_name_number((string)($item['title'] ?? '')));
    }
    return $max + 1;
}

function custom_api_history_key(array $item): string
{
    return implode('|', [
        (string)($item['textEndpoint'] ?? ''),
        (string)($item['editEndpoint'] ?? ''),
        hash('sha256', (string)($item['apiKey'] ?? '')),
        (string)($item['requestFormat'] ?? 'openai'),
        (string)($item['transportMode'] ?? 'direct'),
        (string)($item['modelName'] ?? 'gpt-image-2'),
        json_encode($item['modelOptions'] ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: '',
        (string)($item['priceCents'] ?? 10),
    ]);
}

function require_admin(PDO $pdo, array $config): void
{
    $expected = trim((string)$config['security']['admin_password']);
    $provided = trim((string)($_SERVER['HTTP_X_ADMIN_PASSWORD'] ?? ''));
    if ($expected === '') {
        throw new HttpError('管理员密码不正确', 401, 'admin_required');
    }
    $locked = admin_password_locked_seconds($pdo, $config);
    if ($locked > 0) {
        throw new HttpError('管理员密码连续错误 3 次，请 ' . $locked . ' 秒后再试', 429, 'admin_password_locked');
    }
    if ($provided !== '' && hash_equals($expected, $provided)) {
        clear_admin_password_failures($pdo, $config);
        return;
    }
    $retryAfter = register_admin_password_failure($pdo, $config);
    if ($retryAfter > 0) {
        throw new HttpError('管理员密码连续错误 3 次，请 ' . $retryAfter . ' 秒后再试', 429, 'admin_password_locked');
    }
    throw new HttpError('管理员密码不正确', 401, 'admin_required');
}

function make_redeem_code(): string
{
    $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $out = '';
    for ($i = 0; $i < 16; $i += 1) {
        $out .= $alphabet[random_int(0, strlen($alphabet) - 1)];
    }
    return 'A2I-' . substr($out, 0, 4) . '-' . substr($out, 4, 4) . '-' . substr($out, 8, 4) . '-' . substr($out, 12, 4);
}

function mask_code(string $code): string
{
    return strlen($code) <= 10 ? $code : substr($code, 0, 7) . '...' . substr($code, -6);
}

function find_user(PDO $pdo, int $id): array
{
    $stmt = $pdo->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    return $stmt->fetch() ?: [];
}

function infer_edit_endpoint(string $textEndpoint): string
{
    return preg_replace('#/images/generations/?(\?.*)?$#i', '/images/edits$1', $textEndpoint) ?: '';
}

function starts_with(string $haystack, string $needle): bool
{
    return $needle === '' || substr($haystack, 0, strlen($needle)) === $needle;
}

function is_secret_configured(array $config): bool
{
    $secret = (string)($config['security']['secret'] ?? '');
    return $secret !== '' && $secret !== 'CHANGE_ME_TO_A_LONG_RANDOM_STRING' && $secret !== 'PASTE_LONG_RANDOM_SECRET';
}
