<?php
// GET /api/jury/evaluations/:id/submission

require_once __DIR__ . '/../Repository/repositories.php';
$user = require_role('jury');

$id   = $_route_params['id'];
$eval = eval_repo()->findById($id);

if ($eval === null || !in_array($user['id'], $eval['jury_assignments'] ?? [], true)) {
    json_error('NOT_FOUND', 'Evaluation not found or not assigned to you.', 404);
}

$sub = submission_repo()->findByUserAndEvaluation($user['id'], $id);
if ($sub === null) {
    json_response(['submission' => null]);
}

json_response(['submission' => $sub]);
