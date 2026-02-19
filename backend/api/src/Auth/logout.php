<?php
// POST /api/auth/logout

$_SESSION = [];
session_destroy();

// Expire the cookie
$params = session_get_cookie_params();
setcookie(SESSION_NAME, '', time() - 3600, $params['path'], $params['domain'], $params['secure'], $params['httponly']);

json_response(['message' => 'Logged out successfully.']);
