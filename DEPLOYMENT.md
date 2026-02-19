# Deployment-Anleitung — Jury System

## Voraussetzungen

- PHP 8.x mit `mod_rewrite` (aktiviert bei World4You)
- FTP-Zugang zum Shared Hosting
- Node.js 18+ lokal für den Build

---

## 1. Produktions-Build erstellen

```bash
# Standardmäßig wird /jurysystem als Basispfad verwendet:
./scripts/build.sh

# Oder mit eigenem Basispfad:
./scripts/build.sh /mein-pfad
```

Danach enthält `dist/` alles, was hochgeladen werden muss.

---

## 2. Auf den Server hochladen (FTP)

Lade den **Inhalt** von `dist/` in den Unterordner `/jurysystem/` auf dem Server:

```
dist/
  index.html          → /jurysystem/index.html
  assets/             → /jurysystem/assets/
  .htaccess           → /jurysystem/.htaccess
  api/                → /jurysystem/api/
  data/               → /jurysystem/data/
```

> **Wichtig:** Achte darauf, dass auch versteckte Dateien (.htaccess) übertragen werden.
> In FileZilla: Ansicht → Versteckte Dateien anzeigen.

---

## 3. Datenordner konfigurieren

Der `data/` Ordner muss für den Webserver-User beschreibbar sein:

```bash
# Über SSH (falls verfügbar):
chmod 770 /path/to/jurysystem/data/
```

Bei World4You kannst du die Rechte über den Dateimanager im CPanel setzen.

---

## 4. Seed-Script ausführen (initialer Admin-User)

**Option A: SSH**
```bash
cd /path/to/jurysystem
php api/seed.php
# oder mit eigenen Daten:
SEED_ADMIN_USER=myadmin SEED_ADMIN_PASSWORD=sicherespasswort php api/seed.php
```

**Option B: Ohne SSH (FTP-only)**
Erstelle eine temporäre Datei `run_seed.php` im Webroot mit:
```php
<?php
chdir(__DIR__ . '/api');
require __DIR__ . '/api/seed.php';
```
Rufe sie einmal über den Browser auf, lösche sie danach sofort!

---

## 5. Ersten Login testen

1. Öffne `https://deine-domain.at/jurysystem/`
2. Melde dich mit `admin` / `changeme123` an (oder dein eigenes Passwort)
3. **Sofort das Passwort ändern** unter Benutzer → Bearbeiten

---

## 6. Datensicherheit prüfen

Teste, dass JSON-Dateien nicht direkt abrufbar sind:
```bash
curl -I https://deine-domain.at/jurysystem/data/users.json
# Muss: HTTP 403 Forbidden zurückgeben
```

---

## Lokale Entwicklung

```bash
# Terminal 1: PHP Backend
cd backend/api
php -S localhost:8000 -t . index.php

# Terminal 2: Vite Frontend
cd frontend
npm run dev
```

Frontend läuft auf http://localhost:5173/jurysystem/
API-Calls werden automatisch an http://localhost:8000 weitergeleitet.

---

## Annahmen & Designentscheidungen

| Entscheidung | Wahl | Begründung |
|---|---|---|
| Auth | PHP Sessions (SameSite=Strict, HttpOnly) | Einfach, sicher, kein Token-Management nötig |
| CSRF | Origin/Referer-Check + SameSite=Strict | Kein separates CSRF-Token nötig für SPA |
| Publish-Gate | Admin-Toggle UND Zeitschranke | Admin kann vorab "armen", Zeit ist endgültiger Schutz |
| Unpublished → HTTP | 404 (nicht 403) | Verhindert Info-Leakage über Existenz einer Wertung |
| JSON Concurrency | flock() + temp file rename | Atomic, kein ext. DB-Lock nötig auf Shared Hosting |
| Password | bcrypt, cost=12 | Sicher, PHP-Standard |
| Frontend | React SPA + React Router | Einfacher als Astro für diese Komplexität |

---

## Datei-Struktur auf dem Server

```
/jurysystem/
  .htaccess          ← Routing: SPA fallback + API dispatch + data/ deny
  index.html         ← SPA Entry
  assets/            ← Vite-compiled JS + CSS
  api/
    .htaccess        ← Rewrite alle Requests auf index.php
    index.php        ← Front Controller
    config.php       ← Konfiguration (BASE_PATH, DATA_DIR, session)
    seed.php         ← CLI Seed (einmalig ausführen)
    src/             ← Backend-Source
  data/
    .htaccess        ← Deny all HTTP access
    users.json       ← Benutzerdaten (auto-erstellt)
    evaluations.json ← Wertungsdaten (auto-erstellt)
    submissions.json ← Einreichungen (auto-erstellt)
```
