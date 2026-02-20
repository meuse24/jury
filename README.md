# Jury System

> Vollständige Web-App für digitale Jurybewertungen – einfacher Modus und Kandidaten-Modus.
> Deployed auf Shared Hosting (World4You) unter [meuse24.info/apps/jury](https://meuse24.info/apps/jury/)

---

## Inhaltsverzeichnis

- [Features](#features)
- [Screenshots / Workflow](#screenshots--workflow)
- [Technologie-Stack](#technologie-stack)
- [Projektstruktur](#projektstruktur)
- [Datenmodell](#datenmodell)
- [REST API](#rest-api)
- [Lokale Entwicklung](#lokale-entwicklung)
- [Produktions-Build & Deployment](#produktions-build--deployment)
- [Dummy-Daten](#dummy-daten)
- [Architekturentscheidungen](#architekturentscheidungen)
- [Bekannte Einschränkungen](#bekannte-einschränkungen)
- [Lizenz](#lizenz)

---

## Features

### Admin
- Benutzer anlegen, bearbeiten, löschen (Rollen: Admin / Jury)
- Wertungen erstellen und verwalten mit:
  - Einreichungszeitraum (open / upcoming / closed)
  - Beliebige Bewertungskategorien mit Max-Punktzahl
  - **Einfacher Modus** – Jury bewertet allgemein
  - **Kandidaten-Modus** – Jury bewertet jeden Kandidaten separat
- Jury-Mitglieder zuweisen mit Submission-Status auf einen Blick
- Ergebnisse per Klick freigeben oder zurückziehen
- Workflow-Führung: Nach Wertungserstellung direkt zur Jury-Zuweisung

### Jury-Mitglied
- Übersicht aller zugewiesenen Wertungen mit Status und Fortschritt
- Kandidaten-Tabs mit Checkbox-Anzeige (welche Kandidaten bereits bewertet)
- Fortschrittsbalken für Kandidaten-Modus
- Slider + Zahlenfeld für jede Kategorie
- Kommentarfeld (optional)
- Workflow: Nach Speichern direkt zum nächsten Kandidaten

### Öffentliche Ergebnisse
- Animierte Enthüllung der Ergebnisse (Intro → Kategorie für Kategorie → Finale)
- Einfacher Modus: Gesamtpunktzahl mit Kategorie-Breakdown
- Kandidaten-Modus: Ranking mit animierter Platzierungsauflösung (letzter zuerst)
- Ergebnisseite erst zugänglich wenn Admin freigibt

---

## Screenshots / Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│  ⚖ Jury System      Benutzer  Wertungen  Hilfe  [Abmelden]         │  ← Admin Desktop
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  ⚖ Jury System                                          [☰]         │  ← Mobile (Hamburger)
└─────────────────────────────────────────────────────────────────────┘
```

### Admin-Workflow (geführt)

```
 1. Benutzer anlegen          →  Jury-Mitglieder erstellen
        ↓
 2. Wertung erstellen         →  Titel, Kategorien, Zeitraum, Kandidaten
        ↓  (Auto-Redirect)
 3. Jury zuweisen             →  Checkboxen + Einreichstatus live
        ↓  (alle abgegeben)
 4. Ergebnisse freigeben      →  Öffentliche URL teilen
```

### Jury-Workflow (geführt)

```
 1. Dashboard                 →  Zugewiesene Wertungen + Status
        ↓  (Klick auf "Jetzt bewerten")
 2. Kandidaten-Tabs           →  Tab wählen, Slider/Eingabe, Kommentar
        ↓  (Speichern)
 3. Bestätigung + Weiter      →  "Weiter: Kandidat X →" Button
        ↓  (alle bewertet)
 4. "Alle Kandidaten bewertet" ✓
```

---

## Technologie-Stack

| Schicht | Technologie |
|---------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS v3, React Router v6 |
| Backend | PHP 8.3, kein Framework, REST API |
| Storage | JSON-Dateien, atomares `flock()` + rename (Repository-Pattern) |
| Auth | PHP Sessions, SameSite=Strict, HttpOnly, CSRF via Origin/Referer |
| Hosting | Shared Hosting (World4You), FTP-Deployment, kein SSH |

---

## Projektstruktur

```
/
├── backend/api/              PHP REST API
│   ├── index.php             Front-Controller / Router
│   ├── config.php            BASE_PATH, DATA_DIR, Session, bcrypt
│   ├── seed.php              CLI-Seed für initialen Admin-User
│   └── src/
│       ├── Auth/             login.php, logout.php, me.php
│       ├── Admin/            CRUD Users, Evaluations, Assignments, Publish
│       ├── Jury/             eval list/detail, submission get/put, candidates
│       ├── Public/           results.php (publish-gating, simple + candidates)
│       ├── Middleware/       session.php, rbac.php (requireAuth/requireRole, CSRF)
│       ├── Model/            models.php (make_user, make_evaluation, …)
│       └── Repository/       JsonStore.php, repositories.php
│
├── frontend/                 React SPA
│   ├── src/
│   │   ├── api/client.ts     Typed API-Client (fetch + credentials)
│   │   ├── hooks/useAuth.tsx AuthProvider + useAuth Hook
│   │   ├── components/       Layout (Hamburger-Menü), ProtectedRoute, Alert, Spinner
│   │   └── pages/
│   │       ├── LoginPage.tsx
│   │       ├── HelpPage.tsx              Ausführliche Hilfe (9 Abschnitte)
│   │       ├── PublicResultsPage.tsx     Animierte Ergebnisseite
│   │       ├── admin/
│   │       │   ├── AdminUsersPage.tsx    Benutzerverwaltung (responsive Tabelle)
│   │       │   ├── AdminEvalsPage.tsx    Wertungsübersicht + Workflow-CTAs
│   │       │   ├── AdminEvalFormPage.tsx Erstellen / Bearbeiten (auto-redirect zu Jury)
│   │       │   └── AdminAssignmentsPage.tsx  Jury zuweisen + Status
│   │       └── jury/
│   │           ├── JuryDashboardPage.tsx Übersicht + Fortschrittsbalken
│   │           └── JuryEvalPage.tsx      Bewertungsformular + "Weiter"-Führung
│   ├── vite.config.ts        Build + assembleDistPlugin
│   └── .env                  VITE_BASE_PATH=/apps/jury
│
├── data/                     JSON-Datenspeicher (nicht in dist/ committed)
│   ├── .htaccess             Deny all HTTP
│   ├── users.json
│   ├── evaluations.json
│   └── submissions.json
│
├── dist/                     Deployables (gitignored)
├── scripts/
│   ├── build.sh              Shell-Build (Unix/macOS)
│   └── create_dummy_data.php Erzeugt Test-Daten
├── CLAUDE.md                 Vollständige Projektdokumentation (für KI-Assistenten)
└── DEPLOYMENT.md             Schritt-für-Schritt FTP-Deployment-Anleitung
```

---

## Datenmodell

### User
```json
{
  "id": "uuid",
  "username": "string",
  "password_hash": "bcrypt",
  "role": "admin | jury",
  "name": "string",
  "created_at": 0,
  "updated_at": 0
}
```

### Evaluation
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string",
  "candidates": [{ "id": "uuid", "name": "string", "description": "string" }],
  "categories":  [{ "id": "uuid", "name": "string", "description": "string", "max_score": 10 }],
  "submission_open_at":    1700000000,
  "submission_close_at":   1700086400,
  "results_publish_at":    1700090000,
  "results_is_published":  false,
  "results_published_at":  null,
  "jury_assignments":      ["userId"],
  "created_at": 0,
  "updated_at": 0
}
```

> `candidates: []` → einfacher Modus
> `candidates: [{...}]` → Kandidaten-Modus

### Submission
```json
{
  "id": "uuid",
  "evaluation_id": "uuid",
  "user_id": "uuid",
  "candidate_id": "uuid | null",
  "scores": [{ "category_id": "uuid", "score": 8 }],
  "comment": "string | null",
  "submitted_at": 0,
  "updated_at": 0
}
```

> `candidate_id: null` → einfacher Modus
> `candidate_id: "uuid"` → Kandidaten-Modus (ein Datensatz pro Kandidat × Jury-Mitglied)

---

## REST API

### Auth
| Method | Path | Auth | Beschreibung |
|--------|------|------|---|
| POST | `/api/auth/login` | – | Login, Session starten |
| POST | `/api/auth/logout` | – | Session beenden |
| GET  | `/api/auth/me` | session | Aktuell eingeloggter User |

### Admin – Benutzer
| Method | Path | Auth | Beschreibung |
|--------|------|------|---|
| GET    | `/api/admin/users` | admin | Alle User auflisten |
| POST   | `/api/admin/users` | admin | User erstellen |
| PUT    | `/api/admin/users/:id` | admin | User bearbeiten |
| DELETE | `/api/admin/users/:id` | admin | User löschen |

### Admin – Wertungen
| Method | Path | Auth | Beschreibung |
|--------|------|------|---|
| GET    | `/api/admin/evaluations` | admin | Alle Wertungen |
| POST   | `/api/admin/evaluations` | admin | Wertung erstellen |
| GET    | `/api/admin/evaluations/:id` | admin | Wertung detail |
| PUT    | `/api/admin/evaluations/:id` | admin | Wertung bearbeiten |
| DELETE | `/api/admin/evaluations/:id` | admin | Wertung löschen |
| PUT    | `/api/admin/evaluations/:id/assignments` | admin | Jury zuweisen (löscht Submissions entfernter Member) |
| GET    | `/api/admin/evaluations/:id/submissions` | admin | Einreichstatus (+ Kandidaten-Detail) |
| POST   | `/api/admin/evaluations/:id/publish-results` | admin | Ergebnisse freigeben |
| POST   | `/api/admin/evaluations/:id/unpublish-results` | admin | Freigabe zurückziehen |

### Jury
| Method | Path | Auth | Beschreibung |
|--------|------|------|---|
| GET | `/api/jury/evaluations` | jury | Zugewiesene Wertungen |
| GET | `/api/jury/evaluations/:id` | jury + assigned | Wertung detail (candidates, submissions) |
| PUT | `/api/jury/evaluations/:id/submission` | jury + assigned + open | Einreichen (einfacher Modus) |
| GET | `/api/jury/evaluations/:id/candidates/:cid/submission` | jury + assigned | Kandidaten-Submission lesen |
| PUT | `/api/jury/evaluations/:id/candidates/:cid/submission` | jury + assigned + open | Kandidaten-Submission einreichen |

### Public
| Method | Path | Auth | Beschreibung |
|--------|------|------|---|
| GET | `/api/public/evaluations/:id/results` | – | Öffentliche Ergebnisse (`mode: simple \| candidates`) |

---

## Frontend Routes

| Route | Zugang | Seite |
|-------|--------|-------|
| `/` | – | Redirect je nach Rolle |
| `/login` | – | Anmeldeseite |
| `/hilfe` | – | Hilfe & Dokumentation |
| `/results/:id` | – | Öffentliche Ergebnisse (animiert) |
| `/admin/users` | admin | Benutzerverwaltung |
| `/admin/evaluations` | admin | Wertungsübersicht |
| `/admin/evaluations/new` | admin | Neue Wertung |
| `/admin/evaluations/:id/edit` | admin | Wertung bearbeiten |
| `/admin/evaluations/:id/assignments` | admin | Jury & Status |
| `/jury` | jury | Meine Wertungen (Dashboard) |
| `/jury/evaluations/:id` | jury | Bewertungsformular |

---

## Lokale Entwicklung

### Voraussetzungen
- PHP 8.3+
- Node.js 18+ / npm

### Backend starten
```bash
cd backend/api
php -S localhost:8000 index.php
```

### Frontend starten
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173/jurysystem/
```

Der Vite Dev-Server proxied API-Anfragen automatisch an `localhost:8000`.

### Ersten Admin-User anlegen
```bash
cd backend/api
php seed.php
# Legt admin / admin123 an
```

---

## Produktions-Build & Deployment

### Build
```bash
cd frontend
npm run build
# → dist/ enthält alles: SPA + api/ + data/ + .htaccess
```

Das Vite-Plugin `assembleDistPlugin` übernimmt automatisch:
- Korrektes `.htaccess` mit `RewriteBase /apps/jury/`
- `backend/api/` → `dist/api/` kopieren + `BASE_PATH` patchen
- `data/*.json` → `dist/data/` kopieren

### Basispfad konfigurieren
`frontend/.env`:
```
VITE_BASE_PATH=/apps/jury      # Produktion
VITE_BASE_PATH=/jurysystem     # Lokale Entwicklung
```

### FTP Upload
Inhalt von `dist/` nach `/apps/jury/` uploaden.

> **Wichtig:** In FileZilla unter *Server → Versteckte Dateien anzeigen erzwingen* aktivieren, damit `.htaccess`-Dateien sichtbar sind.

Detaillierte Schritt-für-Schritt-Anleitung: siehe [DEPLOYMENT.md](DEPLOYMENT.md)

---

## Dummy-Daten

Testdaten für die lokale Entwicklung:

```bash
php scripts/create_dummy_data.php
```

### Benutzer

| Benutzername | Passwort | Rolle | Name |
|---|---|---|---|
| admin | admin123 | Admin | Administrator |
| jury1 | jury123 | Jury | Maria Huber |
| jury2 | jury123 | Jury | Thomas Müller |
| jury3 | jury123 | Jury | Sophie Wagner |

### Wertungen

| Titel | Modus | Status | Jury |
|---|---|---|---|
| Musikwettbewerb 2026 | Einfach | Offen (1 Stunde) | alle 3 |
| Nachwuchspreis 2026 | Einfach | Bald verfügbar (morgen) | jury1 + jury2 |
| Talentwettbewerb 2026 | Kandidaten (3) | Offen (7 Tage) | alle 3 |

Demo-Submissions für den Talentwettbewerb (3 Kandidaten):
- **jury2** – alle 3 Kandidaten bewertet
- **jury3** – 2 von 3 bewertet (Anna + Clara)
- **jury1** – noch keine Wertung

---

## Architekturentscheidungen

| Thema | Entscheidung | Begründung |
|-------|---|---|
| Auth | PHP Sessions, SameSite=Strict, HttpOnly | Einfach, sicher, kein Token-Handling nötig |
| CSRF | Origin/Referer-Check + SameSite | Kein separates CSRF-Token nötig für SPA |
| Dev-CORS | `CORS_ALLOWED_ORIGINS` Whitelist | `localhost:5173` überspringt CSRF-Check |
| Publish | Admin-Toggle + Zeitschranke (beide müssen erfüllt sein) | Admin kann Freigabe vorab "armen" |
| 404 vs 403 | Nicht freigegebene Ergebnisse → 404 | Verhindert Information Leakage |
| JSON Concurrency | `flock()` + temp-file rename | Atomares Schreiben ohne externe Lock-Dienste |
| DATA_DIR | Auto-detect: `../data` (dist) oder `../../data` (dev) | Ein `config.php` für beide Layouts |
| Jury-Entfernung | Alle Submissions mitgelöscht | Konsistenz; Frontend warnt vorher |
| Kandidaten | `candidate_id` auf Submission; null = einfach, uuid = Kandidaten | Abwärtskompatibel, Repository-neutral |
| Ergebnis-Enthüllung | Animierte Phasen: intro → reveal → finale | Spannung bei öffentlicher Bekanntgabe |
| Responsivität | Mobile-first, Hamburger-Menü (< 640 px), overflow-x-auto für Tabellen | Nutzbar auf Smartphones und Tablets |
| Workflow-Führung | Auto-Redirect nach Wertungserstellung → Jury-Zuweisung | Verhindert vergessene Konfigurationsschritte |

---

## Bekannte Einschränkungen

- Keine MySQL-Implementierung (Repository-Pattern vorbereitet, JSON reicht für den aktuellen Umfang)
- Kein E-Mail-Versand (Passwort-Reset nur durch Admin möglich)
- Keine Paginierung (bei sehr vielen Wertungen/Usern nachrüsten)
- `scripts/build.sh` nur auf Unix/macOS – Windows: `cd frontend && npm run build`

---

## Lizenz

Dieses Projekt ist für den internen Gebrauch entwickelt.
Bei Fragen oder Interesse an der Nutzung: [meuse24.info](https://meuse24.info)
