<?php
// DELETE /api/admin/users/:id

require_once __DIR__ . '/../Repository/repositories.php';
$me = require_role('admin');

$id = $_route_params['id'];

if ($id === $me['id']) {
    json_error('CANNOT_DELETE_SELF', 'You cannot delete your own account.', 409);
}

if (!user_repo()->delete($id)) {
    json_error('NOT_FOUND', 'User not found.', 404);
}

json_response(['message' => 'User deleted.']);
