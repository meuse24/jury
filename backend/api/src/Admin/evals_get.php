<?php
// GET /api/admin/evaluations/:id

require_once __DIR__ . '/../Repository/repositories.php';
require_role('admin');

$id   = $_route_params['id'];
$eval = eval_repo()->findById($id);
if ($eval === null) {
    json_error('NOT_FOUND', 'Evaluation not found.', 404);
}

json_response(['evaluation' => $eval]);
