<?php
// POST /api/admin/users
// Body: { "username": str, "password": str, "name": str, "role": "admin|jury" }

require_once __DIR__ . '/../Repository/repositories.php';
require_role('admin');

$body = request_body();
$username = trim(require_field($body, 'username'));
$password = require_field($body, 'password');
$name     = trim(require_field($body, 'name'));
$role     = require_field($body, 'role');

if (!in_array($role, ['admin', 'jury'], true)) {
    json_error('INVALID_ROLE', 'Role must be "admin" or "jury".', 422);
}
if (strlen($password) < 8) {
    json_error('WEAK_PASSWORD', 'Password must be at least 8 characters.', 422);
}

$repo = user_repo();
if ($repo->findByUsername($username) !== null) {
    json_error('USERNAME_TAKEN', 'Username already exists.', 409);
}

$hash = password_hash($password, PASSWORD_ALGO, PASSWORD_COST);
$user = $repo->create(make_user($username, $hash, $role, $name));

json_response(['user' => user_public($user)], 201);
