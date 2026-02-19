<?php
// ===================================================================
// rbac.php — RBAC middleware helpers
// ===================================================================

/**
 * Returns the currently authenticated user array or null.
 */
function current_user(): ?array
{
    return $_SESSION['user'] ?? null;
}

/**
 * Require an authenticated session; send 401 otherwise.
 */
function require_auth(): array
{
    $user = current_user();
    if ($user === null) {
        json_error('UNAUTHENTICATED', 'You must be logged in.', 401);
    }
    return $user;
}

/**
 * Require a specific role (or one of multiple roles).
 * @param string|string[] $roles
 */
function require_role(string|array $roles): array
{
    $user = require_auth();
    $allowed = is_array($roles) ? $roles : [$roles];
    if (!in_array($user['role'], $allowed, true)) {
        json_error('FORBIDDEN', 'Insufficient permissions.', 403);
    }
    return $user;
}

/**
 * Check CSRF: for state-changing requests we verify the Origin or Referer
 * header matches the current host. SameSite=Strict cookie already mitigates
 * most CSRF, but this double-check guards edge cases.
 *
 * Origins in CORS_ALLOWED_ORIGINS (local dev) are explicitly trusted and
 * bypass the host-match check — the CORS layer already handles them.
 */
function check_csrf(): void
{
    $method = get_method();
    if (in_array($method, ['GET', 'HEAD', 'OPTIONS'], true)) {
        return;
    }

    $origin  = $_SERVER['HTTP_ORIGIN']  ?? '';
    $referer = $_SERVER['HTTP_REFERER'] ?? '';

    // Explicitly trusted dev origins — skip host-match check
    $allowedOrigins = defined('CORS_ALLOWED_ORIGINS') ? CORS_ALLOWED_ORIGINS : [];
    if ($origin !== '' && in_array($origin, $allowedOrigins, true)) {
        return;
    }

    $host = $_SERVER['HTTP_HOST'] ?? '';

    if ($origin !== '') {
        $parsed = parse_url($origin);
        $originHost = ($parsed['host'] ?? '') . (isset($parsed['port']) ? ':' . $parsed['port'] : '');
        if ($originHost !== $host) {
            json_error('CSRF_FAILED', 'Cross-origin request rejected.', 403);
        }
    } elseif ($referer !== '') {
        $parsed = parse_url($referer);
        $refHost = ($parsed['host'] ?? '') . (isset($parsed['port']) ? ':' . $parsed['port'] : '');
        if ($refHost !== $host) {
            json_error('CSRF_FAILED', 'Cross-origin request rejected.', 403);
        }
    }
    // If neither Origin nor Referer is present, allow (curl, mobile apps, etc.)
    // This is acceptable given SameSite=Strict is the primary guard.
}
