<?php
// ===================================================================
// config.php — Central configuration
// ===================================================================

// Base path when deployed in a subfolder (no trailing slash)
define('BASE_PATH', getenv('APP_BASE_PATH') ?: '/jurysystem');

// Debug mode (set APP_DEBUG=1 in environment)
define('APP_DEBUG', getenv('APP_DEBUG') === '1');

// Data directory auto-detection:
//   dist layout:  api/ sits next to data/  → ../data
//   dev layout:   backend/api/ → ../../data
$_dataDir = is_dir(__DIR__ . '/../data')
    ? realpath(__DIR__ . '/../data')   // dist: /apps/jury/data
    : realpath(__DIR__ . '/../../data'); // dev: /projects/jury/data
define('DATA_DIR', $_dataDir ?: __DIR__ . '/../data');
unset($_dataDir);

// Session settings
define('SESSION_NAME', 'jury_sess');
define('SESSION_LIFETIME', 3600 * 8); // 8 hours

// CSRF: we use SameSite=Strict + checking Origin/Referer for state-changing
// requests. No separate CSRF token needed for same-origin SPA with credentials.
// See SECURITY.md for rationale.

// Password hashing
define('PASSWORD_ALGO', PASSWORD_BCRYPT);
define('PASSWORD_COST', ['cost' => 12]);
