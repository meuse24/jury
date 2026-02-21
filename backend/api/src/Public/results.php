<?php
// GET /api/public/evaluations/:id/results

require_once __DIR__ . '/../Repository/repositories.php';

$id   = $_route_params['id'];
$eval = eval_repo()->findById($id);
$now  = now_ts();

if ($eval === null || !$eval['results_is_published'] || $now < $eval['results_publish_at']) {
    json_error('NOT_FOUND', 'Results not found or not yet available.', 404);
}

$submissions = submission_repo()->findByEvaluation($id);
$candidates  = $eval['candidates'] ?? [];
$audienceEnabled = $eval['audience_enabled'] ?? false;
$audienceVotes   = $audienceEnabled ? audience_vote_repo()->findByEvaluation($id) : [];
$audienceCount   = count($audienceVotes);
$audienceHasVotes = $audienceEnabled && $audienceCount > 0;
$totalJuryCount  = count($eval['jury_assignments'] ?? []) + ($audienceEnabled ? 1 : 0);
$totalMaxPerEntry = array_sum(array_column($eval['categories'], 'max_score'));

// ---- Helper: aggregate scores per category ----
function aggregate_scores(array $submissions, array $categories): array
{
    $totals = []; $maxes = [];
    foreach ($categories as $cat) { $totals[$cat['id']] = 0; $maxes[$cat['id']] = $cat['max_score']; }

    $count = count($submissions);
    foreach ($submissions as $sub) {
        foreach ($sub['scores'] as $entry) {
            if (isset($totals[$entry['category_id']])) {
                $totals[$entry['category_id']] += $entry['score'];
            }
        }
    }

    $categoryResults = [];
    $totalSum = 0;
    foreach ($categories as $cat) {
        $sum = round($totals[$cat['id']], 2);
        $avg = $count > 0 ? round($sum / $count, 2) : null;
        $categoryResults[] = [
            'id'        => $cat['id'],
            'name'      => $cat['name'],
            'max_score' => $cat['max_score'],
            'sum'       => $sum,
            'average'   => $avg,
        ];
        $totalSum += $sum;
    }

    $totalAvg = $count > 0 ? round($totalSum / $count, 2) : null;
    $totalMax = array_sum(array_column($categories, 'max_score'));

    return [
        'submission_count' => $count,
        'total_sum'        => $totalSum,
        'total_max'        => $totalMax * $count,
        'total_average'    => $totalAvg,
        'max_per_entry'    => $totalMax,
        'categories'       => $categoryResults,
    ];
}

function audience_scores_for_categories(float $totalScore, array $categories): array
{
    $totalMax = array_sum(array_column($categories, 'max_score'));
    if ($totalMax <= 0) return [];
    $scores = [];
    foreach ($categories as $cat) {
        $ratio = $cat['max_score'] / $totalMax;
        $scores[] = [
            'category_id' => $cat['id'],
            'score'       => round($totalScore * $ratio, 2),
        ];
    }
    return $scores;
}

$evalInfo = [
    'id'          => $eval['id'],
    'title'       => $eval['title'],
    'description' => $eval['description'],
    'published_at' => $eval['results_published_at'],
];

// ---- With candidates: per-candidate aggregation ----
if (count($candidates) > 0) {
    $totalVotes = $audienceHasVotes ? count($audienceVotes) : 0;

    $candidateResults = [];
    foreach ($candidates as $candidate) {
        $candidateSubs = array_values(array_filter(
            $submissions,
            fn($s) => ($s['candidate_id'] ?? null) === $candidate['id']
        ));
        if ($audienceHasVotes) {
            $votesForCandidate = count(array_filter(
                $audienceVotes,
                fn($v) => ($v['candidate_id'] ?? null) === $candidate['id']
            ));
            $audScore = $totalVotes > 0 ? ($votesForCandidate / $totalVotes) * $totalMaxPerEntry : 0;
            $candidateSubs[] = [
                'scores'       => audience_scores_for_categories($audScore, $eval['categories']),
                'candidate_id' => $candidate['id'],
            ];
        }
        $agg = aggregate_scores($candidateSubs, $eval['categories']);
        $candidateResults[] = [
            'id'          => $candidate['id'],
            'name'        => $candidate['name'],
            'description' => $candidate['description'] ?? '',
            'results'     => $agg,
        ];
    }

    // Sort by total_average descending (highest first)
    usort($candidateResults, fn($a, $b) =>
        ($b['results']['total_average'] ?? -1) <=> ($a['results']['total_average'] ?? -1)
    );

    // Add rank
    foreach ($candidateResults as $i => &$cr) {
        $cr['rank'] = $i + 1;
    }
    unset($cr);

    $response = [
        'evaluation'       => $evalInfo,
        'mode'             => 'candidates',
        'total_jury_count' => $totalJuryCount,
        'candidates'       => $candidateResults,
    ];
    if ($audienceEnabled) {
        $response['audience_participant_count'] = $audienceCount;
    }
    json_response($response);
}

// ---- Without candidates: simple aggregation (backward compat) ----
$subsForAgg = $submissions;
if ($audienceHasVotes) {
    $sumScores = array_sum(array_map(fn($v) => $v['score'] ?? 0, $audienceVotes));
    $avgScore  = $audienceCount > 0 ? ($sumScores / $audienceCount) : 0;
    $audMax    = $eval['audience_max_score'] ?? 10;
    $normalized = $audMax > 0 ? ($avgScore / $audMax) * $totalMaxPerEntry : 0;
    $subsForAgg[] = [
        'scores' => audience_scores_for_categories($normalized, $eval['categories']),
    ];
}
$agg = aggregate_scores($subsForAgg, $eval['categories']);
$response = [
    'evaluation'       => $evalInfo,
    'mode'             => 'simple',
    'total_jury_count' => $totalJuryCount,
    'results'          => $agg,
];
if ($audienceEnabled) {
    $response['audience_participant_count'] = $audienceCount;
}
json_response($response);
