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
│   │   ├── Jury/         eval list/detail, submission get/put
│   │   ├── Public/       results.php (publish-gating)
│   │   ├── Middleware/   session.php, rbac.php (requireAuth/requireRole, CSRF)
│   │   ├── Model/        models.php (make_user, make_evaluation, make_category, make_submission)
│   │   └── Repository/   JsonStore.php, repositories.php (UserRepo, EvalRepo, SubmissionRepo)
│   └── .htaccess         RewriteBase /apps/jury/api/ → index.php
├── frontend/             React SPA
│   ├── src/
│   │   ├── api/client.ts Typed API-Client (fetch + credentials)
│   │   ├── hooks/useAuth.tsx AuthProvider + useAuth Hook
│   │   ├── components/   Layout, ProtectedRoute, Alert, Spinner
│   │   └── pages/
│   │       ├── LoginPage.tsx
│   │       ├── HelpPage.tsx          Ausführliche Hilfe (8 Abschnitte)
│   │       ├── PublicResultsPage.tsx Öffentliche Ergebnisse (kein Login)
│   │       ├── admin/
│   │       │   ├── AdminUsersPage.tsx
│   │       │   ├── AdminEvalsPage.tsx
│   │       │   ├── AdminEvalFormPage.tsx   Erstellen + Bearbeiten
│   │       │   └── AdminAssignmentsPage.tsx "Jury & Status" (Zuweisung + Einreichstatus)
│   │       └── jury/
│   │           ├── JuryDashboardPage.tsx
│   │           └── JuryEvalPage.tsx        Bewertungsformular (Slider + Zahl)
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
│   └── create_dummy_data.php  Erzeugt Dummy-Daten (admin + 3 Jury + 2 Wertungen)
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
  "categories": [{ "id": "uuid", "name": "string", "description": "string", "max_score": 10 }],
  "submission_open_at": 0, "submission_close_at": 0, "results_publish_at": 0,
  "results_is_published": false, "results_published_at": null,
  "jury_assignments": ["userId"], "created_at": 0, "updated_at": 0 }
```

### Submission
```json
{ "id": "uuid", "evaluation_id": "uuid", "user_id": "uuid",
  "scores": [{ "category_id": "uuid", "score": 8 }],
  "comment": "string|null", "submitted_at": 0, "updated_at": 0 }
```

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
| GET | `/api/admin/evaluations/:id/submissions` | admin | Einreichstatus pro Jury-Member |
| POST | `/api/admin/evaluations/:id/publish-results` | admin | Ergebnisse freigeben |
| POST | `/api/admin/evaluations/:id/unpublish-results` | admin | Freigabe zurückziehen |
| GET | `/api/jury/evaluations` | jury | Zugewiesene Wertungen |
| GET | `/api/jury/evaluations/:id` | jury + assigned | Wertung detail |
| GET | `/api/jury/evaluations/:id/submission` | jury + assigned | Eigene Einreichung |
| PUT | `/api/jury/evaluations/:id/submission` | jury + assigned + open | Einreichen/Aktualisieren |
| GET | `/api/public/evaluations/:id/results` | – | Öffentliche Ergebnisse |

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
| Jury-Entfernung | Submission wird mitgelöscht | Konsistenz; Frontend warnt vorher |

---

## Dummy-Daten (Testumgebung)

```bash
php scripts/create_dummy_data.php
```

| User | Passwort | Rolle |
|------|----------|-------|
| admin | admin123 | Admin |
| jury1 | jury123 | Maria Huber |
| jury2 | jury123 | Thomas Müller |
| jury3 | jury123 | Sophie Wagner |

- **Wertung 1** "Musikwettbewerb 2026": offen (alle 3 Jury zugewiesen)
- **Wertung 2** "Nachwuchspreis 2026": upcoming (jury1 + jury2)

---

## Bekannte Einschränkungen / TODO

- Keine MySQL-Implementierung (Repository-Pattern vorbereitet, JSON reicht für aktuellen Umfang)
- Kein E-Mail-Versand (Passwort-Reset nur durch Admin möglich)
- Keine Paginierung (bei sehr vielen Wertungen/Usern nachrüsten)
- `scripts/build.sh` nur auf Unix/macOS — Windows-Nutzer verwenden `cd frontend && npm run build`
