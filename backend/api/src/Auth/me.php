<?php
// GET /api/auth/me

$user = current_user();
if ($user === null) {
    json_error('UNAUTHENTICATED', 'Not logged in.', 401);
}

json_response(['user' => $user]);
