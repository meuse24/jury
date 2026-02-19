<?php
// PUT /api/admin/users/:id
// Body (all optional): { "name": str, "role": str, "password": str }

require_once __DIR__ . '/../Repository/repositories.php';
require_role('admin');

$id   = $_route_params['id'];
$repo = user_repo();

if ($repo->findById($id) === null) {
    json_error('NOT_FOUND', 'User not found.', 404);
}

$body    = request_body();
$changes = [];

if (isset($body['name'])) {
    $changes['name'] = trim($body['name']);
}
if (isset($body['role'])) {
    if (!in_array($body['role'], ['admin', 'jury'], true)) {
        json_error('INVALID_ROLE', 'Role must be "admin" or "jury".', 422);
    }
    $changes['role'] = $body['role'];
}
if (isset($body['password'])) {
    if (strlen($body['password']) < 8) {
        json_error('WEAK_PASSWORD', 'Password must be at least 8 characters.', 422);
    }
    $changes['password_hash'] = password_hash($body['password'], PASSWORD_ALGO, PASSWORD_COST);
}

if (empty($changes)) {
    json_error('NO_CHANGES', 'No fields to update.', 422);
}

$updated = $repo->update($id, $changes);
json_response(['user' => user_public($updated)]);
