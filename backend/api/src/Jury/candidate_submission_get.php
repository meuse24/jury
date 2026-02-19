<?php
// GET /api/jury/evaluations/:id/candidates/:candidate_id/submission

require_once __DIR__ . '/../Repository/repositories.php';
$user = require_role('jury');

$evalId      = $_route_params['id'];
$candidateId = $_route_params['candidate_id'];
$eval        = eval_repo()->findById($evalId);

if ($eval === null || !in_array($user['id'], $eval['jury_assignments'] ?? [], true)) {
    json_error('NOT_FOUND', 'Evaluation not found or not assigned to you.', 404);
}

// Verify candidate exists in this evaluation
$candidateIds = array_column($eval['candidates'] ?? [], 'id');
if (!in_array($candidateId, $candidateIds, true)) {
    json_error('NOT_FOUND', 'Candidate not found in this evaluation.', 404);
}

$sub = submission_repo()->findByUserEvaluationAndCandidate($user['id'], $evalId, $candidateId);
json_response(['submission' => $sub]);
