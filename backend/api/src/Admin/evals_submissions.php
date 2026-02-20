<?php
// GET /api/admin/evaluations/:id/submissions
// Returns submission status for each assigned jury member.
// For evaluations with candidates, reports per-candidate status.

require_once __DIR__ . '/../Repository/repositories.php';
require_role('admin');

$id   = $_route_params['id'];
$eval = eval_repo()->findById($id);
if ($eval === null) {
    json_error('NOT_FOUND', 'Evaluation not found.', 404);
}

$userRepo   = user_repo();
$subRepo    = submission_repo();
$candidates = $eval['candidates'] ?? [];
$hasCandidates = count($candidates) > 0;

$result = [];
foreach ($eval['jury_assignments'] as $userId) {
    $user = $userRepo->findById($userId);
    // User may have been deleted after assignment; report as unknown but don't crash
    $name     = $user['name']     ?? '(gelöscht)';
    $username = $user['username'] ?? '(gelöscht)';
    $subs = $subRepo->findByUserAndEvaluation($userId, $id);

    if ($hasCandidates) {
        // Build a map: candidate_id => submission
        $subMap = [];
        foreach ($subs as $s) {
            if ($s['candidate_id'] !== null) {
                $subMap[$s['candidate_id']] = $s;
            }
        }
        $candidateStatus = [];
        foreach ($candidates as $cand) {
            $sub = $subMap[$cand['id']] ?? null;
            $candidateStatus[] = [
                'candidate_id'   => $cand['id'],
                'candidate_name' => $cand['name'],
                'has_submission' => $sub !== null,
                'submitted_at'   => $sub['submitted_at'] ?? null,
                'updated_at'     => $sub['updated_at']   ?? null,
            ];
        }
        $totalSubmitted = count($subMap);
        $result[] = [
            'user_id'           => $userId,
            'name'              => $name,
            'username'          => $username,
            'has_submission'    => $totalSubmitted > 0,
            'submission_count'  => $totalSubmitted,
            'candidate_count'   => count($candidates),
            'candidates'        => $candidateStatus,
            'submitted_at'      => null,
            'updated_at'        => null,
        ];
    } else {
        $sub = !empty($subs) ? $subs[0] : null;
        $result[] = [
            'user_id'        => $userId,
            'name'           => $name,
            'username'       => $username,
            'has_submission' => $sub !== null,
            'submitted_at'   => $sub['submitted_at'] ?? null,
            'updated_at'     => $sub['updated_at']   ?? null,
        ];
    }
}

json_response(['submissions' => $result, 'has_candidates' => $hasCandidates]);
