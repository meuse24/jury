<?php
// Creates dummy users and 2 evaluations (both with candidates)

$dataDir = __DIR__ . '/../data';
$now = time();

// ---- USERS ----
$users = [
    [
        'id'            => 'u0000000-0000-0000-0000-000000000001',
        'username'      => 'admin',
        'password_hash' => password_hash('admin123', PASSWORD_BCRYPT, ['cost' => 12]),
        'role'          => 'admin',
        'name'          => 'Administrator',
        'created_at'    => $now,
        'updated_at'    => $now,
    ],
    [
        'id'            => 'u0000000-0000-0000-0000-000000000002',
        'username'      => 'jury1',
        'password_hash' => password_hash('jury123', PASSWORD_BCRYPT, ['cost' => 12]),
        'role'          => 'jury',
        'name'          => 'Maria Huber',
        'created_at'    => $now,
        'updated_at'    => $now,
    ],
    [
        'id'            => 'u0000000-0000-0000-0000-000000000003',
        'username'      => 'jury2',
        'password_hash' => password_hash('jury123', PASSWORD_BCRYPT, ['cost' => 12]),
        'role'          => 'jury',
        'name'          => 'Thomas Müller',
        'created_at'    => $now,
        'updated_at'    => $now,
    ],
    [
        'id'            => 'u0000000-0000-0000-0000-000000000004',
        'username'      => 'jury3',
        'password_hash' => password_hash('jury123', PASSWORD_BCRYPT, ['cost' => 12]),
        'role'          => 'jury',
        'name'          => 'Sophie Wagner',
        'created_at'    => $now,
        'updated_at'    => $now,
    ],
];

// ---- EVALUATIONS ----
// Wertung 1: offen (Kandidaten-Modus)
$eval1OpenAt  = $now - 3600;       // vor 1h geöffnet
$eval1CloseAt = $now + 6 * 3600;   // schließt in 6h
$eval1PubAt   = $now + 7 * 3600;   // Ergebnisse in 7h

// Wertung 2: upcoming (Kandidaten-Modus)
$eval2OpenAt  = $now + 24 * 3600;
$eval2CloseAt = $now + 72 * 3600;
$eval2PubAt   = $now + 80 * 3600;

$evaluations = [
    [
        'id'                   => 'e0000000-0000-0000-0000-000000000001',
        'title'                => 'Kunstpreis 2026 – Finale',
        'description'          => 'Finalrunde mit drei Kandidaten. Bitte alle Kategorien vollständig ausfüllen.',
        'candidates'           => [
            ['id' => 'cnd00001-0000-0000-0000-000000000001', 'name' => 'Anna Schmidt',   'description' => 'Violine, klassisches Repertoire'],
            ['id' => 'cnd00001-0000-0000-0000-000000000002', 'name' => 'Ben Fischer',    'description' => 'Klavier, zeitgenössische Komposition'],
            ['id' => 'cnd00001-0000-0000-0000-000000000003', 'name' => 'Clara Hoffmann', 'description' => 'Gesang, Crossover Pop/Klassik'],
        ],
        'categories'           => [
            ['id' => 'cat00001-0000-0000-0000-000000000001', 'name' => 'Technik',       'description' => 'Technische Ausführung und Präzision',     'max_score' => 10],
            ['id' => 'cat00001-0000-0000-0000-000000000002', 'name' => 'Ausdruck',      'description' => 'Musikalischer Ausdruck und Interpretation', 'max_score' => 10],
            ['id' => 'cat00001-0000-0000-0000-000000000003', 'name' => 'Bühnenpräsenz', 'description' => 'Auftreten und Ausstrahlung auf der Bühne',  'max_score' => 5],
            ['id' => 'cat00001-0000-0000-0000-000000000004', 'name' => 'Originalität',  'description' => 'Kreativität und eigene Note',               'max_score' => 5],
        ],
        'submission_open_at'   => $eval1OpenAt,
        'submission_close_at'  => $eval1CloseAt,
        'results_publish_at'   => $eval1PubAt,
        'results_is_published' => false,
        'results_published_at' => null,
        'audience_enabled'     => true,
        'audience_max_score'   => 10,
        'jury_assignments'     => [
            'u0000000-0000-0000-0000-000000000002',
            'u0000000-0000-0000-0000-000000000003',
            'u0000000-0000-0000-0000-000000000004',
        ],
        'created_at'           => $now,
        'updated_at'           => $now,
    ],
    [
        'id'                   => 'e0000000-0000-0000-0000-000000000002',
        'title'                => 'Innovationspreis 2026',
        'description'          => 'Zwei Finalisten treten an — Bewertung pro Kandidat in allen Kategorien.',
        'candidates'           => [
            ['id' => 'cnd00002-0000-0000-0000-000000000001', 'name' => 'Lena Bauer',  'description' => 'Projekt: Smart Energy Hub'],
            ['id' => 'cnd00002-0000-0000-0000-000000000002', 'name' => 'Markus Klein', 'description' => 'Projekt: Urban Mobility Lab'],
        ],
        'categories'           => [
            ['id' => 'cat00002-0000-0000-0000-000000000001', 'name' => 'Idee',        'description' => 'Originalität und Innovationsgrad', 'max_score' => 10],
            ['id' => 'cat00002-0000-0000-0000-000000000002', 'name' => 'Umsetzung',   'description' => 'Technische Umsetzbarkeit',          'max_score' => 10],
            ['id' => 'cat00002-0000-0000-0000-000000000003', 'name' => 'Impact',      'description' => 'Gesellschaftlicher Nutzen',        'max_score' => 10],
        ],
        'submission_open_at'   => $eval2OpenAt,
        'submission_close_at'  => $eval2CloseAt,
        'results_publish_at'   => $eval2PubAt,
        'results_is_published' => false,
        'results_published_at' => null,
        'audience_enabled'     => false,
        'audience_max_score'   => 10,
        'jury_assignments'     => [
            'u0000000-0000-0000-0000-000000000002',
            'u0000000-0000-0000-0000-000000000003',
            'u0000000-0000-0000-0000-000000000004',
        ],
        'created_at'           => $now,
        'updated_at'           => $now,
    ],
];

// ---- SUBMISSIONS (Demo für Wertung 1) ----
$submissions = [
    // jury2 → Anna
    [
        'id'            => 's0000001-0000-0000-0000-000000000001',
        'evaluation_id' => 'e0000000-0000-0000-0000-000000000001',
        'candidate_id'  => 'cnd00001-0000-0000-0000-000000000001',
        'user_id'       => 'u0000000-0000-0000-0000-000000000003',
        'scores'        => [
            ['category_id' => 'cat00001-0000-0000-0000-000000000001', 'score' => 8],
            ['category_id' => 'cat00001-0000-0000-0000-000000000002', 'score' => 7],
            ['category_id' => 'cat00001-0000-0000-0000-000000000003', 'score' => 4],
            ['category_id' => 'cat00001-0000-0000-0000-000000000004', 'score' => 4],
        ],
        'comment'       => 'Sehr präzise Technik, Ausdruck überzeugend.',
        'submitted_at'  => $now - 3000,
        'updated_at'    => $now - 3000,
    ],
    // jury2 → Ben
    [
        'id'            => 's0000001-0000-0000-0000-000000000002',
        'evaluation_id' => 'e0000000-0000-0000-0000-000000000001',
        'candidate_id'  => 'cnd00001-0000-0000-0000-000000000002',
        'user_id'       => 'u0000000-0000-0000-0000-000000000003',
        'scores'        => [
            ['category_id' => 'cat00001-0000-0000-0000-000000000001', 'score' => 6],
            ['category_id' => 'cat00001-0000-0000-0000-000000000002', 'score' => 8],
            ['category_id' => 'cat00001-0000-0000-0000-000000000003', 'score' => 3],
            ['category_id' => 'cat00001-0000-0000-0000-000000000004', 'score' => 5],
        ],
        'comment'       => 'Kreativ und ausdrucksstark, Technik noch ausbaufähig.',
        'submitted_at'  => $now - 2800,
        'updated_at'    => $now - 2800,
    ],
    // jury2 → Clara
    [
        'id'            => 's0000001-0000-0000-0000-000000000003',
        'evaluation_id' => 'e0000000-0000-0000-0000-000000000001',
        'candidate_id'  => 'cnd00001-0000-0000-0000-000000000003',
        'user_id'       => 'u0000000-0000-0000-0000-000000000003',
        'scores'        => [
            ['category_id' => 'cat00001-0000-0000-0000-000000000001', 'score' => 9],
            ['category_id' => 'cat00001-0000-0000-0000-000000000002', 'score' => 9],
            ['category_id' => 'cat00001-0000-0000-0000-000000000003', 'score' => 5],
            ['category_id' => 'cat00001-0000-0000-0000-000000000004', 'score' => 5],
        ],
        'comment'       => 'Außergewöhnliche Darbietung, absolut mitreißend.',
        'submitted_at'  => $now - 2600,
        'updated_at'    => $now - 2600,
    ],
    // jury3 → Anna
    [
        'id'            => 's0000002-0000-0000-0000-000000000001',
        'evaluation_id' => 'e0000000-0000-0000-0000-000000000001',
        'candidate_id'  => 'cnd00001-0000-0000-0000-000000000001',
        'user_id'       => 'u0000000-0000-0000-0000-000000000004',
        'scores'        => [
            ['category_id' => 'cat00001-0000-0000-0000-000000000001', 'score' => 7],
            ['category_id' => 'cat00001-0000-0000-0000-000000000002', 'score' => 6],
            ['category_id' => 'cat00001-0000-0000-0000-000000000003', 'score' => 4],
            ['category_id' => 'cat00001-0000-0000-0000-000000000004', 'score' => 3],
        ],
        'comment'       => null,
        'submitted_at'  => $now - 1800,
        'updated_at'    => $now - 1800,
    ],
    // jury3 → Clara
    [
        'id'            => 's0000002-0000-0000-0000-000000000002',
        'evaluation_id' => 'e0000000-0000-0000-0000-000000000001',
        'candidate_id'  => 'cnd00001-0000-0000-0000-000000000003',
        'user_id'       => 'u0000000-0000-0000-0000-000000000004',
        'scores'        => [
            ['category_id' => 'cat00001-0000-0000-0000-000000000001', 'score' => 8],
            ['category_id' => 'cat00001-0000-0000-0000-000000000002', 'score' => 8],
            ['category_id' => 'cat00001-0000-0000-0000-000000000003', 'score' => 5],
            ['category_id' => 'cat00001-0000-0000-0000-000000000004', 'score' => 4],
        ],
        'comment'       => 'Klare Siegerin für mich.',
        'submitted_at'  => $now - 1600,
        'updated_at'    => $now - 1600,
    ],
];

// ---- AUDIENCE VOTES (Demo für Wertung 1) ----
$audienceVotes = [
    [
        'id'            => 'av000001-0000-0000-0000-000000000001',
        'evaluation_id' => 'e0000000-0000-0000-0000-000000000001',
        'device_id'     => 'device-001',
        'candidate_id'  => 'cnd00001-0000-0000-0000-000000000001',
        'score'         => null,
        'submitted_at'  => $now - 1200,
    ],
    [
        'id'            => 'av000001-0000-0000-0000-000000000002',
        'evaluation_id' => 'e0000000-0000-0000-0000-000000000001',
        'device_id'     => 'device-002',
        'candidate_id'  => 'cnd00001-0000-0000-0000-000000000003',
        'score'         => null,
        'submitted_at'  => $now - 1100,
    ],
    [
        'id'            => 'av000001-0000-0000-0000-000000000003',
        'evaluation_id' => 'e0000000-0000-0000-0000-000000000001',
        'device_id'     => 'device-003',
        'candidate_id'  => 'cnd00001-0000-0000-0000-000000000003',
        'score'         => null,
        'submitted_at'  => $now - 1000,
    ],
];

// Write files
file_put_contents($dataDir . '/users.json',       json_encode($users,       JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
file_put_contents($dataDir . '/evaluations.json', json_encode($evaluations, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
file_put_contents($dataDir . '/submissions.json', json_encode($submissions, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
file_put_contents($dataDir . '/audience_votes.json', json_encode($audienceVotes, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

echo "Dummy-Daten angelegt:\n";
echo "  Users:       " . count($users)       . " (admin + 3 Jury)\n";
echo "  Evaluations: " . count($evaluations) . " (2 Wertungen, beide mit Kandidaten)\n";
echo "  Submissions: " . count($submissions) . " (Demo-Wertungen für Wertung 1)\n";
echo "  Audience:    " . count($audienceVotes) . " Publikumsstimmen (Wertung 1)\n";
echo "\nLogins:\n";
echo "  admin  / admin123  (Admin)\n";
echo "  jury1  / jury123   (Maria Huber)\n";
echo "  jury2  / jury123   (Thomas Müller)\n";
echo "  jury3  / jury123   (Sophie Wagner)\n";
