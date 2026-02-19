<?php
// GET /api/jury/evaluations

require_once __DIR__ . '/../Repository/repositories.php';
$user = require_role('jury');

$now      = now_ts();
$allEvals = eval_repo()->findAll();
$subRepo  = submission_repo();

$result = [];
foreach ($allEvals as $eval) {
    if (!in_array($user['id'], $eval['jury_assignments'] ?? [], true)) {
        continue;
    }

    $status = 'upcoming';
    if ($now >= $eval['submission_open_at'] && $now <= $eval['submission_close_at']) {
        $status = 'open';
    } elseif ($now > $eval['submission_close_at']) {
        $status = 'closed';
    }

    $subs      = $subRepo->findByUserAndEvaluation($user['id'], $eval['id']);
    $candidates = $eval['candidates'] ?? [];

    if (count($candidates) > 0) {
        $submittedCandidateIds = array_map(fn($s) => $s['candidate_id'] ?? null, $subs);
        $submittedCount        = count(array_filter($submittedCandidateIds));
        $hasSubmission         = $submittedCount > 0;
        $submissionSummary     = "$submittedCount/" . count($candidates);
    } else {
        $hasSubmission     = count($subs) > 0;
        $submissionSummary = $hasSubmission ? '1/1' : '0/1';
    }

    $result[] = [
        'id'                  => $eval['id'],
        'title'               => $eval['title'],
        'description'         => $eval['description'],
        'submission_open_at'  => $eval['submission_open_at'],
        'submission_close_at' => $eval['submission_close_at'],
        'status'              => $status,
        'candidate_count'     => count($candidates),
        'has_submission'      => $hasSubmission,
        'submission_summary'  => $submissionSummary,
    ];
}

json_response(['evaluations' => $result]);
