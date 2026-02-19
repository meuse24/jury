<?php
// PUT /api/jury/evaluations/:id/candidates/:candidate_id/submission
// Body: { "scores": [{ "category_id": uuid, "score": int }], "comment": str }

require_once __DIR__ . '/../Repository/repositories.php';
$user = require_role('jury');

$evalId      = $_route_params['id'];
$candidateId = $_route_params['candidate_id'];
$eval        = eval_repo()->findById($evalId);

if ($eval === null || !in_array($user['id'], $eval['jury_assignments'] ?? [], true)) {
    json_error('NOT_FOUND', 'Evaluation not found or not assigned to you.', 404);
}

// Verify candidate
$candidateIds = array_column($eval['candidates'] ?? [], 'id');
if (!in_array($candidateId, $candidateIds, true)) {
    json_error('NOT_FOUND', 'Candidate not found in this evaluation.', 404);
}

// Time window check
$now = now_ts();
if ($now < $eval['submission_open_at']) {
    json_error('WINDOW_NOT_OPEN', 'Submission window has not opened yet.', 403);
}
if ($now > $eval['submission_close_at']) {
    json_error('WINDOW_CLOSED', 'Submission window has closed.', 403);
}

$body   = request_body();
$scores = $body['scores'] ?? null;
if (!is_array($scores)) {
    json_error('MISSING_SCORES', 'scores must be an array.', 422);
}

// Validate scores against categories
$categoryMap = [];
foreach ($eval['categories'] as $cat) {
    $categoryMap[$cat['id']] = $cat['max_score'];
}

$validatedScores = [];
$seenCategories  = [];
foreach ($scores as $i => $entry) {
    $catId = $entry['category_id'] ?? null;
    $score = $entry['score'] ?? null;
    if (!isset($categoryMap[$catId])) {
        json_error('INVALID_CATEGORY', "scores[$i]: category_id '$catId' not found.", 422);
    }
    if (in_array($catId, $seenCategories, true)) {
        json_error('DUPLICATE_CATEGORY', "scores[$i]: duplicate category_id.", 422);
    }
    $seenCategories[] = $catId;
    $maxScore = $categoryMap[$catId];
    if (!valid_score($score, $maxScore)) {
        json_error('INVALID_SCORE', "scores[$i]: score must be 0..{$maxScore}.", 422);
    }
    $validatedScores[] = ['category_id' => $catId, 'score' => $score];
}

$missing = array_diff(array_keys($categoryMap), $seenCategories);
if (!empty($missing)) {
    json_error('INCOMPLETE_SCORES', 'Scores missing for some categories.', 422);
}

$sub = submission_repo()->upsert($user['id'], $evalId, [
    'candidate_id' => $candidateId,
    'scores'       => $validatedScores,
    'comment'      => isset($body['comment']) ? (string) $body['comment'] : null,
]);

json_response(['submission' => $sub]);
