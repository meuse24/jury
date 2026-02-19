<?php
// POST /api/admin/evaluations/:id/unpublish-results

require_once __DIR__ . '/../Repository/repositories.php';
require_role('admin');

$id   = $_route_params['id'];
$repo = eval_repo();

$existing = $repo->findById($id);
if ($existing === null) {
    json_error('NOT_FOUND', 'Evaluation not found.', 404);
}

if (!$existing['results_is_published']) {
    json_error('NOT_PUBLISHED', 'Results are not published.', 409);
}

$updated = $repo->update($id, [
    'results_is_published' => false,
    'results_published_at' => null,
]);

json_response(['evaluation' => $updated]);
