<?php
// POST /api/public/evaluations/:id/audience/vote

require_once __DIR__ . '/../Repository/repositories.php';

$id   = $_route_params['id'];
$eval = eval_repo()->findById($id);
if ($eval === null || !($eval['audience_enabled'] ?? false)) {
    json_error('NOT_FOUND', 'Audience voting not available.', 404);
}

$now    = now_ts();
$openAt = $eval['submission_open_at'];
$closeAt = $eval['submission_close_at'];

if ($now < $openAt) {
    json_error('NOT_OPEN', 'Audience voting has not started yet.', 403);
}
if ($now > $closeAt) {
    json_error('CLOSED', 'Audience voting is closed.', 403);
}

$deviceId = get_or_create_audience_device_id();
$voteRepo = audience_vote_repo();

$body = request_body();
$hasCandidates = count($eval['candidates'] ?? []) > 0;

$candidateId = null;
$score = null;

if ($hasCandidates) {
    $candidateId = require_field($body, 'candidate_id');
    $exists = false;
    foreach ($eval['candidates'] as $c) {
        if ($c['id'] === $candidateId) { $exists = true; break; }
    }
    if (!$exists) {
        json_error('INVALID_CANDIDATE', 'Candidate not found.', 422);
    }
} else {
    $score = require_field($body, 'score');
    $maxScore = $eval['audience_max_score'] ?? 10;
    if (!valid_score($score, $maxScore)) {
        json_error('INVALID_SCORE', 'score must be an integer within allowed range.', 422);
    }
}

$vote = [
    'id'            => generate_uuid(),
    'evaluation_id' => $id,
    'device_id'     => $deviceId,
    'candidate_id'  => $candidateId,
    'score'         => $score,
    'submitted_at'  => now_ts(),
];

$created = $voteRepo->createOnce($id, $deviceId, $vote);
if ($created === null) {
    json_error('ALREADY_VOTED', 'You have already voted.', 409);
}

json_response([
    'message' => 'Vote recorded.',
    'audience_participants' => $voteRepo->countByEvaluation($id),
]);
