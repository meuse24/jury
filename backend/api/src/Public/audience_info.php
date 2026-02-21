<?php
// GET /api/public/evaluations/:id/audience

require_once __DIR__ . '/../Repository/repositories.php';

$id   = $_route_params['id'];
$eval = eval_repo()->findById($id);
if ($eval === null || !($eval['audience_enabled'] ?? false)) {
    json_error('NOT_FOUND', 'Audience voting not available.', 404);
}

$now    = now_ts();
$openAt = $eval['submission_open_at'];
$closeAt = $eval['submission_close_at'];

$status = $now < $openAt
    ? 'upcoming'
    : ($now > $closeAt ? 'closed' : 'open');

$deviceId = get_or_create_audience_device_id();
$already  = audience_vote_repo()->findByEvaluationAndDevice($id, $deviceId) !== null;

$hasCandidates = count($eval['candidates'] ?? []) > 0;
$audienceMax = $hasCandidates ? null : ($eval['audience_max_score'] ?? 10);

json_response([
    'evaluation' => [
        'id'          => $eval['id'],
        'title'       => $eval['title'],
        'description' => $eval['description'] ?? '',
        'submission_open_at'  => $openAt,
        'submission_close_at' => $closeAt,
    ],
    'mode'                  => $hasCandidates ? 'candidates' : 'simple',
    'status'                => $status,
    'audience_max_score'    => $audienceMax,
    'candidates'            => $hasCandidates ? $eval['candidates'] : [],
    'already_voted'         => $already,
    'audience_participants' => audience_vote_repo()->countByEvaluation($id),
]);
