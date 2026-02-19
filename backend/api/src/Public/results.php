<?php
// GET /api/public/evaluations/:id/results
// No auth required.
// Returns 404 if not published or time gate not met (to avoid leaking info).

require_once __DIR__ . '/../Repository/repositories.php';

$id   = $_route_params['id'];
$eval = eval_repo()->findById($id);

$now = now_ts();

// 404 to avoid leaking info about unpublished evaluations
if (
    $eval === null ||
    !$eval['results_is_published'] ||
    $now < $eval['results_publish_at']
) {
    json_error('NOT_FOUND', 'Results not found or not yet available.', 404);
}

// Aggregate submissions
$submissions = submission_repo()->findByEvaluation($id);

// Build category totals
$categoryTotals = [];
$categoryMaxes  = [];
foreach ($eval['categories'] as $cat) {
    $categoryTotals[$cat['id']] = 0;
    $categoryMaxes[$cat['id']]  = $cat['max_score'];
}

$submissionCount = count($submissions);

foreach ($submissions as $sub) {
    foreach ($sub['scores'] as $entry) {
        if (isset($categoryTotals[$entry['category_id']])) {
            $categoryTotals[$entry['category_id']] += $entry['score'];
        }
    }
}

$categoryResults = [];
$totalSum        = 0;
$totalMax        = 0;

foreach ($eval['categories'] as $cat) {
    $sum = $categoryTotals[$cat['id']];
    $avg = $submissionCount > 0 ? round($sum / $submissionCount, 2) : null;
    $categoryResults[] = [
        'id'        => $cat['id'],
        'name'      => $cat['name'],
        'max_score' => $cat['max_score'],
        'sum'       => $sum,
        'average'   => $avg,
    ];
    $totalSum += $sum;
    $totalMax += $cat['max_score'] * $submissionCount;
}

$totalAvg = $submissionCount > 0 ? round($totalSum / $submissionCount, 2) : null;

json_response([
    'evaluation' => [
        'id'          => $eval['id'],
        'title'       => $eval['title'],
        'description' => $eval['description'],
        'published_at' => $eval['results_published_at'],
    ],
    'results' => [
        'submission_count' => $submissionCount,
        'total_sum'        => $totalSum,
        'total_max'        => $eval['categories']
            ? array_sum(array_column($eval['categories'], 'max_score')) * $submissionCount
            : 0,
        'total_average'    => $totalAvg,
        'categories'       => $categoryResults,
    ],
]);
