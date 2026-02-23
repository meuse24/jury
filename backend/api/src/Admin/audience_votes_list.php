<?php
// GET /admin/evaluations/:id/audience-votes

require_once __DIR__ . '/../Repository/repositories.php';

require_role('admin');

$id   = $_route_params['id'];
$eval = eval_repo()->findById($id);
if ($eval === null) {
    json_error('NOT_FOUND', 'Evaluation not found.', 404);
}

$votes = audience_vote_repo()->findByEvaluation($id);

// Build candidate name map
$candidateMap = [];
foreach ($eval['candidates'] ?? [] as $c) {
    $candidateMap[$c['id']] = $c['name'];
}

$result = array_map(function ($v) use ($candidateMap) {
    $cid = $v['candidate_id'] ?? null;
    return [
        'id'             => $v['id'],
        'device_id'      => $v['device_id'],
        'candidate_id'   => $cid,
        'candidate_name' => $cid !== null ? ($candidateMap[$cid] ?? null) : null,
        'score'          => $v['score'] ?? null,
        'submitted_at'   => $v['submitted_at'],
    ];
}, $votes);

// Sort by submitted_at descending (newest first)
usort($result, fn($a, $b) => $b['submitted_at'] <=> $a['submitted_at']);

json_response([
    'evaluation' => [
        'id'    => $eval['id'],
        'title' => $eval['title'],
    ],
    'votes' => $result,
    'total' => count($result),
]);
