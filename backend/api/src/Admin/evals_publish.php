<?php
// POST /api/admin/evaluations/:id/publish-results
//
// Decision (documented):
// We allow the admin to call publish at any time, but the public endpoint
// still enforces now >= results_publish_at. This means the toggle alone
// is not enough — the time gate is the final guard. This lets admins
// "pre-arm" the publish flag and have results go live automatically
// once the time window opens (or instantly if already past).

require_once __DIR__ . '/../Repository/repositories.php';
require_role('admin');

$id   = $_route_params['id'];
$repo = eval_repo();

$existing = $repo->findById($id);
if ($existing === null) {
    json_error('NOT_FOUND', 'Evaluation not found.', 404);
}

if ($existing['results_is_published']) {
    json_error('ALREADY_PUBLISHED', 'Results are already published.', 409);
}

$updated = $repo->update($id, [
    'results_is_published' => true,
    'results_published_at' => now_ts(),
]);

json_response(['evaluation' => $updated]);
