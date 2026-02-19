#!/usr/bin/env bash
# ===================================================================
# build.sh — Full production build
# Assembles /dist ready for FTP deployment to World4You.
#
# Usage:
#   ./scripts/build.sh [base_path]
#   Default base_path: /jurysystem
#
# Result: dist/ contains everything needed for deployment.
# ===================================================================

set -euo pipefail

BASE_PATH="${1:-/jurysystem}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$SCRIPT_DIR/.."
DIST="$ROOT/dist"

echo "==> Building Jury System"
echo "    Base path: $BASE_PATH"

# 1. Clean dist
rm -rf "$DIST"
mkdir -p "$DIST"

# 2. Build frontend (outputs to dist/ via vite.config.ts)
echo "==> Building frontend…"
cd "$ROOT/frontend"
VITE_BASE_PATH="$BASE_PATH" npm run build
cd "$ROOT"

# 3. Copy PHP backend into dist/api/
echo "==> Copying backend…"
cp -r "$ROOT/backend/api" "$DIST/api"

# 4. Create dist/data/ with .htaccess protection + copy seed data
echo "==> Setting up data directory…"
mkdir -p "$DIST/data"
cp "$ROOT/data/.htaccess" "$DIST/data/.htaccess"
# Copy JSON data files if they exist (dummy/seed data)
for f in "$ROOT/data/"*.json; do
    [ -f "$f" ] && cp "$f" "$DIST/data/" && echo "    Copied: $(basename $f)"
done

# 5. Write root .htaccess (SPA + API routing)
echo "==> Writing root .htaccess…"
REWRITE_BASE="${BASE_PATH}/"
cat > "$DIST/.htaccess" <<HTACCESS
Options -Indexes

RewriteEngine On
RewriteBase ${REWRITE_BASE}

# Block data/ directory
RewriteRule ^data(/|$) - [F,L]

# Route /api/* to PHP router
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^api/(.*)$ api/index.php [QSA,L]

# SPA fallback: everything else → index.html
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.html [QSA,L]
HTACCESS

# 6. Patch backend config.php with base path
echo "==> Patching config.php with BASE_PATH…"
sed -i "s|define('BASE_PATH', getenv.*|define('BASE_PATH', '${BASE_PATH}');|" "$DIST/api/config.php"

# 7. Patch api .htaccess RewriteBase
sed -i "s|RewriteBase /jurysystem/api/|RewriteBase ${BASE_PATH}/api/|" "$DIST/api/.htaccess"

echo ""
echo "==> Build complete: $DIST"
echo ""
echo "Contents:"
ls -la "$DIST/"
echo ""
echo "Next steps:"
echo "  1. Upload the contents of dist/ to your server under: $BASE_PATH/"
echo "  2. Run the seed script on the server (see DEPLOYMENT.md)"
echo "  3. Ensure data/ is writable by the web server user."
