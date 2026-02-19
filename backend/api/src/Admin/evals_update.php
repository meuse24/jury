<?php
// PUT /api/admin/evaluations/:id
// Partial update: title, description, timestamps, categories

require_once __DIR__ . '/../Repository/repositories.php';
require_role('admin');

$id   = $_route_params['id'];
$repo = eval_repo();

$existing = $repo->findById($id);
if ($existing === null) {
    json_error('NOT_FOUND', 'Evaluation not found.', 404);
}

$body    = request_body();
$changes = [];

if (array_key_exists('title', $body)) {
    $changes['title'] = trim($body['title']);
    if ($changes['title'] === '') json_error('INVALID_TITLE', 'Title cannot be empty.', 422);
}
if (array_key_exists('description', $body)) {
    $changes['description'] = $body['description'];
}

$openAt  = $body['submission_open_at']  ?? $existing['submission_open_at'];
$closeAt = $body['submission_close_at'] ?? $existing['submission_close_at'];
$pubAt   = $body['results_publish_at']  ?? $existing['results_publish_at'];

if (array_key_exists('submission_open_at', $body))  $changes['submission_open_at']  = $openAt;
if (array_key_exists('submission_close_at', $body)) $changes['submission_close_at'] = $closeAt;
if (array_key_exists('results_publish_at', $body))  $changes['results_publish_at']  = $pubAt;

if ($closeAt <= $openAt) {
    json_error('INVALID_WINDOW', 'submission_close_at must be after submission_open_at.', 422);
}

if (array_key_exists('candidates', $body)) {
    $candidatesRaw = $body['candidates'];
    if (!is_array($candidatesRaw)) {
        json_error('INVALID_CANDIDATES', 'candidates must be an array.', 422);
    }
    $candidates = [];
    foreach ($candidatesRaw as $i => $c) {
        $cName = trim($c['name'] ?? '');
        if ($cName === '') json_error('INVALID_CANDIDATE', "Candidate $i: name required.", 422);
        $candidates[] = isset($c['id'])
            ? ['id' => $c['id'], 'name' => $cName, 'description' => $c['description'] ?? '']
            : make_candidate($cName, $c['description'] ?? '');
    }
    $changes['candidates'] = $candidates;
}

if (array_key_exists('categories', $body)) {
    $categoriesRaw = $body['categories'];
    if (!is_array($categoriesRaw) || count($categoriesRaw) === 0) {
        json_error('NO_CATEGORIES', 'At least one category is required.', 422);
    }
    $categories = [];
    foreach ($categoriesRaw as $i => $cat) {
        $catName  = trim($cat['name'] ?? '');
        $maxScore = $cat['max_score'] ?? null;
        if ($catName === '') json_error('INVALID_CATEGORY', "Category $i: name required.", 422);
        if (!is_int($maxScore) || $maxScore < 1) json_error('INVALID_CATEGORY', "Category $i: max_score must be positive int.", 422);
        // Preserve existing ID if provided, else generate new
        $categories[] = isset($cat['id'])
            ? ['id' => $cat['id'], 'name' => $catName, 'description' => $cat['description'] ?? '', 'max_score' => $maxScore]
            : make_category($catName, $cat['description'] ?? '', $maxScore);
    }
    $changes['categories'] = $categories;
}

if (empty($changes)) {
    json_error('NO_CHANGES', 'No fields to update.', 422);
}

$updated = $repo->update($id, $changes);
json_response(['evaluation' => $updated]);
