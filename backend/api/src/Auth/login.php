<?php
// POST /api/auth/login
// Body: { "username": "...", "password": "..." }

require_once __DIR__ . '/../Repository/repositories.php';

$body     = request_body();
$username = trim($body['username'] ?? '');
$password = $body['password'] ?? '';

if ($username === '' || $password === '') {
    json_error('MISSING_CREDENTIALS', 'Username and password are required.', 422);
}

$user = user_repo()->findByUsername($username);

if ($user === null || !password_verify($password, $user['password_hash'])) {
    json_error('INVALID_CREDENTIALS', 'Invalid username or password.', 401);
}

// Regenerate session ID to prevent fixation
session_regenerate_id(true);

$_SESSION['user'] = user_public($user);

json_response(['user' => user_public($user)]);
