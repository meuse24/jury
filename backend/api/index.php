<?php
// ===================================================================
// index.php — Front Controller / Router
// All requests to /api/* are handled here via .htaccess rewrite.
// ===================================================================

declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/src/helpers.php';
require_once __DIR__ . '/src/Model/models.php';
require_once __DIR__ . '/src/Middleware/session.php';
require_once __DIR__ . '/src/Middleware/rbac.php';

// ---- CORS (allow same-origin + local dev) ----
$allowedOrigins = [
    'http://localhost:5173',  // Vite dev server
    'http://localhost:4321',  // Astro dev server
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Accept');
}
if (get_method() === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ---- Session ----
init_session();

// ---- CSRF check ----
check_csrf();

// ---- Route resolution ----
// Strip base path + /api prefix to get the route segment
$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
// Remove query string
$path = strtok($requestUri, '?');
// Remove base path prefix (e.g. /jurysystem)
$apiPrefix = BASE_PATH . '/api';
if (str_starts_with($path, $apiPrefix)) {
    $route = substr($path, strlen($apiPrefix));
} else {
    $route = $path;
}
$route = '/' . ltrim($route, '/');
$method = get_method();

// ---- Dispatch ----
try {
    dispatch($method, $route);
} catch (Throwable $e) {
    json_error('INTERNAL_ERROR', 'An unexpected error occurred.', 500, [
        'message' => $e->getMessage(),
        'file'    => basename($e->getFile()),
        'line'    => $e->getLine(),
    ]);
}

// ===================================================================
// dispatch() — Route table
// ===================================================================
function dispatch(string $method, string $route): void
{
    // Auth routes
    if ($route === '/auth/login'  && $method === 'POST') { require __DIR__ . '/src/Auth/login.php';  return; }
    if ($route === '/auth/logout' && $method === 'POST') { require __DIR__ . '/src/Auth/logout.php'; return; }
    if ($route === '/auth/me'     && $method === 'GET')  { require __DIR__ . '/src/Auth/me.php';     return; }

    // Admin — Users
    if ($route === '/admin/users'            && $method === 'GET')    { require __DIR__ . '/src/Admin/users_list.php';   return; }
    if ($route === '/admin/users'            && $method === 'POST')   { require __DIR__ . '/src/Admin/users_create.php'; return; }
    if (preg_match('#^/admin/users/([^/]+)$#', $route, $m)) {
        $_route_params = ['id' => $m[1]];
        if ($method === 'GET')    { require __DIR__ . '/src/Admin/users_get.php';    return; }
        if ($method === 'PUT')    { require __DIR__ . '/src/Admin/users_update.php'; return; }
        if ($method === 'DELETE') { require __DIR__ . '/src/Admin/users_delete.php'; return; }
    }

    // Admin — Evaluations
    if ($route === '/admin/evaluations'            && $method === 'GET')  { require __DIR__ . '/src/Admin/evals_list.php';   return; }
    if ($route === '/admin/evaluations'            && $method === 'POST') { require __DIR__ . '/src/Admin/evals_create.php'; return; }
    if (preg_match('#^/admin/evaluations/([^/]+)$#', $route, $m)) {
        $_route_params = ['id' => $m[1]];
        if ($method === 'GET')    { require __DIR__ . '/src/Admin/evals_get.php';    return; }
        if ($method === 'PUT')    { require __DIR__ . '/src/Admin/evals_update.php'; return; }
        if ($method === 'DELETE') { require __DIR__ . '/src/Admin/evals_delete.php'; return; }
    }
    if (preg_match('#^/admin/evaluations/([^/]+)/assignments$#', $route, $m)) {
        $_route_params = ['id' => $m[1]];
        if ($method === 'PUT') { require __DIR__ . '/src/Admin/evals_assignments.php'; return; }
    }
    if (preg_match('#^/admin/evaluations/([^/]+)/publish-results$#', $route, $m)) {
        $_route_params = ['id' => $m[1]];
        if ($method === 'POST') { require __DIR__ . '/src/Admin/evals_publish.php'; return; }
    }
    if (preg_match('#^/admin/evaluations/([^/]+)/unpublish-results$#', $route, $m)) {
        $_route_params = ['id' => $m[1]];
        if ($method === 'POST') { require __DIR__ . '/src/Admin/evals_unpublish.php'; return; }
    }

    // Jury routes
    if ($route === '/jury/evaluations' && $method === 'GET') { require __DIR__ . '/src/Jury/evals_list.php'; return; }
    if (preg_match('#^/jury/evaluations/([^/]+)$#', $route, $m)) {
        $_route_params = ['id' => $m[1]];
        if ($method === 'GET') { require __DIR__ . '/src/Jury/evals_get.php'; return; }
    }
    if (preg_match('#^/jury/evaluations/([^/]+)/submission$#', $route, $m)) {
        $_route_params = ['id' => $m[1]];
        if ($method === 'GET') { require __DIR__ . '/src/Jury/submission_get.php'; return; }
        if ($method === 'PUT') { require __DIR__ . '/src/Jury/submission_put.php'; return; }
    }

    // Public routes
    if (preg_match('#^/public/evaluations/([^/]+)/results$#', $route, $m)) {
        $_route_params = ['id' => $m[1]];
        if ($method === 'GET') { require __DIR__ . '/src/Public/results.php'; return; }
    }

    // 404
    json_error('NOT_FOUND', 'Endpoint not found: ' . $method . ' ' . $route, 404);
}
