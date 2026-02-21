<?php
// GET /api/admin/evaluations

require_once __DIR__ . '/../Repository/repositories.php';
require_role('admin');

$evals = array_values(eval_repo()->findAll());
foreach ($evals as &$ev) {
    if (($ev['audience_enabled'] ?? false) === true) {
        $ev['audience_participant_count'] = audience_vote_repo()->countByEvaluation($ev['id']);
    }
}
unset($ev);

json_response(['evaluations' => $evals]);
