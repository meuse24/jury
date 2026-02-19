<?php
// Creates dummy users and evaluations for testing

$dataDir = __DIR__ . '/../data';

$now = time();

// ---- USERS ----
$users = [
    [
        'id'            => 'a1b2c3d4-0001-0000-0000-000000000001',
        'username'      => 'admin',
        'password_hash' => password_hash('admin123', PASSWORD_BCRYPT, ['cost' => 12]),
        'role'          => 'admin',
        'name'          => 'Administrator',
        'created_at'    => $now,
        'updated_at'    => $now,
    ],
    [
        'id'            => 'a1b2c3d4-0002-0000-0000-000000000002',
        'username'      => 'jury1',
        'password_hash' => password_hash('jury123', PASSWORD_BCRYPT, ['cost' => 12]),
        'role'          => 'jury',
        'name'          => 'Maria Huber',
        'created_at'    => $now,
        'updated_at'    => $now,
    ],
    [
        'id'            => 'a1b2c3d4-0003-0000-0000-000000000003',
        'username'      => 'jury2',
        'password_hash' => password_hash('jury123', PASSWORD_BCRYPT, ['cost' => 12]),
        'role'          => 'jury',
        'name'          => 'Thomas Müller',
        'created_at'    => $now,
        'updated_at'    => $now,
    ],
    [
        'id'            => 'a1b2c3d4-0004-0000-0000-000000000004',
        'username'      => 'jury3',
        'password_hash' => password_hash('jury123', PASSWORD_BCRYPT, ['cost' => 12]),
        'role'          => 'jury',
        'name'          => 'Sophie Wagner',
        'created_at'    => $now,
        'updated_at'    => $now,
    ],
];

// ---- EVALUATIONS ----
// Wertung 1: läuft gerade (Einreichfenster offen), einfacher Modus (keine Kandidaten)
$eval1OpenAt  = $now - 3600;       // vor 1h geöffnet
$eval1CloseAt = $now + 3 * 3600;  // schließt in 3h
$eval1PubAt   = $now + 4 * 3600;  // Ergebnisse in 4h

// Wertung 2: noch nicht geöffnet (upcoming), einfacher Modus
$eval2OpenAt  = $now + 24 * 3600;
$eval2CloseAt = $now + 48 * 3600;
$eval2PubAt   = $now + 50 * 3600;

// Wertung 3: offen, Kandidaten-Modus (3 Finalisten)
$eval3OpenAt  = $now - 2 * 3600;  // vor 2h geöffnet
$eval3CloseAt = $now + 7 * 24 * 3600; // 7 Tage offen
$eval3PubAt   = $now + 8 * 24 * 3600;

$evaluations = [
    [
        'id'                   => 'b2c3d4e5-0001-0000-0000-000000000001',
        'title'                => 'Musikwettbewerb 2026 – Hauptrunde',
        'description'          => 'Bewertung der Finalisten des städtischen Musikwettbewerbs. Bitte alle Kategorien sorgfältig ausfüllen.',
        'candidates'           => [],
        'categories'           => [
            ['id' => 'c1000001-0000-0000-0000-000000000001', 'name' => 'Technik',       'description' => 'Technische Ausführung und Präzision',     'max_score' => 10],
            ['id' => 'c1000001-0000-0000-0000-000000000002', 'name' => 'Ausdruck',      'description' => 'Musikalischer Ausdruck und Interpretation', 'max_score' => 10],
            ['id' => 'c1000001-0000-0000-0000-000000000003', 'name' => 'Bühnenpräsenz', 'description' => 'Auftreten und Ausstrahlung auf der Bühne',  'max_score' => 5],
            ['id' => 'c1000001-0000-0000-0000-000000000004', 'name' => 'Originalität',  'description' => 'Kreativität und eigene Note',               'max_score' => 5],
        ],
        'submission_open_at'   => $eval1OpenAt,
        'submission_close_at'  => $eval1CloseAt,
        'results_publish_at'   => $eval1PubAt,
        'results_is_published' => false,
        'results_published_at' => null,
        'jury_assignments'     => [
            'a1b2c3d4-0002-0000-0000-000000000002',
            'a1b2c3d4-0003-0000-0000-000000000003',
            'a1b2c3d4-0004-0000-0000-000000000004',
        ],
        'created_at'           => $now,
        'updated_at'           => $now,
    ],
    [
        'id'                   => 'b2c3d4e5-0002-0000-0000-000000000002',
        'title'                => 'Nachwuchspreis 2026',
        'description'          => 'Bewertung der Nachwuchskandidaten unter 18 Jahren.',
        'candidates'           => [],
        'categories'           => [
            ['id' => 'c2000002-0000-0000-0000-000000000001', 'name' => 'Technik',    'description' => 'Technische Grundlagen',    'max_score' => 10],
            ['id' => 'c2000002-0000-0000-0000-000000000002', 'name' => 'Potenzial',  'description' => 'Entwicklungspotenzial',    'max_score' => 10],
            ['id' => 'c2000002-0000-0000-0000-000000000003', 'name' => 'Engagement', 'description' => 'Einsatz und Begeisterung', 'max_score' => 10],
        ],
        'submission_open_at'   => $eval2OpenAt,
        'submission_close_at'  => $eval2CloseAt,
        'results_publish_at'   => $eval2PubAt,
        'results_is_published' => false,
        'results_published_at' => null,
        'jury_assignments'     => [
            'a1b2c3d4-0002-0000-0000-000000000002',
            'a1b2c3d4-0003-0000-0000-000000000003',
        ],
        'created_at'           => $now,
        'updated_at'           => $now,
    ],
    [
        'id'                   => 'b2c3d4e5-0003-0000-0000-000000000003',
        'title'                => 'Talentwettbewerb 2026 – Kandidaten',
        'description'          => 'Drei Finalisten treten an — die Jury bewertet jeden Kandidaten einzeln in allen Kategorien.',
        'candidates'           => [
            ['id' => 'd0cand01-0003-0000-0000-000000000001', 'name' => 'Anna Schmidt',    'description' => 'Violine, klassisches Repertoire'],
            ['id' => 'd0cand02-0003-0000-0000-000000000002', 'name' => 'Benedikt Maier',  'description' => 'Klavier, zeitgenössische Komposition'],
            ['id' => 'd0cand03-0003-0000-0000-000000000003', 'name' => 'Clara Hoffmann',  'description' => 'Gesang, Crossover Pop/Klassik'],
        ],
        'categories'           => [
            ['id' => 'c3000003-0000-0000-0000-000000000001', 'name' => 'Technik',       'description' => 'Technische Ausführung und Präzision',     'max_score' => 10],
            ['id' => 'c3000003-0000-0000-0000-000000000002', 'name' => 'Ausdruck',      'description' => 'Musikalischer Ausdruck und Interpretation', 'max_score' => 10],
            ['id' => 'c3000003-0000-0000-0000-000000000003', 'name' => 'Bühnenpräsenz', 'description' => 'Auftreten und Ausstrahlung auf der Bühne',  'max_score' => 5],
            ['id' => 'c3000003-0000-0000-0000-000000000004', 'name' => 'Originalität',  'description' => 'Kreativität und eigene Note',               'max_score' => 5],
        ],
        'submission_open_at'   => $eval3OpenAt,
        'submission_close_at'  => $eval3CloseAt,
        'results_publish_at'   => $eval3PubAt,
        'results_is_published' => false,
        'results_published_at' => null,
        'jury_assignments'     => [
            'a1b2c3d4-0002-0000-0000-000000000002',
            'a1b2c3d4-0003-0000-0000-000000000003',
            'a1b2c3d4-0004-0000-0000-000000000004',
        ],
        'created_at'           => $now,
        'updated_at'           => $now,
    ],
];

// ---- SUBMISSIONS (Demo-Wertungen für Wertung 3) ----
// jury2 (Thomas Müller) bewertet alle 3 Kandidaten
// jury3 (Sophie Wagner) bewertet Anna + Clara
// jury1 (Maria Huber) noch keine abgegeben
$submissions = [
    // jury2 → Anna Schmidt
    [
        'id'            => 'f0000001-0000-0000-0000-000000000001',
        'evaluation_id' => 'b2c3d4e5-0003-0000-0000-000000000003',
        'candidate_id'  => 'd0cand01-0003-0000-0000-000000000001',
        'user_id'       => 'a1b2c3d4-0003-0000-0000-000000000003',
        'scores'        => [
            ['category_id' => 'c3000003-0000-0000-0000-000000000001', 'score' => 8],
            ['category_id' => 'c3000003-0000-0000-0000-000000000002', 'score' => 7],
            ['category_id' => 'c3000003-0000-0000-0000-000000000003', 'score' => 4],
            ['category_id' => 'c3000003-0000-0000-0000-000000000004', 'score' => 4],
        ],
        'comment'       => 'Sehr präzise Technik, Ausdruck überzeugend.',
        'submitted_at'  => $now - 3000,
        'updated_at'    => $now - 3000,
    ],
    // jury2 → Benedikt Maier
    [
        'id'            => 'f0000001-0000-0000-0000-000000000002',
        'evaluation_id' => 'b2c3d4e5-0003-0000-0000-000000000003',
        'candidate_id'  => 'd0cand02-0003-0000-0000-000000000002',
        'user_id'       => 'a1b2c3d4-0003-0000-0000-000000000003',
        'scores'        => [
            ['category_id' => 'c3000003-0000-0000-0000-000000000001', 'score' => 6],
            ['category_id' => 'c3000003-0000-0000-0000-000000000002', 'score' => 8],
            ['category_id' => 'c3000003-0000-0000-0000-000000000003', 'score' => 3],
            ['category_id' => 'c3000003-0000-0000-0000-000000000004', 'score' => 5],
        ],
        'comment'       => 'Kreativ und ausdrucksstark, Technik noch ausbaufähig.',
        'submitted_at'  => $now - 2880,
        'updated_at'    => $now - 2880,
    ],
    // jury2 → Clara Hoffmann
    [
        'id'            => 'f0000001-0000-0000-0000-000000000003',
        'evaluation_id' => 'b2c3d4e5-0003-0000-0000-000000000003',
        'candidate_id'  => 'd0cand03-0003-0000-0000-000000000003',
        'user_id'       => 'a1b2c3d4-0003-0000-0000-000000000003',
        'scores'        => [
            ['category_id' => 'c3000003-0000-0000-0000-000000000001', 'score' => 9],
            ['category_id' => 'c3000003-0000-0000-0000-000000000002', 'score' => 9],
            ['category_id' => 'c3000003-0000-0000-0000-000000000003', 'score' => 5],
            ['category_id' => 'c3000003-0000-0000-0000-000000000004', 'score' => 5],
        ],
        'comment'       => 'Außergewöhnliche Darbietung, absolut mitreißend.',
        'submitted_at'  => $now - 2760,
        'updated_at'    => $now - 2760,
    ],
    // jury3 → Anna Schmidt
    [
        'id'            => 'f0000002-0000-0000-0000-000000000001',
        'evaluation_id' => 'b2c3d4e5-0003-0000-0000-000000000003',
        'candidate_id'  => 'd0cand01-0003-0000-0000-000000000001',
        'user_id'       => 'a1b2c3d4-0004-0000-0000-000000000004',
        'scores'        => [
            ['category_id' => 'c3000003-0000-0000-0000-000000000001', 'score' => 7],
            ['category_id' => 'c3000003-0000-0000-0000-000000000002', 'score' => 6],
            ['category_id' => 'c3000003-0000-0000-0000-000000000003', 'score' => 4],
            ['category_id' => 'c3000003-0000-0000-0000-000000000004', 'score' => 3],
        ],
        'comment'       => null,
        'submitted_at'  => $now - 1800,
        'updated_at'    => $now - 1800,
    ],
    // jury3 → Clara Hoffmann
    [
        'id'            => 'f0000002-0000-0000-0000-000000000003',
        'evaluation_id' => 'b2c3d4e5-0003-0000-0000-000000000003',
        'candidate_id'  => 'd0cand03-0003-0000-0000-000000000003',
        'user_id'       => 'a1b2c3d4-0004-0000-0000-000000000004',
        'scores'        => [
            ['category_id' => 'c3000003-0000-0000-0000-000000000001', 'score' => 8],
            ['category_id' => 'c3000003-0000-0000-0000-000000000002', 'score' => 8],
            ['category_id' => 'c3000003-0000-0000-0000-000000000003', 'score' => 5],
            ['category_id' => 'c3000003-0000-0000-0000-000000000004', 'score' => 4],
        ],
        'comment'       => 'Klare Siegerin für mich.',
        'submitted_at'  => $now - 1680,
        'updated_at'    => $now - 1680,
    ],
];

// Write files
file_put_contents($dataDir . '/users.json',       json_encode($users,       JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
file_put_contents($dataDir . '/evaluations.json', json_encode($evaluations, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
file_put_contents($dataDir . '/submissions.json', json_encode($submissions, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

echo "Dummy-Daten angelegt:\n";
echo "  Users:       " . count($users)       . " (admin + 3 Jury)\n";
echo "  Evaluations: " . count($evaluations) . "\n";
echo "  Submissions: " . count($submissions) . " (Demo-Wertungen für Wertung 3)\n";
echo "\nLogins:\n";
echo "  admin  / admin123  (Admin)\n";
echo "  jury1  / jury123   (Maria Huber)\n";
echo "  jury2  / jury123   (Thomas Müller)\n";
echo "  jury3  / jury123   (Sophie Wagner)\n";
echo "\nWertung 1 'Musikwettbewerb 2026' ist jetzt OFFEN  – einfacher Modus (alle 3 Jury)\n";
echo "Wertung 2 'Nachwuchspreis 2026'  öffnet morgen    – einfacher Modus (jury1+jury2)\n";
echo "Wertung 3 'Talentwettbewerb 2026' ist OFFEN       – Kandidaten-Modus (3 Finalisten, alle 3 Jury)\n";
echo "  Demo-Wertungen: jury2 alle 3 Kandidaten, jury3 zwei Kandidaten, jury1 noch keine\n";
