<?php
// GET /api/admin/users/:id

require_once __DIR__ . '/../Repository/repositories.php';
require_role('admin');

$id   = $_route_params['id'];
$user = user_repo()->findById($id);
if ($user === null) {
    json_error('NOT_FOUND', 'User not found.', 404);
}

json_response(['user' => user_public($user)]);
