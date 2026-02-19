<?php
// PUT /api/admin/evaluations/:id/assignments
// Body: { "jury_user_ids": ["uuid", ...] }

require_once __DIR__ . '/../Repository/repositories.php';
require_role('admin');

$id       = $_route_params['id'];
$evalRepo = eval_repo();
$userRepo = user_repo();

$existing = $evalRepo->findById($id);
if ($existing === null) {
    json_error('NOT_FOUND', 'Evaluation not found.', 404);
}

$body = request_body();
if (!array_key_exists('jury_user_ids', $body) || !is_array($body['jury_user_ids'])) {
    json_error('MISSING_FIELD', 'jury_user_ids must be an array.', 422);
}

$ids = $body['jury_user_ids'];

// Validate each user exists and has role=jury
foreach ($ids as $uid) {
    $user = $userRepo->findById($uid);
    if ($user === null) {
        json_error('USER_NOT_FOUND', "User '$uid' not found.", 404);
    }
    if ($user['role'] !== 'jury') {
        json_error('NOT_JURY_MEMBER', "User '$uid' does not have the jury role.", 422);
    }
}

$updated = $evalRepo->update($id, ['jury_assignments' => array_values(array_unique($ids))]);
json_response(['evaluation' => $updated]);
