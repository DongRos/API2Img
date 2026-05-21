<?php

function load_config(): array
{
    $base = require __DIR__ . '/../config/config.example.php';
    $localPath = __DIR__ . '/../config/config.local.php';
    if (!is_file($localPath)) {
        return $base;
    }
    $local = require $localPath;
    return array_replace_recursive($base, is_array($local) ? $local : []);
}

function pdo(array $config): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    $db = $config['db'];
    $charset = $db['charset'] ?: 'utf8mb4';
    $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=%s', $db['host'], (int)$db['port'], $db['database'], $charset);
    $pdo = new PDO($dsn, $db['username'], $db['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    return $pdo;
}

function now_sql(): string
{
    return gmdate('Y-m-d H:i:s');
}

function utc_sql_age_seconds(string $value): int
{
    $value = trim($value);
    if ($value === '') {
        return PHP_INT_MAX;
    }
    $date = DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $value, new DateTimeZone('UTC'));
    if (!$date) {
        $timestamp = strtotime($value . ' UTC');
        return $timestamp ? max(0, time() - $timestamp) : PHP_INT_MAX;
    }
    return max(0, time() - $date->getTimestamp());
}

function utc_sql_timestamp_ms(string $value): int
{
    $value = trim($value);
    if ($value === '') {
        return 0;
    }
    $date = DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $value, new DateTimeZone('UTC'));
    if (!$date) {
        $timestamp = strtotime($value . ' UTC');
        return $timestamp ? (int)$timestamp * 1000 : 0;
    }
    return (int)$date->getTimestamp() * 1000;
}

function json_response(array $payload, int $status = 200, array $headers = []): void
{
    discard_accidental_output();
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    foreach ($headers as $name => $value) {
        header($name . ': ' . $value);
    }
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

function discard_accidental_output(): void
{
    if (ob_get_level() > 0 && ob_get_length() > 0) {
        ob_clean();
    }
}

function error_response(string $message, int $status = 400, string $code = ''): void
{
    $error = ['message' => $message];
    if ($code !== '') {
        $error['code'] = $code;
    }
    json_response(['ok' => false, 'error' => $error], $status);
}

function read_json(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }
    $payload = json_decode($raw, true);
    if (!is_array($payload)) {
        throw new HttpError('请求 JSON 格式不正确', 400, 'invalid_json');
    }
    return $payload;
}

function normalize_email(string $email): string
{
    $email = strtolower(trim($email));
    if ($email === '' || strlen($email) > 254 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return '';
    }
    return $email;
}

function normalize_code(string $code): string
{
    $code = strtoupper(trim($code));
    $code = preg_replace('/\s+/', '', $code);
    $code = preg_replace('/[^\w-]/', '', $code);
    return $code ?: '';
}

function normalize_request_id(string $requestId): string
{
    $requestId = preg_replace('/[^\w-]/', '', trim($requestId));
    return substr($requestId ?: '', 0, 80);
}

function secret_hash(array $config, string $scope, string $value): string
{
    $secret = (string)($config['security']['secret'] ?? '');
    if ($secret === '' || $secret === 'CHANGE_ME_TO_A_LONG_RANDOM_STRING' || $secret === 'PASTE_LONG_RANDOM_SECRET') {
        throw new HttpError('服务端安全密钥尚未配置', 500, 'server_secret_not_configured');
    }
    return hash_hmac('sha256', $scope . ':' . $value, $secret);
}

function random_token(int $bytes = 32): string
{
    return rtrim(strtr(base64_encode(random_bytes($bytes)), '+/', '-_'), '=');
}

function random_numeric_code(): string
{
    return str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
}

function client_ip(): string
{
    $candidates = [
        $_SERVER['HTTP_CF_CONNECTING_IP'] ?? '',
        $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '',
        $_SERVER['REMOTE_ADDR'] ?? '',
    ];
    foreach ($candidates as $candidate) {
        $ip = trim(explode(',', $candidate)[0]);
        if ($ip !== '') {
            return $ip;
        }
    }
    return 'unknown';
}

function set_session_cookie(array $config, string $token, int $maxAgeSeconds): void
{
    $params = [
        'expires' => time() + $maxAgeSeconds,
        'path' => '/',
        'secure' => (bool)$config['app']['secure_cookies'],
        'httponly' => true,
        'samesite' => (string)($config['app']['cookie_samesite'] ?? 'Lax'),
    ];
    $domain = trim((string)($config['app']['cookie_domain'] ?? ''));
    if ($domain !== '') {
        $params['domain'] = $domain;
    }
    setcookie('api2image_session', $token, $params);
    if (is_proxy_request()) {
        header('X-Api2Image-Set-Session: ' . $token);
        header('X-Api2Image-Session-Max-Age: ' . (string)$maxAgeSeconds);
    }
}

function clear_session_cookie(array $config): void
{
    $params = [
        'expires' => time() - 3600,
        'path' => '/',
        'secure' => (bool)$config['app']['secure_cookies'],
        'httponly' => true,
        'samesite' => (string)($config['app']['cookie_samesite'] ?? 'Lax'),
    ];
    $domain = trim((string)($config['app']['cookie_domain'] ?? ''));
    if ($domain !== '') {
        $params['domain'] = $domain;
    }
    setcookie('api2image_session', '', $params);
    if (is_proxy_request()) {
        header('X-Api2Image-Clear-Session: 1');
    }
}

function is_proxy_request(): bool
{
    return trim((string)($_SERVER['HTTP_X_FORWARDED_HOST'] ?? '')) !== '';
}

function current_session_token(): string
{
    $candidates = [
        $_SERVER['HTTP_X_API2IMAGE_SESSION'] ?? '',
        $_COOKIE['api2image_session'] ?? '',
    ];
    foreach ($candidates as $candidate) {
        $token = trim((string)$candidate);
        if ($token !== '') {
            return $token;
        }
    }
    return '';
}

function current_user(PDO $pdo, array $config): ?array
{
    $token = current_session_token();
    if ($token === '') {
        return null;
    }
    $tokenHash = secret_hash($config, 'session', $token);
    $stmt = $pdo->prepare(
        "SELECT u.*, s.id AS session_id
         FROM sessions s
         JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = ?
           AND s.revoked_at IS NULL
           AND s.expires_at > UTC_TIMESTAMP()
           AND u.status = 'active'
         LIMIT 1"
    );
    $stmt->execute([$tokenHash]);
    $user = $stmt->fetch();
    if (!$user) {
        return null;
    }
    $touch = $pdo->prepare('UPDATE sessions SET last_seen_at = UTC_TIMESTAMP() WHERE id = ?');
    $touch->execute([(int)$user['session_id']]);
    return $user;
}

function require_user(PDO $pdo, array $config): array
{
    $user = current_user($pdo, $config);
    if (!$user) {
        throw new HttpError('请先登录', 401, 'auth_required');
    }
    return $user;
}

function public_user(array $user): array
{
    return [
        'id' => (int)$user['id'],
        'email' => (string)$user['email'],
        'balanceCents' => (int)$user['balance_cents'],
        'status' => (string)$user['status'],
        'createdAt' => utc_sql_timestamp_ms((string)$user['created_at']),
        'lastLoginAt' => $user['last_login_at'] ? utc_sql_timestamp_ms((string)$user['last_login_at']) : 0,
    ];
}

function enforce_rate_limit(PDO $pdo, array $config, string $scope, string $key, int $limit, int $windowSeconds): void
{
    $keyHash = secret_hash($config, 'rate:' . $scope, $key);
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare('SELECT * FROM rate_limits WHERE scope = ? AND key_hash = ? FOR UPDATE');
        $stmt->execute([$scope, $keyHash]);
        $row = $stmt->fetch();
        if (!$row) {
            $insert = $pdo->prepare('INSERT INTO rate_limits (scope, key_hash, count, window_start_at) VALUES (?, ?, 1, UTC_TIMESTAMP())');
            $insert->execute([$scope, $keyHash]);
            $pdo->commit();
            return;
        }
        $elapsed = utc_sql_age_seconds((string)$row['window_start_at']);
        if ($elapsed >= $windowSeconds) {
            $update = $pdo->prepare('UPDATE rate_limits SET count = 1, window_start_at = UTC_TIMESTAMP() WHERE id = ?');
            $update->execute([(int)$row['id']]);
            $pdo->commit();
            return;
        }
        if ((int)$row['count'] >= $limit) {
            $pdo->commit();
            throw new HttpError('操作太频繁，请稍后再试', 429, 'rate_limited');
        }
        $update = $pdo->prepare('UPDATE rate_limits SET count = count + 1 WHERE id = ?');
        $update->execute([(int)$row['id']]);
        $pdo->commit();
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $error;
    }
}

function admin_password_failure_key(array $config): string
{
    return secret_hash($config, 'rate:admin_password', client_ip());
}

function admin_password_locked_seconds(PDO $pdo, array $config): int
{
    $keyHash = admin_password_failure_key($config);
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare('SELECT * FROM rate_limits WHERE scope = ? AND key_hash = ? FOR UPDATE');
        $stmt->execute(['admin_password', $keyHash]);
        $row = $stmt->fetch();
        if (!$row) {
            $pdo->commit();
            return 0;
        }
        $elapsed = utc_sql_age_seconds((string)$row['window_start_at']);
        if ($elapsed >= 30 || (int)$row['count'] < 3) {
            $pdo->commit();
            return 0;
        }
        $pdo->commit();
        return max(1, 30 - $elapsed);
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $error;
    }
}

function register_admin_password_failure(PDO $pdo, array $config): int
{
    $keyHash = admin_password_failure_key($config);
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare('SELECT * FROM rate_limits WHERE scope = ? AND key_hash = ? FOR UPDATE');
        $stmt->execute(['admin_password', $keyHash]);
        $row = $stmt->fetch();
        if (!$row) {
            $insert = $pdo->prepare('INSERT INTO rate_limits (scope, key_hash, count, window_start_at) VALUES (?, ?, 1, UTC_TIMESTAMP())');
            $insert->execute(['admin_password', $keyHash]);
            $pdo->commit();
            return 0;
        }

        $elapsed = utc_sql_age_seconds((string)$row['window_start_at']);
        if ($elapsed >= 30) {
            $update = $pdo->prepare('UPDATE rate_limits SET count = 1, window_start_at = UTC_TIMESTAMP() WHERE id = ?');
            $update->execute([(int)$row['id']]);
            $pdo->commit();
            return 0;
        }

        $count = (int)$row['count'];
        if ($count >= 3) {
            $pdo->commit();
            return max(1, 30 - $elapsed);
        }

        $nextCount = $count + 1;
        $update = $pdo->prepare('UPDATE rate_limits SET count = ?, window_start_at = CASE WHEN ? >= 3 THEN UTC_TIMESTAMP() ELSE window_start_at END WHERE id = ?');
        $update->execute([$nextCount, $nextCount, (int)$row['id']]);
        $pdo->commit();
        return $nextCount >= 3 ? 30 : 0;
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $error;
    }
}

function clear_admin_password_failures(PDO $pdo, array $config): void
{
    $keyHash = admin_password_failure_key($config);
    $stmt = $pdo->prepare('DELETE FROM rate_limits WHERE scope = ? AND key_hash = ?');
    $stmt->execute(['admin_password', $keyHash]);
}

function send_login_mail(array $config, string $email, string $code): void
{
    $subject = 'API2image 登录验证码';
    $body = "你的 API2image 登录验证码是：{$code}\n\n验证码 10 分钟内有效。若不是你本人操作，请忽略这封邮件。";
    $smtpHost = trim((string)$config['mail']['smtp_host']);
    $smtpError = null;
    if ($smtpHost !== '') {
        try {
            smtp_send($config, $email, $subject, $body);
            return;
        } catch (HttpError $error) {
            $smtpError = $error;
            log_mail_error($config, $error->getMessage());
        } catch (Throwable $error) {
            $smtpError = $error;
            log_mail_error($config, $error->getMessage());
        }
    }

    if (send_php_mail_fallback($config, $email, $subject, $body)) {
        if ($smtpError) {
            log_mail_error($config, 'SMTP failed, PHP mail fallback succeeded: ' . $smtpError->getMessage());
        }
        return;
    }

    if ($smtpError) {
        throw new HttpError('验证码邮件发送失败，请检查 SMTP 配置', 500, 'mail_failed');
    }
    throw new HttpError('验证码邮件发送失败，请稍后重试', 500, 'mail_failed');
}

function send_php_mail_fallback(array $config, string $email, string $subject, string $body): bool
{
    $headers = [
        'From: ' . mail_from_header($config),
        'Content-Type: text/plain; charset=UTF-8',
    ];
    return @mail($email, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, implode("\r\n", $headers));
}

function mail_from_header(array $config): string
{
    $name = trim((string)$config['mail']['from_name']);
    $email = trim((string)$config['mail']['from_email']);
    if ($name === '') {
        return $email;
    }
    return '=?UTF-8?B?' . base64_encode($name) . '?= <' . $email . '>';
}

function smtp_send(array $config, string $to, string $subject, string $body): void
{
    $mail = $config['mail'];
    $host = (string)$mail['smtp_host'];
    $port = (int)$mail['smtp_port'];
    $secure = strtolower((string)$mail['smtp_secure']);
    $target = ($secure === 'ssl' ? 'ssl://' : '') . $host;
    $timeout = max(5, min(20, (int)($mail['smtp_timeout_seconds'] ?? 8)));
    $socket = @stream_socket_client($target . ':' . $port, $errno, $errstr, $timeout, STREAM_CLIENT_CONNECT);
    if (!$socket) {
        log_mail_error($config, "connect failed: {$errno} {$errstr}");
        throw new HttpError('验证码邮件发送失败，请检查 SMTP 配置', 500, 'mail_failed');
    }
    stream_set_timeout($socket, $timeout);
    smtp_expect($socket, [220]);
    smtp_cmd($socket, 'EHLO api2image.top', [250]);
    if ($secure === 'tls') {
        smtp_cmd($socket, 'STARTTLS', [220]);
        stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
        smtp_cmd($socket, 'EHLO api2image.top', [250]);
    }
    smtp_cmd($socket, 'AUTH LOGIN', [334]);
    smtp_cmd($socket, base64_encode((string)$mail['smtp_username']), [334]);
    smtp_cmd($socket, base64_encode((string)$mail['smtp_password']), [235]);
    $from = (string)$mail['from_email'];
    smtp_cmd($socket, 'MAIL FROM:<' . $from . '>', [250]);
    smtp_cmd($socket, 'RCPT TO:<' . $to . '>', [250, 251]);
    smtp_cmd($socket, 'DATA', [354]);
    $headers = [
        'From: ' . mail_from_header($config),
        'To: <' . $to . '>',
        'Subject: =?UTF-8?B?' . base64_encode($subject) . '?=',
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
    ];
    fwrite($socket, implode("\r\n", $headers) . "\r\n\r\n" . str_replace("\n.", "\n..", $body) . "\r\n.\r\n");
    smtp_expect($socket, [250]);
    smtp_cmd($socket, 'QUIT', [221]);
    fclose($socket);
}

function smtp_cmd($socket, string $command, array $expected): string
{
    fwrite($socket, $command . "\r\n");
    return smtp_expect($socket, $expected);
}

function smtp_expect($socket, array $expected): string
{
    $response = '';
    while (($line = fgets($socket, 512)) !== false) {
        $response .= $line;
        if (preg_match('/^\d{3}\s/', $line)) {
            break;
        }
    }
    $code = (int)substr($response, 0, 3);
    if (!in_array($code, $expected, true)) {
        throw new RuntimeException('SMTP error: ' . trim($response));
    }
    return $response;
}

function log_mail_error(array $config, string $message): void
{
    $path = (string)($config['mail']['debug_log'] ?? '');
    if ($path === '') {
        return;
    }
    $dir = dirname($path);
    if (!is_dir($dir)) {
        @mkdir($dir, 0775, true);
    }
    @file_put_contents($path, '[' . now_sql() . '] ' . $message . "\n", FILE_APPEND);
}

function fetch_url(string $url, array $options): array
{
    if (!function_exists('curl_init')) {
        throw new RuntimeException('PHP curl extension is not enabled');
    }
    $headers = $options['headers'] ?? [];
    $body = $options['body'] ?? '';
    $method = $options['method'] ?? 'POST';
    $headerLines = [];
    foreach ($headers as $name => $value) {
        $headerLines[] = $name . ': ' . $value;
    }
    $strict = curl_request_once($url, $method, $headerLines, $body, true);
    if ($strict['ok']) {
        return $strict['response'];
    }
    if (!is_ssl_certificate_error((string)($strict['error'] ?? ''))) {
        throw new RuntimeException((string)($strict['error'] ?? 'upstream request failed'));
    }
    $relaxed = curl_request_once($url, $method, $headerLines, $body, false);
    if ($relaxed['ok']) {
        return $relaxed['response'];
    }
    throw new RuntimeException((string)($relaxed['error'] ?? $strict['error'] ?? 'upstream request failed'));
}

function curl_request_once(string $url, string $method, array $headerLines, $body, bool $strictTls): array
{
    $ch = curl_init($url);
    $options = [
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER => true,
        CURLOPT_HTTPHEADER => $headerLines,
        CURLOPT_POSTFIELDS => $body,
        CURLOPT_CONNECTTIMEOUT => 30,
        CURLOPT_TIMEOUT => 300,
        CURLOPT_ENCODING => '',
        CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_SSL_VERIFYPEER => $strictTls,
        CURLOPT_SSL_VERIFYHOST => $strictTls ? 2 : 0,
    ];
    if (defined('CURLOPT_TCP_KEEPALIVE')) {
        $options[CURLOPT_TCP_KEEPALIVE] = 1;
    }
    if ($strictTls) {
        $caBundle = resolve_curl_ca_bundle();
        if ($caBundle['caInfo'] !== '') {
            $options[CURLOPT_CAINFO] = $caBundle['caInfo'];
        } elseif ($caBundle['caPath'] !== '') {
            $options[CURLOPT_CAPATH] = $caBundle['caPath'];
        }
    }
    curl_setopt_array($ch, $options);
    $raw = curl_exec($ch);
    if ($raw === false) {
        $message = curl_error($ch);
        curl_close($ch);
        return ['ok' => false, 'error' => $message ?: 'upstream request failed'];
    }
    $status = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    curl_close($ch);
    return [
        'ok' => true,
        'response' => [
            'status' => (int)$status,
            'headers' => substr($raw, 0, $headerSize),
            'body' => substr($raw, $headerSize),
        ],
    ];
}

function resolve_curl_ca_bundle(): array
{
    $candidates = [];
    foreach ([
        ini_get('curl.cainfo'),
        ini_get('openssl.cafile'),
        ini_get('openssl.capath'),
        getenv('CURL_CA_BUNDLE') ?: '',
        getenv('SSL_CERT_FILE') ?: '',
        getenv('SSL_CERT_DIR') ?: '',
        '/etc/ssl/certs/ca-certificates.crt',
        '/etc/pki/tls/certs/ca-bundle.crt',
        '/etc/ssl/cert.pem',
        '/etc/pki/ca-trust/extracted/pem/tls-ca-bundle.pem',
        '/usr/local/etc/openssl/cert.pem',
    ] as $path) {
        $path = trim((string)$path);
        if ($path !== '') {
            $candidates[] = $path;
        }
    }

    $result = ['caInfo' => '', 'caPath' => ''];
    foreach (array_values(array_unique($candidates)) as $path) {
        if (is_file($path)) {
            $result['caInfo'] = $path;
            break;
        }
        if ($result['caPath'] === '' && is_dir($path)) {
            $result['caPath'] = $path;
        }
    }
    return $result;
}

function is_ssl_certificate_error(string $message): bool
{
    return preg_match('/certificate|issuer|self[- ]signed|x509|ssl certificate|tls.*certificate|certificate key usage inadequate|unable to get local issuer certificate/i', $message) === 1;
}

function data_url_to_temp_file(string $dataUrl, string $fallbackMime = 'image/png'): array
{
    if (!preg_match('/^data:([^;,]+)?(;base64)?,(.*)$/', $dataUrl, $matches)) {
        throw new RuntimeException('invalid image data');
    }
    $mime = $matches[1] ?: $fallbackMime;
    $raw = isset($matches[2]) && $matches[2] === ';base64'
        ? base64_decode($matches[3], true)
        : rawurldecode($matches[3]);
    if ($raw === false || $raw === '') {
        throw new RuntimeException('invalid image data');
    }
    $path = tempnam(sys_get_temp_dir(), 'api2img_');
    if ($path === false) {
        throw new RuntimeException('cannot create temp file');
    }
    file_put_contents($path, $raw);
    return ['path' => $path, 'mime' => $mime];
}

function json_images(array $payload): array
{
    $images = [];
    collect_json_images($payload, $images, 0, '');
    $seen = [];
    $clean = [];
    foreach ($images as $image) {
        $key = json_encode($image, JSON_UNESCAPED_SLASHES);
        if ($key === false || isset($seen[$key])) {
            continue;
        }
        $seen[$key] = true;
        $clean[] = $image;
    }
    return $clean;
}

function collect_json_images($value, array &$images, int $depth, string $keyPath): void
{
    if ($value === null || $depth > 8) {
        return;
    }
    if (is_string($value)) {
        $text = trim($value);
        if ($text === '' || json_value_looks_like_html($text)) {
            return;
        }
        if (($text[0] === '{' || $text[0] === '[') && strlen($text) < 200000) {
            $decoded = json_decode($text, true);
            if (is_array($decoded)) {
                collect_json_images($decoded, $images, $depth + 1, $keyPath);
                return;
            }
        }
        foreach (json_image_sources($text, $keyPath) as $source) {
            $images[] = $source;
        }
        return;
    }
    if (!is_array($value)) {
        return;
    }
    foreach ($value as $key => $nested) {
        $nextPath = $keyPath === '' ? (string)$key : $keyPath . '.' . (string)$key;
        collect_json_images($nested, $images, $depth + 1, $nextPath);
    }
}

function json_image_sources(string $text, string $keyPath): array
{
    $sources = [];
    $imageField = preg_match('/(^|[^a-z0-9])(b64|b64_json|base64|image|image_url|images|img|data|url|result|output|content|asset|assets|file|files|download)($|[^a-z0-9])/i', $keyPath) === 1;

    if (preg_match_all('/data:image\/[a-z0-9.+-]+;base64,[A-Za-z0-9+\/=\r\n]+/i', $text, $matches)) {
        foreach ($matches[0] as $dataUrl) {
            $sources[] = ['url' => preg_replace('/\s+/', '', $dataUrl)];
        }
    }

    if (preg_match_all('/https?:\/\/[^\s"\'<>),]+/i', $text, $matches)) {
        foreach ($matches[0] as $url) {
            $cleanUrl = rtrim($url, ".。");
            if (json_is_likely_image_url($cleanUrl) || ($imageField && !json_is_excluded_image_url($cleanUrl))) {
                $sources[] = ['url' => $cleanUrl];
            }
        }
    }

    if (preg_match_all('/[A-Za-z0-9+\/_-]{220,}={0,2}/', $text, $matches) && ($imageField || json_looks_like_image_base64($matches[0][0] ?? ''))) {
        foreach ($matches[0] as $base64) {
            $sources[] = ['b64_json' => strtr($base64, '-_', '+/')];
        }
    }

    return $sources;
}

function json_value_looks_like_html(string $text): bool
{
    return preg_match('/<!doctype html|<html[\s>]|<head[\s>]|<body[\s>]/i', $text) === 1;
}

function json_is_likely_image_url(string $url): bool
{
    if (json_is_excluded_image_url($url)) {
        return false;
    }
    return preg_match('/\.(png|jpe?g|webp|gif|bmp|avif)(\?|#|$)/i', $url) === 1;
}

function json_is_excluded_image_url(string $url): bool
{
    return preg_match('/logo|favicon|avatar|icon|brand/i', $url) === 1;
}

function json_looks_like_image_base64(string $value): bool
{
    $clean = strtr($value, '-_', '+/');
    return preg_match('/^(iVBORw0KGgo|\/9j\/|R0lGOD|UklGR)/', $clean) === 1;
}

function create_ledger(PDO $pdo, int $userId, string $type, int $amountCents, int $before, int $after, string $relatedId, string $note = ''): void
{
    $stmt = $pdo->prepare(
        'INSERT INTO wallet_ledger (user_id, type, amount_cents, balance_before_cents, balance_after_cents, related_id, note, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())'
    );
    $stmt->execute([$userId, $type, $amountCents, $before, $after, $relatedId, $note]);
}

class HttpError extends RuntimeException
{
    public int $status;
    public string $errorCode;

    public function __construct(string $message, int $status = 400, string $code = '')
    {
        parent::__construct($message);
        $this->status = $status;
        $this->errorCode = $code;
    }
}
