<?php
// GET /api/jury/evaluations/:id
// Returns full evaluation detail including categories (only if assigned)

require_once __DIR__ . '/../Repository/repositories.php';
$user = require_role('jury');

$id   = $_route_params['id'];
$eval = eval_repo()->findById($id);

if ($eval === null || !in_array($user['id'], $eval['jury_assignments'] ?? [], true)) {
    json_error('NOT_FOUND', 'Evaluation not found or not assigned to you.', 404);
}

$now    = now_ts();
$status = 'upcoming';
if ($now >= $eval['submission_open_at'] && $now <= $eval['submission_close_at']) {
    $status = 'open';
} elseif ($now > $eval['submission_close_at']) {
    $status = 'closed';
}

$subs = submission_repo()->findByUserAndEvaluation($user['id'], $id);

json_response([
    'evaluation' => [
        'id'                  => $eval['id'],
        'title'               => $eval['title'],
        'description'         => $eval['description'],
        'candidates'          => $eval['candidates'] ?? [],
        'categories'          => $eval['categories'],
        'submission_open_at'  => $eval['submission_open_at'],
        'submission_close_at' => $eval['submission_close_at'],
        'status'              => $status,
    ],
    'submissions' => array_values($subs),
]);
