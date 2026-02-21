<?php
// ===================================================================
// helpers.php — JSON response helpers & request utilities
// ===================================================================

function json_response(mixed $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function json_error(string $code, string $message, int $status = 400, mixed $details = null): never
{
    $body = ['error' => ['code' => $code, 'message' => $message]];
    if ($details !== null) {
        $body['error']['details'] = $details;
    }
    json_response($body, $status);
}

function request_body(): array
{
    $raw = file_get_contents('php://input');
    if (empty($raw)) {
        return [];
    }
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        json_error('INVALID_JSON', 'Request body must be valid JSON.', 400);
    }
    return $decoded;
}

function get_method(): string
{
    return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
}

function generate_uuid(): string
{
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

function now_ts(): int
{
    return time();
}

/**
 * Validate that a value is within 0..maxScore (inclusive).
 */
function valid_score(mixed $value, int $maxScore): bool
{
    return is_int($value) && $value >= 0 && $value <= $maxScore;
}

/**
 * Strip keys from an array (for sanitizing output).
 */
function array_except(array $arr, array $keys): array
{
    return array_diff_key($arr, array_flip($keys));
}

/**
 * Require a field in a data array, error if missing or empty string.
 */
function require_field(array $data, string $field, string $label = ''): mixed
{
    if (!array_key_exists($field, $data) || $data[$field] === '' || $data[$field] === null) {
        json_error('MISSING_FIELD', 'Required field missing: ' . ($label ?: $field), 422);
    }
    return $data[$field];
}

// -------------------------------------------------------------------
// Audience device cookie (best-effort uniqueness)
// -------------------------------------------------------------------
function get_or_create_audience_device_id(): string
{
    $cookieName = 'audience_device';
    $existing = $_COOKIE[$cookieName] ?? '';
    if (is_string($existing) && $existing !== '') {
        return $existing;
    }

    $id = generate_uuid();
    $path = defined('BASE_PATH') ? rtrim(BASE_PATH, '/') . '/' : '/';
    $secure = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
    setcookie($cookieName, $id, [
        'expires'  => time() + 60 * 60 * 24 * 365, // 1 year
        'path'     => $path,
        'secure'   => $secure,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    $_COOKIE[$cookieName] = $id;
    return $id;
}
