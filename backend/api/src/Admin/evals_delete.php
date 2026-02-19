<?php
// DELETE /api/admin/evaluations/:id

require_once __DIR__ . '/../Repository/repositories.php';
require_role('admin');

$id = $_route_params['id'];

if (!eval_repo()->delete($id)) {
    json_error('NOT_FOUND', 'Evaluation not found.', 404);
}

json_response(['message' => 'Evaluation deleted.']);
