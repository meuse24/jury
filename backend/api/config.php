<?php
// ===================================================================
// config.php — Central configuration
// ===================================================================

// Base path when deployed in a subfolder (no trailing slash)
define('BASE_PATH', getenv('APP_BASE_PATH') ?: '/jurysystem');

// Data directory: one level above api/, sibling of index.html
// In dist layout: dist/data/
define('DATA_DIR', realpath(__DIR__ . '/../../data') ?: (__DIR__ . '/../../data'));

// Session settings
define('SESSION_NAME', 'jury_sess');
define('SESSION_LIFETIME', 3600 * 8); // 8 hours

// CSRF: we use SameSite=Strict + checking Origin/Referer for state-changing
// requests. No separate CSRF token needed for same-origin SPA with credentials.
// See SECURITY.md for rationale.

// Password hashing
define('PASSWORD_ALGO', PASSWORD_BCRYPT);
define('PASSWORD_COST', ['cost' => 12]);
