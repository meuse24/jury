<?php
// PUT /api/jury/evaluations/:id/submission
// Body: {
//   "scores": [ { "category_id": "uuid", "score": int }, ... ],
//   "comment": "string" (optional)
// }

require_once __DIR__ . '/../Repository/repositories.php';
$user = require_role('jury');

$id   = $_route_params['id'];
$eval = eval_repo()->findById($id);

if ($eval === null || !in_array($user['id'], $eval['jury_assignments'] ?? [], true)) {
    json_error('NOT_FOUND', 'Evaluation not found or not assigned to you.', 404);
}

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

// Build a map of category id => max_score for validation
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
        json_error('INVALID_CATEGORY', "scores[$i]: category_id '$catId' does not exist in this evaluation.", 422);
    }
    if (in_array($catId, $seenCategories, true)) {
        json_error('DUPLICATE_CATEGORY', "scores[$i]: category_id '$catId' appears more than once.", 422);
    }
    $seenCategories[] = $catId;

    $maxScore = $categoryMap[$catId];
    if (!valid_score($score, $maxScore)) {
        json_error('INVALID_SCORE', "scores[$i]: score must be integer 0..{$maxScore}.", 422);
    }
    $validatedScores[] = ['category_id' => $catId, 'score' => $score];
}

// Ensure all categories are covered
$missing = array_diff(array_keys($categoryMap), $seenCategories);
if (!empty($missing)) {
    json_error('INCOMPLETE_SCORES', 'Scores missing for categories: ' . implode(', ', $missing), 422);
}

$sub = submission_repo()->upsert($user['id'], $id, [
    'scores'  => $validatedScores,
    'comment' => isset($body['comment']) ? (string) $body['comment'] : null,
]);

json_response(['submission' => $sub]);
