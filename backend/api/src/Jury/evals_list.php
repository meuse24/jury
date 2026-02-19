<?php
// GET /api/jury/evaluations
// Returns evaluations the logged-in jury member is assigned to,
// each annotated with: status (upcoming/open/closed), has_submission

require_once __DIR__ . '/../Repository/repositories.php';
$user = require_role('jury');

$now     = now_ts();
$allEvals = eval_repo()->findAll();
$subRepo  = submission_repo();

$result = [];
foreach ($allEvals as $eval) {
    if (!in_array($user['id'], $eval['jury_assignments'] ?? [], true)) {
        continue;
    }

    $status = 'upcoming';
    if ($now >= $eval['submission_open_at'] && $now <= $eval['submission_close_at']) {
        $status = 'open';
    } elseif ($now > $eval['submission_close_at']) {
        $status = 'closed';
    }

    $sub = $subRepo->findByUserAndEvaluation($user['id'], $eval['id']);

    $result[] = [
        'id'                  => $eval['id'],
        'title'               => $eval['title'],
        'description'         => $eval['description'],
        'submission_open_at'  => $eval['submission_open_at'],
        'submission_close_at' => $eval['submission_close_at'],
        'status'              => $status,
        'has_submission'      => $sub !== null,
    ];
}

json_response(['evaluations' => $result]);
