<?php

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
    if ($method === 'POST' && $path === '/api/generate/settle') {
        settle_generation($pdo, $config);
        return;
    }
    if ($method === 'POST' && $path === '/api/admin/redeem-codes') {
        admin_create_redeem_codes($pdo, $config);
        return;
    }
    if ($method === 'GET' && $path === '/api/admin/redeem-codes') {
        admin_list_redeem_codes($pdo, $config);
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
    if ($createdAt !== '' && (time() - strtotime($createdAt) < 60)) {
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
        json_response([
            'ok' => true,
            'user' => public_user($user),
            'priceCents' => (int)$platform['price_cents'],
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
    json_response([
        'ok' => true,
        'authenticated' => (bool)$user,
        'user' => $user ? public_user($user) : null,
        'priceCents' => (int)$platform['price_cents'],
        'currency' => 'CNY',
        'rechargeUrl' => (string)$config['app']['recharge_url'],
        'sessionToken' => $user ? current_session_token() : '',
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

function billing_config(PDO $pdo, array $config): void
{
    $platform = platform_config($pdo, $config);
    json_response([
        'ok' => true,
        'priceCents' => (int)$platform['price_cents'],
        'upstreamCostCents' => (int)$platform['upstream_cost_cents'],
        'currency' => 'CNY',
        'platformEnabled' => platform_is_configured($platform),
        'rechargeUrl' => (string)$config['app']['recharge_url'],
        'directBaseUrl' => (string)($config['app']['public_api_base_url'] ?? ''),
        'requestFormat' => (string)$platform['request_format'],
        'customTemplate' => (string)$platform['custom_template'],
        'modelName' => (string)$platform['model_name'],
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
    $stmt = $pdo->prepare(
        'SELECT * FROM wallet_ledger WHERE user_id = ? ORDER BY id DESC LIMIT 50'
    );
    $stmt->execute([(int)$user['id']]);
    $items = [];
    foreach ($stmt->fetchAll() as $item) {
        $items[] = [
            'id' => (int)$item['id'],
            'type' => (string)$item['type'],
            'amountCents' => (int)$item['amount_cents'],
            'balanceBeforeCents' => (int)$item['balance_before_cents'],
            'balanceAfterCents' => (int)$item['balance_after_cents'],
            'relatedId' => (string)$item['related_id'],
            'note' => (string)$item['note'],
            'createdAt' => strtotime((string)$item['created_at']) * 1000,
        ];
    }
    json_response(['ok' => true, 'ledger' => $items]);
}

function generate_ticket(PDO $pdo, array $config): void
{
    $user = require_user($pdo, $config);
    $payload = read_json();
    $platform = platform_config($pdo, $config);
    $mode = (($payload['mode'] ?? 'text') === 'image') ? 'image' : 'text';
    $model = 'gpt-image-2';
    $count = max(1, min((int)$platform['max_count'], (int)($payload['count'] ?? 1)));
    $price = (int)$platform['price_cents'];
    $total = $count * $price;
    if (!platform_is_configured($platform)) {
        throw new HttpError('推荐 API 尚未配置', 503, 'platform_not_configured');
    }
    ensure_user_can_afford($pdo, (int)$user['id'], $total);
    $token = random_token(32);
    $ticket = sign_generation_ticket($config, [
        'uid' => (int)$user['id'],
        'mode' => $mode,
        'count' => $count,
        'price' => $price,
        'model' => $model,
        'exp' => time() + 600,
        'nonce' => random_token(12),
    ], $token);
    json_response([
        'ok' => true,
        'ticket' => $ticket,
        'directBaseUrl' => (string)($config['app']['public_api_base_url'] ?? ''),
        'priceCents' => $price,
        'balanceCents' => current_balance($pdo, (int)$user['id']),
    ]);
}

function generate_direct_config(PDO $pdo, array $config): void
{
    $user = require_user($pdo, $config);
    $payload = read_json();
    $platform = platform_config($pdo, $config);
    $mode = (($payload['mode'] ?? 'text') === 'image') ? 'image' : 'text';
    $model = 'gpt-image-2';
    $count = max(1, min((int)$platform['max_count'], (int)($payload['count'] ?? 1)));
    $price = (int)$platform['price_cents'];
    $total = $count * $price;
    if (!platform_is_configured($platform)) {
        throw new HttpError('推荐 API 尚未配置', 503, 'platform_not_configured');
    }
    ensure_user_can_afford($pdo, (int)$user['id'], $total);
    $endpoint = $mode === 'image'
        ? ((string)$platform['edit_endpoint'] ?: infer_edit_endpoint((string)$platform['text_endpoint']))
        : (string)$platform['text_endpoint'];
    if ($endpoint === '') {
        throw new HttpError('推荐 API 尚未配置', 503, 'platform_not_configured');
    }
    $ticket = sign_generation_ticket($config, [
        'uid' => (int)$user['id'],
        'mode' => $mode,
        'count' => $count,
        'price' => $price,
        'model' => $model,
        'exp' => time() + 600,
        'nonce' => random_token(12),
    ], random_token(32));
    json_response([
        'ok' => true,
        'ticket' => $ticket,
        'endpoint' => $endpoint,
        'apiKey' => (string)$platform['api_key'],
        'priceCents' => $price,
        'balanceCents' => current_balance($pdo, (int)$user['id']),
    ]);
}

function generate_platform(PDO $pdo, array $config): void
{
    $payload = read_json();
    $platform = platform_config($pdo, $config);
    $model = 'gpt-image-2';
    $ticket = verify_generation_ticket($config, (string)($payload['ticket'] ?? ''));
    if (!$ticket) {
        $user = require_user($pdo, $config);
        $ticket = [
            'uid' => (int)$user['id'],
            'mode' => (($payload['mode'] ?? 'text') === 'image') ? 'image' : 'text',
            'count' => max(1, min((int)$platform['max_count'], (int)($payload['count'] ?? 1))),
            'price' => (int)$platform['price_cents'],
            'model' => $model,
        ];
    }
    $mode = (($ticket['mode'] ?? ($payload['mode'] ?? 'text')) === 'image') ? 'image' : 'text';
    $request = is_array($payload['request'] ?? null) ? $payload['request'] : [];
    $count = max(1, min((int)$ticket['count'], (int)$platform['max_count'], (int)($payload['count'] ?? 1)));
    $price = max(1, (int)$ticket['price']);
    ensure_user_can_afford($pdo, (int)$ticket['uid'], $count * $price);
    $request = enforce_platform_request_count($request, $count);
    $endpoint = $mode === 'image' ? ((string)$platform['edit_endpoint'] ?: infer_edit_endpoint((string)$platform['text_endpoint'])) : (string)$platform['text_endpoint'];
    if ($endpoint === '' || trim((string)$platform['api_key']) === '') {
        throw new HttpError('推荐 API 尚未配置', 503, 'platform_not_configured');
    }

    try {
        $upstream = call_platform_upstream($platform, $endpoint, $request);
        $bodyPayload = json_decode($upstream['body'], true);
        $images = is_array($bodyPayload) ? json_images($bodyPayload) : [];
        if ($upstream['status'] < 200 || $upstream['status'] >= 300) {
            $message = is_array($bodyPayload) ? (string)($bodyPayload['error']['message'] ?? $bodyPayload['message'] ?? '推荐 API 生成失败') : '推荐 API 生成失败';
            throw new RuntimeException($message);
        }
        if (!count($images)) {
            throw new RuntimeException('推荐 API 没有返回图片');
        }
        json_response([
            'ok' => true,
            'data' => $images,
            'settlementRequired' => true,
        ]);
    } catch (Throwable $error) {
        throw new HttpError($error->getMessage() ?: '生成失败，未扣费', 502, 'platform_failed');
    }
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
    $result = charge_generation_success($pdo, (int)$ticket['uid'], $requestId, (string)$ticket['mode'], 'gpt-image-2', $price, $imageId);
    json_response([
        'ok' => true,
        'balanceCents' => (int)$result['balance'],
        'chargedCents' => $price,
        'requestId' => $requestId,
    ]);
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

function charge_generation_success(PDO $pdo, int $userId, string $requestId, string $mode, string $model, int $price, string $imageId): array
{
    $pdo->beginTransaction();
    try {
        $existing = $pdo->prepare('SELECT * FROM generation_requests WHERE request_id = ? LIMIT 1 FOR UPDATE');
        $existing->execute([$requestId]);
        $old = $existing->fetch();
        if ($old) {
            if ((int)$old['user_id'] !== $userId) {
                throw new HttpError('请勿重复提交同一次生成请求', 409, 'duplicate_request');
            }
            $pdo->commit();
            return ['balance' => current_balance($pdo, $userId), 'duplicate' => true];
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
        $insert = $pdo->prepare(
            "INSERT INTO generation_requests
             (user_id, request_id, mode, model, image_count, price_cents, total_cents, status, error_message, created_at)
             VALUES (?, ?, ?, ?, 1, ?, ?, 'succeeded', '', UTC_TIMESTAMP())"
        );
        $insert->execute([$userId, $requestId, $mode, $model, $price, $price]);
        $generationId = (int)$pdo->lastInsertId();
        create_ledger($pdo, $userId, 'charge', -$price, $before, $after, $requestId, '推荐 API 生图成功扣费 ' . $imageId);
        complete_generation_charge($pdo, $generationId, 'succeeded', '');
        $pdo->commit();
        return ['balance' => $after, 'duplicate' => false];
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
        create_ledger($pdo, $userId, 'refund', $total, $before, $after, $requestId, '推荐 API 失败退款');
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
    return [
        'text_endpoint' => trim((string)($platform['text_endpoint'] ?? '')),
        'edit_endpoint' => trim((string)($platform['edit_endpoint'] ?? '')),
        'api_key' => trim((string)($platform['api_key'] ?? '')),
        'price_cents' => max(1, (int)($platform['price_cents'] ?? 10)),
        'upstream_cost_cents' => max(0, (int)($platform['upstream_cost_cents'] ?? 0)),
        'max_count' => max(1, (int)($platform['max_count'] ?? 4)),
        'model_name' => 'gpt-image-2',
        'request_format' => 'openai',
        'custom_template' => '',
        'source' => 'file',
    ];
}

function platform_config(PDO $pdo, array $config): array
{
    $fallback = fallback_platform_config($config);
    $stored = read_admin_setting_json($pdo, 'platform_global_api');
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
    $customTemplate = custom_api_template((string)($value['customTemplate'] ?? $value['custom_template'] ?? $fallback['custom_template']));
    return [
        'text_endpoint' => $textEndpoint,
        'edit_endpoint' => $editEndpoint,
        'api_key' => $apiKey,
        'price_cents' => $price,
        'upstream_cost_cents' => $upstreamCost,
        'max_count' => $maxCount,
        'model_name' => 'gpt-image-2',
        'request_format' => $requestFormat,
        'custom_template' => $customTemplate,
        'updated_at' => (int)($value['updatedAt'] ?? $value['updated_at'] ?? 0),
        'source' => 'database',
    ];
}

function public_global_platform_config(array $platform): array
{
    return [
        'textEndpoint' => (string)$platform['text_endpoint'],
        'editEndpoint' => (string)$platform['edit_endpoint'],
        'apiKey' => (string)$platform['api_key'],
        'priceCents' => (int)$platform['price_cents'],
        'upstreamCostCents' => (int)$platform['upstream_cost_cents'],
        'maxCount' => (int)$platform['max_count'],
        'modelName' => (string)$platform['model_name'],
        'requestFormat' => (string)$platform['request_format'],
        'customTemplate' => (string)$platform['custom_template'],
        'updatedAt' => (int)($platform['updated_at'] ?? 0),
        'source' => (string)($platform['source'] ?? 'file'),
    ];
}

function platform_is_configured(array $platform): bool
{
    return trim((string)$platform['text_endpoint']) !== '' && trim((string)$platform['api_key']) !== '';
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

function call_platform_upstream(array $platform, string $endpoint, array $request): array
{
    $headers = [];
    foreach (($request['headers'] ?? []) as $key => $value) {
        if (strtolower((string)$key) === 'content-type') {
            $headers['Content-Type'] = (string)$value;
        }
    }
    $headers['Authorization'] = 'Bearer ' . (string)$platform['api_key'];
    $tempFiles = [];
    try {
        if (($request['bodyType'] ?? '') === 'multipart') {
            unset($headers['Content-Type']);
            $body = [];
            foreach (($request['fields'] ?? []) as $key => $value) {
                $body[(string)$key] = (string)$value;
            }
            foreach (($request['files'] ?? []) as $file) {
                if (!is_array($file)) {
                    continue;
                }
                $temp = data_url_to_temp_file((string)($file['dataUrl'] ?? ''));
                $tempFiles[] = $temp['path'];
                $field = (string)($file['field'] ?? 'image');
                $filename = (string)($file['filename'] ?? 'image.png');
                $body[$field] = new CURLFile($temp['path'], $temp['mime'], $filename);
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
            'usedAt' => $row['used_at'] ? strtotime((string)$row['used_at']) * 1000 : 0,
            'createdAt' => strtotime((string)$row['created_at']) * 1000,
        ];
    }
    json_response(['ok' => true, 'codes' => $codes]);
}

function admin_get_custom_api(PDO $pdo, array $config): void
{
    require_admin($pdo, $config);
    $settings = read_admin_setting_json($pdo, 'custom_api_debug');
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
    $settings = read_admin_setting_json($pdo, 'custom_api_debug');
    $current = normalize_custom_api_config($payload);
    if ($current['enabled'] && ($current['textEndpoint'] === '' || $current['apiKey'] === '')) {
        throw new HttpError('启用自定义 API 调试前，请填写文生图 API URL 和 API Key', 400, 'custom_api_incomplete');
    }

    $history = normalize_custom_api_history($settings['history'] ?? []);
    if ($current['textEndpoint'] !== '' || $current['editEndpoint'] !== '' || $current['apiKey'] !== '') {
        $snapshot = $current;
        $snapshot['enabled'] = false;
        $snapshot['id'] = $snapshot['id'] ?: random_token(8);
        $snapshot['title'] = custom_api_config_title($snapshot);
        $snapshot['updatedAt'] = time() * 1000;
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
    write_admin_setting_json($pdo, 'custom_api_debug', [
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
    if ($current['priceCents'] <= 0) {
        throw new HttpError('售价需要大于 0 元/张', 400, 'invalid_price');
    }
    $existingPlatform = platform_config($pdo, $config);

    $settings = read_admin_setting_json($pdo, 'custom_api_debug');
    $history = normalize_custom_api_history($settings['history'] ?? []);
    $current['updatedAt'] = time() * 1000;
    $snapshot = $current;
    $snapshot['enabled'] = false;
    $snapshot['id'] = $snapshot['id'] ?: random_token(8);
    $snapshot['title'] = custom_api_config_title($snapshot);
    $key = custom_api_history_key($snapshot);
    $filtered = [];
    foreach ($history as $item) {
        if (custom_api_history_key($item) !== $key) {
            $filtered[] = $item;
        }
    }
    $history = array_slice(array_merge([$snapshot], $filtered), 0, 12);

    write_admin_setting_json($pdo, 'custom_api_debug', [
        'current' => $current,
        'history' => $history,
    ]);
    write_admin_setting_json($pdo, 'platform_global_api', [
        'textEndpoint' => $current['textEndpoint'],
        'editEndpoint' => $current['editEndpoint'],
        'apiKey' => $current['apiKey'],
        'priceCents' => $current['priceCents'],
        'upstreamCostCents' => (int)$existingPlatform['upstream_cost_cents'],
        'maxCount' => (int)$existingPlatform['max_count'],
        'modelName' => $current['modelName'],
        'requestFormat' => $current['requestFormat'],
        'customTemplate' => $current['customTemplate'],
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

function read_admin_setting_json(PDO $pdo, string $key): array
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
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function write_admin_setting_json(PDO $pdo, string $key, array $value): void
{
    $json = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        throw new HttpError('配置 JSON 编码失败', 500, 'setting_encode_failed');
    }
    if (ensure_admin_settings_table($pdo)) {
        try {
            $stmt = $pdo->prepare(
                'INSERT INTO admin_settings (setting_key, setting_value, updated_at)
                 VALUES (?, ?, UTC_TIMESTAMP())
                 ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = UTC_TIMESTAMP()'
            );
            $stmt->execute([$key, $json]);
            return;
        } catch (Throwable $error) {
            // Fall through to admin_logs for virtual hosts that restrict table writes.
        }
    }
    write_admin_setting_log($pdo, $key, $json);
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
    $transportMode = (string)($value['transportMode'] ?? 'direct');
    if (!in_array($transportMode, ['direct', 'proxy'], true)) {
        $transportMode = 'direct';
    }
    return [
        'id' => preg_replace('/[^\w-]/', '', (string)($value['id'] ?? '')),
        'enabled' => (bool)($value['enabled'] ?? false),
        'title' => trim((string)($value['title'] ?? '')),
        'textEndpoint' => sanitize_custom_api_url((string)($value['textEndpoint'] ?? '')),
        'editEndpoint' => sanitize_custom_api_url((string)($value['editEndpoint'] ?? '')),
        'apiKey' => trim((string)($value['apiKey'] ?? '')),
        'requestFormat' => $requestFormat,
        'transportMode' => $transportMode,
        'customTemplate' => custom_api_template((string)($value['customTemplate'] ?? '')),
        'modelName' => 'gpt-image-2',
        'priceCents' => custom_api_price_cents($value['priceCents'] ?? $value['price_cents'] ?? 10),
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
    foreach ($value as $item) {
        if (!is_array($item)) {
            continue;
        }
        $clean = normalize_custom_api_config($item);
        $clean['enabled'] = false;
        if ($clean['id'] === '') {
            $clean['id'] = random_token(8);
        }
        if ($clean['title'] === '') {
            $clean['title'] = custom_api_config_title($clean);
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

function custom_api_config_title(array $item): string
{
    $endpoint = (string)($item['textEndpoint'] ?: $item['editEndpoint']);
    if ($endpoint === '') {
        return (string)($item['modelName'] ?? 'API Config');
    }
    $host = parse_url($endpoint, PHP_URL_HOST);
    return $host ? $host : preg_replace('#^https?://#i', '', explode('/', $endpoint)[0]);
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
