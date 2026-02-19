<?php
// GET /api/jury/evaluations/:id/submission
// Returns all submissions for the current user in this evaluation (array, one per candidate or one total).

require_once __DIR__ . '/../Repository/repositories.php';
$user = require_role('jury');

$id   = $_route_params['id'];
$eval = eval_repo()->findById($id);

if ($eval === null || !in_array($user['id'], $eval['jury_assignments'] ?? [], true)) {
    json_error('NOT_FOUND', 'Evaluation not found or not assigned to you.', 404);
}

$subs = submission_repo()->findByUserAndEvaluation($user['id'], $id);
json_response(['submissions' => array_values($subs)]);
