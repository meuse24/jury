<?php
// ===================================================================
// seed.php — CLI seed script: creates initial admin user
// Run once: php backend/api/seed.php
// ===================================================================

declare(strict_types=1);
chdir(__DIR__);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/src/helpers.php';
require_once __DIR__ . '/src/Model/models.php';
require_once __DIR__ . '/src/Repository/repositories.php';

// Allow override via env
$username = getenv('SEED_ADMIN_USER')     ?: 'admin';
$password = getenv('SEED_ADMIN_PASSWORD') ?: 'changeme123';
$name     = getenv('SEED_ADMIN_NAME')     ?: 'Administrator';

$repo = user_repo();
$existing = $repo->findByUsername($username);
if ($existing !== null) {
    echo "User '$username' already exists (id: {$existing['id']}). Skipping.\n";
    exit(0);
}

$hash = password_hash($password, PASSWORD_ALGO, PASSWORD_COST);
$user = make_user($username, $hash, 'admin', $name);
$repo->create($user);

echo "Created admin user:\n";
echo "  Username: $username\n";
echo "  Password: $password\n";
echo "  ID:       {$user['id']}\n";
echo "\nChange the password immediately after first login!\n";
