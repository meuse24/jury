# Deployment-Anleitung — Jury System

## Voraussetzungen

- PHP 8.x mit `mod_rewrite` (aktiviert bei World4You)
- FTP-Zugang zum Shared Hosting
- Node.js 18+ lokal für den Build

---

## 1. Produktions-Build erstellen

```bash
cd frontend && npm run build
```

Der Basispfad wird aus `frontend/.env` (`VITE_BASE_PATH=/apps/jury`) gelesen.
Danach enthält `dist/` alles, was hochgeladen werden muss.

Alternativ mit `build.sh` (nur Unix/macOS):
```bash
./scripts/build.sh /apps/jury
```

---

## 2. Auf den Server hochladen (FTP)

Lade den **Inhalt** von `dist/` in deinen Ziel-Unterordner auf dem Server (z. B. `/apps/jury/`):

```
dist/
  index.html          → /apps/jury/index.html
  assets/             → /apps/jury/assets/
  .htaccess           → /apps/jury/.htaccess
  api/                → /apps/jury/api/
  data/               → /apps/jury/data/
```

> **Wichtig:** Achte darauf, dass auch versteckte Dateien (.htaccess) übertragen werden.
> In FileZilla: Ansicht → Versteckte Dateien anzeigen.

---

## 3. Datenordner konfigurieren

Der `data/` Ordner muss für den Webserver-User beschreibbar sein:

```bash
# Über SSH (falls verfügbar):
chmod 770 /path/to/apps/jury/data/
```

Bei World4You kannst du die Rechte über den Dateimanager im CPanel setzen.

---

## 4. Admin-Benutzer anlegen

**Option A: SSH (empfohlen)**
```bash
cd /path/to/apps/jury
php api/seed.php
# oder mit eigenen Daten:
SEED_ADMIN_USER=myadmin SEED_ADMIN_PASSWORD=sicherespasswort php api/seed.php
```

**Option B: Ohne SSH (FTP-only)**
Generiere die Startdaten **lokal** (auf deinem Rechner) und lade nur die JSON-Datei hoch:
```bash
# Lokal ausführen:
php scripts/create_dummy_data.php
# → schreibt data/users.json mit admin/admin123
```
Lade `data/users.json` per FTP nach `/apps/jury/data/users.json` hoch.

> **Wichtig:** Ändere das Passwort nach dem ersten Login sofort unter *Benutzer → Bearbeiten*.
> Lade **niemals** ein ausführbares PHP-Script in den öffentlichen Webroot – es könnte von
> außen aufgerufen werden und Admin-Zugangsdaten überschreiben.

---

## 5. Ersten Login testen

1. Öffne `https://deine-domain.at/apps/jury/`
2. Melde dich mit `admin` / `admin123` an (oder dein eigenes Passwort)
3. **Sofort das Passwort ändern** unter Benutzer → Bearbeiten

---

## 6. Datensicherheit prüfen

Teste, dass JSON-Dateien nicht direkt abrufbar sind:
```bash
curl -I https://deine-domain.at/apps/jury/data/users.json
# Muss: HTTP 403 Forbidden zurückgeben
```

---

## Lokale Entwicklung

```bash
# Terminal 1: PHP Backend
cd backend/api
php -S localhost:8000 index.php

# Terminal 2: Vite Frontend
cd frontend
npm run dev
```

Frontend läuft auf http://localhost:5173/apps/jury/
API-Calls werden per Vite-Proxy an http://localhost:8000 weitergeleitet.
Gleicher Basispfad (`/apps/jury`) wie in Produktion — kein `.env`-Wechsel nötig.

Optional vor dem Build:
```bash
cd frontend
npm run lint
```

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
/apps/jury/
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
