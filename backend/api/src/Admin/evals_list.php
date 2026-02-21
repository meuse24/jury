<?php
// GET /api/admin/evaluations

require_once __DIR__ . '/../Repository/repositories.php';
require_role('admin');

$evals = array_values(eval_repo()->findAll());
$needsAudience = array_filter($evals, fn($e) => ($e['audience_enabled'] ?? false) === true);

$audienceCounts = [];
if (count($needsAudience) > 0) {
    $votes = audience_vote_repo()->findAll();
    foreach ($votes as $v) {
        $eid = $v['evaluation_id'] ?? null;
        if ($eid !== null) {
            $audienceCounts[$eid] = ($audienceCounts[$eid] ?? 0) + 1;
        }
    }
}

foreach ($evals as &$ev) {
    if (($ev['audience_enabled'] ?? false) === true) {
        $ev['audience_participant_count'] = $audienceCounts[$ev['id']] ?? 0;
    }
}
unset($ev);

json_response(['evaluations' => $evals]);
