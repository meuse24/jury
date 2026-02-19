# Jury System — Projektdokumentation

## Überblick

Vollständige Client-Server-Webapp für Jury-Wertungen. Deployed auf Shared Hosting (World4You) im Unterordner `/apps/jury/`.

- **Live-URL:** https://meuse24.info/apps/jury/
- **Plattform:** Shared Hosting, FTP-Deployment, kein SSH
- **Backend:** PHP 8.3 (kein Framework), REST API
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + React Router v6
- **Storage:** JSON-Dateien mit atomarem flock + rename (Repository-Pattern, MySQL-ready)

---

## Projektstruktur

```
/
├── backend/api/          PHP REST API (Quellcode)
│   ├── index.php         Front-Controller / Router
│   ├── config.php        BASE_PATH, DATA_DIR (auto-detect), Session, bcrypt
│   ├── seed.php          CLI-Seed für initialen Admin-User
│   ├── src/
│   │   ├── Auth/         login.php, logout.php, me.php
│   │   ├── Admin/        CRUD Users, Evaluations, Assignments, Publish, Submissions-Status
│   │   ├── Jury/         eval list/detail, submission get/put, candidate_submission get/put
│   │   ├── Public/       results.php (publish-gating, simple + candidates mode)
│   │   ├── Middleware/   session.php, rbac.php (requireAuth/requireRole, CSRF)
│   │   ├── Model/        models.php (make_user, make_evaluation, make_candidate, make_category, make_submission)
│   │   └── Repository/   JsonStore.php, repositories.php (UserRepo, EvalRepo, SubmissionRepo)
│   └── .htaccess         RewriteBase /apps/jury/api/ → index.php
├── frontend/             React SPA
│   ├── src/
│   │   ├── api/client.ts Typed API-Client (fetch + credentials)
│   │   ├── hooks/useAuth.tsx AuthProvider + useAuth Hook
│   │   ├── components/   Layout, ProtectedRoute, Alert, Spinner
│   │   └── pages/
│   │       ├── LoginPage.tsx
│   │       ├── HelpPage.tsx          Ausführliche Hilfe (9 Abschnitte, inkl. Kandidaten)
│   │       ├── PublicResultsPage.tsx Öffentliche Ergebnisse – animierte Enthüllung (simple + candidates)
│   │       ├── admin/
│   │       │   ├── AdminUsersPage.tsx
│   │       │   ├── AdminEvalsPage.tsx
│   │       │   ├── AdminEvalFormPage.tsx   Erstellen + Bearbeiten (inkl. Kandidaten-Sektion)
│   │       │   └── AdminAssignmentsPage.tsx "Jury & Status" (Einreichstatus, kandidatenweise)
│   │       └── jury/
│   │           ├── JuryDashboardPage.tsx
│   │           └── JuryEvalPage.tsx        Bewertungsformular – Kandidaten-Tabs oder einfacher Modus
│   ├── vite.config.ts    Build + assembleDistPlugin (kopiert api/, data/, .htaccess)
│   └── .env              VITE_BASE_PATH=/apps/jury  (für Prod-Build)
├── data/                 JSON-Datenspeicher (nicht in dist/ committed)
│   ├── .htaccess         Deny all HTTP
│   ├── users.json
│   ├── evaluations.json
│   └── submissions.json
├── dist/                 Deployables (gitignored, wird per Build erzeugt)
├── scripts/
│   ├── build.sh          Shell-Build (alternativ zu npm run build)
│   └── create_dummy_data.php  Erzeugt Dummy-Daten (admin + 3 Jury + 3 Wertungen + Demo-Submissions)
├── DEPLOYMENT.md         Schritt-für-Schritt FTP-Deployment-Anleitung
└── plan.txt              Originale Anforderungsspezifikation
```

---

## Datenmodelle (JSON)

### User
```json
{ "id": "uuid", "username": "string", "password_hash": "bcrypt", "role": "admin|jury",
  "name": "string", "created_at": 0, "updated_at": 0 }
```

### Evaluation
```json
{ "id": "uuid", "title": "string", "description": "string",
  "candidates": [{ "id": "uuid", "name": "string", "description": "string" }],
  "categories": [{ "id": "uuid", "name": "string", "description": "string", "max_score": 10 }],
  "submission_open_at": 0, "submission_close_at": 0, "results_publish_at": 0,
  "results_is_published": false, "results_published_at": null,
  "jury_assignments": ["userId"], "created_at": 0, "updated_at": 0 }
```
`candidates: []` → einfacher Modus. `candidates: [{...}]` → Kandidaten-Modus.

### Submission
```json
{ "id": "uuid", "evaluation_id": "uuid", "user_id": "uuid",
  "candidate_id": "uuid|null",
  "scores": [{ "category_id": "uuid", "score": 8 }],
  "comment": "string|null", "submitted_at": 0, "updated_at": 0 }
```
`candidate_id: null` → einfacher Modus. `candidate_id: "uuid"` → Kandidaten-Modus (ein Datensatz pro Kandidat pro Jury-Mitglied).

---

## REST API Endpoints

| Method | Path | Auth | Beschreibung |
|--------|------|------|---|
| POST | `/api/auth/login` | – | Login |
| POST | `/api/auth/logout` | – | Logout |
| GET | `/api/auth/me` | session | Aktueller User |
| GET | `/api/admin/users` | admin | Alle User |
| POST | `/api/admin/users` | admin | User erstellen |
| PUT | `/api/admin/users/:id` | admin | User bearbeiten |
| DELETE | `/api/admin/users/:id` | admin | User löschen |
| GET | `/api/admin/evaluations` | admin | Alle Wertungen |
| POST | `/api/admin/evaluations` | admin | Wertung erstellen |
| GET | `/api/admin/evaluations/:id` | admin | Wertung detail |
| PUT | `/api/admin/evaluations/:id` | admin | Wertung bearbeiten |
| DELETE | `/api/admin/evaluations/:id` | admin | Wertung löschen |
| PUT | `/api/admin/evaluations/:id/assignments` | admin | Jury zuweisen (löscht Submissions entfernter Member) |
| GET | `/api/admin/evaluations/:id/submissions` | admin | Einreichstatus pro Jury-Member (+ Kandidaten-Detail) |
| POST | `/api/admin/evaluations/:id/publish-results` | admin | Ergebnisse freigeben |
| POST | `/api/admin/evaluations/:id/unpublish-results` | admin | Freigabe zurückziehen |
| GET | `/api/jury/evaluations` | jury | Zugewiesene Wertungen |
| GET | `/api/jury/evaluations/:id` | jury + assigned | Wertung detail (inkl. candidates, submissions[]) |
| PUT | `/api/jury/evaluations/:id/submission` | jury + assigned + open | Einreichen (einfacher Modus) |
| GET | `/api/jury/evaluations/:id/candidates/:cid/submission` | jury + assigned | Kandidaten-Submission lesen |
| PUT | `/api/jury/evaluations/:id/candidates/:cid/submission` | jury + assigned + open | Kandidaten-Submission einreichen |
| GET | `/api/public/evaluations/:id/results` | – | Öffentliche Ergebnisse (mode: simple\|candidates) |

---

## Frontend Routes

| Route | Zugang | Seite |
|-------|--------|-------|
| `/` | – | Redirect je nach Rolle |
| `/login` | – | Login |
| `/hilfe` | – | Hilfeseite |
| `/results/:id` | – | Öffentliche Ergebnisse |
| `/admin/users` | admin | Benutzerverwaltung |
| `/admin/evaluations` | admin | Wertungsübersicht |
| `/admin/evaluations/new` | admin | Neue Wertung |
| `/admin/evaluations/:id/edit` | admin | Wertung bearbeiten |
| `/admin/evaluations/:id/assignments` | admin | Jury & Status |
| `/jury` | jury | Dashboard |
| `/jury/evaluations/:id` | jury | Bewertungsformular |

---

## Build & Deployment

### Lokale Entwicklung
```bash
# Backend (Terminal 1)
cd backend/api && php -S localhost:8000 index.php

# Frontend (Terminal 2)
cd frontend && npm run dev
# → http://localhost:5173/jurysystem/
```

### Produktions-Build
```bash
cd frontend && npm run build
# → dist/ enthält alles: Frontend + api/ + data/ + .htaccess
```

Der Vite-Plugin `assembleDistPlugin` übernimmt automatisch:
- `.htaccess` mit korrektem `RewriteBase` schreiben
- `backend/api/` → `dist/api/` kopieren + `BASE_PATH` patchen
- `data/*.json` → `dist/data/` kopieren

### Konfiguration (Basispfad ändern)
`frontend/.env`:
```
VITE_BASE_PATH=/apps/jury      # Prod
VITE_BASE_PATH=/jurysystem     # Dev (lokal)
```

### FTP Upload
Inhalt von `dist/` nach `/apps/jury/` uploaden. **Versteckte Dateien anzeigen** in FileZilla aktivieren (Server → Versteckte Dateien anzeigen erzwingen).

---

## Architekturentscheidungen

| Thema | Entscheidung | Begründung |
|-------|-------------|---|
| Auth | PHP Sessions, SameSite=Strict, HttpOnly | Einfach, sicher, kein Token-Handling |
| CSRF | Origin/Referer-Check + SameSite | Kein separates Token nötig für SPA |
| Dev-CORS | `CORS_ALLOWED_ORIGINS` Whitelist | localhost:5173 wird beim CSRF-Check übersprungen |
| Publish | Admin-Toggle + Zeitschranke (beide müssen erfüllt sein) | Admin kann vorab "armen" |
| 404 vs 403 | Nicht freigegebene Ergebnisse → 404 | Verhindert Info-Leakage |
| JSON Concurrency | flock() + temp-file rename | Atomic, kein ext. Lock nötig |
| DATA_DIR | Auto-detect: `../data` (dist) oder `../../data` (dev) | Ein config.php für beide Layouts |
| Jury-Entfernung | Alle Submissions mitgelöscht | Konsistenz; Frontend warnt vorher |
| Kandidaten | `candidate_id` auf Submission; null = einfach, uuid = Kandidaten | Abwärtskompatibel, Repository-neutral |
| Ergebnis-Enthüllung | Animierte Phasen: intro → reveal → finale | Spannung bei öffentlicher Bekanntgabe; Kandidaten umgekehrt (letzter zuerst) |

---

## Dummy-Daten (Testumgebung)

```bash
php scripts/create_dummy_data.php
```

| User | Passwort | Rolle | Name |
|------|----------|-------|------|
| admin | admin123 | Admin | Administrator |
| jury1 | jury123 | Jury | Maria Huber |
| jury2 | jury123 | Jury | Thomas Müller |
| jury3 | jury123 | Jury | Sophie Wagner |

| Wertung | Modus | Status | Jury |
|---------|-------|--------|------|
| Musikwettbewerb 2026 | einfach | offen (1h) | alle 3 |
| Nachwuchspreis 2026 | einfach | upcoming (morgen) | jury1 + jury2 |
| Talentwettbewerb 2026 | Kandidaten | offen (7 Tage) | alle 3 |

Demo-Submissions für Wertung 3 (Talentwettbewerb, 3 Kandidaten):
- **jury2** hat alle 3 Kandidaten bewertet
- **jury3** hat 2 von 3 Kandidaten bewertet (Anna + Clara)
- **jury1** noch keine Wertung abgegeben

---

## Bekannte Einschränkungen / TODO

- Keine MySQL-Implementierung (Repository-Pattern vorbereitet, JSON reicht für aktuellen Umfang)
- Kein E-Mail-Versand (Passwort-Reset nur durch Admin möglich)
- Keine Paginierung (bei sehr vielen Wertungen/Usern nachrüsten)
- `scripts/build.sh` nur auf Unix/macOS — Windows-Nutzer verwenden `cd frontend && npm run build`
