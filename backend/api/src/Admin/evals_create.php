<?php
// POST /api/admin/evaluations
// Body: {
//   "title": str,
//   "description": str,
//   "submission_open_at": timestamp,
//   "submission_close_at": timestamp,
//   "results_publish_at": timestamp,
//   "categories": [ { "name": str, "description": str, "max_score": int } ]
// }

require_once __DIR__ . '/../Repository/repositories.php';
require_role('admin');

$body = request_body();

$title           = trim(require_field($body, 'title'));
$openAt          = require_field($body, 'submission_open_at');
$closeAt         = require_field($body, 'submission_close_at');
$publishAt       = require_field($body, 'results_publish_at');
$categoriesRaw   = $body['categories'] ?? [];

if (!is_int($openAt) || !is_int($closeAt) || !is_int($publishAt)) {
    json_error('INVALID_TIMESTAMPS', 'Timestamps must be Unix integers.', 422);
}
if ($closeAt <= $openAt) {
    json_error('INVALID_WINDOW', 'submission_close_at must be after submission_open_at.', 422);
}
if ($publishAt < $closeAt) {
    json_error('INVALID_PUBLISH', 'results_publish_at must not be before submission_close_at.', 422);
}
if (!is_array($categoriesRaw) || count($categoriesRaw) === 0) {
    json_error('NO_CATEGORIES', 'At least one category is required.', 422);
}

// Optional: candidates
$candidatesRaw = $body['candidates'] ?? [];
$candidates = [];
foreach ($candidatesRaw as $i => $c) {
    $cName = trim($c['name'] ?? '');
    if ($cName === '') {
        json_error('INVALID_CANDIDATE', "Candidate $i: name is required.", 422);
    }
    $candidates[] = make_candidate($cName, $c['description'] ?? '');
}

$categories = [];
foreach ($categoriesRaw as $i => $cat) {
    $catName  = trim($cat['name'] ?? '');
    $maxScore = $cat['max_score'] ?? null;
    if ($catName === '') {
        json_error('INVALID_CATEGORY', "Category $i: name is required.", 422);
    }
    if (!is_int($maxScore) || $maxScore < 1) {
        json_error('INVALID_CATEGORY', "Category $i: max_score must be a positive integer.", 422);
    }
    $categories[] = make_category($catName, $cat['description'] ?? '', $maxScore);
}

$eval = eval_repo()->create(make_evaluation([
    'title'                => $title,
    'description'          => $body['description'] ?? '',
    'candidates'           => $candidates,
    'categories'           => $categories,
    'submission_open_at'   => $openAt,
    'submission_close_at'  => $closeAt,
    'results_publish_at'   => $publishAt,
]));

json_response(['evaluation' => $eval], 201);
