# Jury System

> Vollständige Web-App für digitale Jurybewertungen – einfacher Modus und Kandidaten-Modus.
> Deployed auf Shared Hosting (World4You) unter [meuse24.info/apps/jury](https://meuse24.info/apps/jury/)

---

## Inhaltsverzeichnis

- [Features](#features)
- [Workflow](#workflow)
- [Technologie-Stack](#technologie-stack)
- [Projektstruktur](#projektstruktur)
- [Datenmodell](#datenmodell)
- [REST API](#rest-api)
- [Frontend Routes](#frontend-routes)
- [Lokale Entwicklung](#lokale-entwicklung)
- [Produktions-Build & Deployment](#produktions-build--deployment)
- [Dummy-Daten](#dummy-daten)
- [Architekturentscheidungen](#architekturentscheidungen)
- [Bekannte Einschränkungen](#bekannte-einschränkungen)

---

## Features

### Admin
- Benutzer anlegen, bearbeiten, löschen (Rollen: Admin / Jury)
- Wertungen erstellen mit konfigurierbar Zeitfenster, Kategorien (Max-Punkte), Modi:
  - **Einfacher Modus** – eine Gesamtbewertung pro Jury-Mitglied
  - **Kandidaten-Modus** – Jury bewertet jeden Kandidaten einzeln, automatisches Ranking
- **Publikumswertung** (optional): per QR-Code aktivierbar, zählt als gleichrangiges Jury-Mitglied
- Publikums-Teilnehmerzahl in der Wertungsübersicht sichtbar
- Im **Bearbeiten-Modus**: Publikums-Link direkt sichtbar mit Kopieren- und Teilen-Button;
  Teilnehmeranzahl live; automatische Aktualisierung alle 60 s während des Abstimmungsfensters
  mit Countdown-Anzeige und manuellem Refresh-Button
- Jury-Mitglieder zuweisen; Live-Einreichstatus pro Mitglied und Kandidat
- Abstimmungszeitslot (von/bis) sichtbar in **Jury & Status** inkl. Zustand:
  - noch nicht gestartet
  - geöffnet
  - abgelaufen
- Freigabe-Workflow zentral auf der Jury-&-Status-Seite mit Plausibilitätsprüfung:
  - **Gesperrt** 🔒 solange Abstimmungsfenster noch läuft oder Publikumswertung aktiv — mit konkretem Grund + Ablaufzeit
  - **Ausnahme**: vorzeitige Freigabe erlaubt, wenn alle Jury-Mitglieder abgestimmt haben und keine Publikumswertung aktiv ist
  - Alle abgegeben + Slot abgelaufen → grüner CTA
  - Noch ausstehend + Slot abgelaufen → Warnliste mit Namen + optionales „Trotzdem freigeben"
  - Bereits freigegeben → Link zur Ergebnisseite + Freigabe zurückziehen
- Workflow-Führung: Auto-Redirect nach Wertungserstellung direkt zur Jury-Zuweisung

### Jury-Mitglied
- Prominente orange Warnung auf dem Dashboard wenn Bewertungen fehlen (klickbare Links)
- Fortschrittsbalken für Kandidaten-Modus (X/Y bewertet)
- Kandidaten-Tabs mit ○/✓ je Kandidat
- Nach Speichern: „Weiter: Kandidat X →" Button in der Erfolgsmeldung
- Slider + Zahlenfeld synchronisiert, optionales Kommentarfeld
- Lesemodus nach Ablauf des Einreichfensters

### Öffentliche Ergebnisse
- Animierte Enthüllung (Intro → Kategorie-für-Kategorie → Finale)
- Einfacher Modus: Gesamtpunktzahl mit Kategorie-Breakdown
- Kandidaten-Modus: Rang-Enthüllung (letzter Platz → Sieger)
- Zeigt „X von Y Jury-Wertungen" wenn nicht alle Mitglieder abgegeben haben
- Zeigt Publikums-Teilnehmerzahl, wenn Publikumswertung aktiv ist
- Seite nur erreichbar wenn Admin freigibt **und** Zeitpunkt erreicht

### Publikum
- Teilnahme per QR-Code / Link
- Einmalige Stimmabgabe pro Gerät (Cookie-basiert, Best-Effort — Inkognito/Cookie-Löschen ermöglicht erneute Stimme)
- Kandidaten-Modus: Wahl eines Kandidaten
- Einfacher Modus: Punkte 0–X (X konfigurierbar)
- Bei geschlossenem Zeitfenster wird ein Ergebnislink angezeigt.
- Nach Stimmabgabe ("Danke für deine Stimme!") wird ebenfalls ein Ergebnislink angezeigt.

### Hilfe & Infografik
- Hilfeseite mit 10 Abschnitten: Workflow + Best Practices für Admin und Jury
- Infografik-Seite (`/hilfe/infografik`): 3 rollenspezifische Workflows mit Tab-Umschaltung
  - Tabs: **Admin**, **Jury**, **Zuschauer** – jeweils eigenes Bild
  - Fit-to-View beim Tab-Wechsel: Bild wird automatisch neu eingepasst
  - Container füllt verfügbare Viewport-Höhe dynamisch aus (kein festes `maxHeight`)
  - Zoom-Toolbar: −, Prozentanzeige, +, Einpassen-Button
  - Mausrad-Zoom am Cursorpunkt (0,1× – 6×)
  - Doppelklick = 2× Zoom an Klickposition
  - Klicken & Ziehen zum Verschieben
  - Tastatursteuerung: +/− Zoom, 0 = Einpassen, Pfeiltasten = Pan
  - Zwei-Finger-Pinch auf Touch-Geräten, Ein-Finger-Drag = Pan
  - CSS `transform: translate() scale()` statt Scroll-basiert — keine Scrollbalken

---

## Workflow

### Admin – Best Practice

```
 1. Benutzer anlegen
      → Alle Jury-Mitglieder (Rolle: Jury) erstellen, bevor die Wertung startet.

 2. Wertung erstellen
      → Titel · Zeitfenster · Kategorien · ggf. Kandidaten
      → Button: "Erstellen & Jury zuweisen"

 3. Jury zuweisen  [Auto-Redirect nach Schritt 2]
      → Checkboxen setzen → "Zuweisung speichern"
      → Ab jetzt sehen die Mitglieder die Wertung.

 4. Bewertungsphase beobachten
      → Jury & Status / Freigabe zeigt live:
          ✓ Abgegeben  |  ○ Ausstehend  |  X/Y Kandidaten

 5. Ergebnisse freigeben  [nur auf Jury-&-Status-Seite]
      Slot noch offen →  🔒 Gesperrt mit Grund + Ablaufdatum
                           Ausnahme: alle abgestimmt + kein Publikum → Freigabe mit Info-Hinweis
      Alle abgegeben  →  grüner Button "✓ Ergebnisse jetzt freigeben"
      Noch offen      →  Warnliste + Konsequenz-Erklärung + zwei Lösungshinweise:
                           a) Mitglied abwählen & speichern (Submission wird entfernt)
                           b) Einreichfrist verlängern → direkter Link zu "Wertung bearbeiten"
                         + "Trotzdem freigeben ⚠" als Notfall-Option
      Freigegeben     →  "Freigabe zurückziehen" + öffentlicher Link
```

> **Checkliste vor Freigabe:** Alle Mitglieder grün ✓ · Einreichfenster abgelaufen ·
> Ergebnisse-ab-Zeitpunkt erreicht · Ergebnisse stichprobenartig geprüft

> **Hinweis:** Fehlende Abgaben verzerren den Durchschnitt, da die vorhandenen
> Wertungen überproportional gewichtet werden. Die öffentliche Ergebnisseite zeigt
> „X von Y Jury-Wertungen" damit Zuschauer die Datenbasis einschätzen können.

### Jury – Best Practice

```
 1. Anmelden
      → Oranger Warnblock zeigt sofort: welche Wertungen noch fehlen

 2. Wertung öffnen
      → Button orange = Handlungsbedarf · grau = bereits abgegeben

 3. Punkte vergeben
      Einfacher Modus:   Slider/Zahl je Kategorie → "Wertung abgeben"
      Kandidaten-Modus:  Tab wählen → Punkte → "Wertung abgeben"
                         → "Weiter: Kandidat X →" erscheint in Meldung

 4. Vollständigkeit prüfen
      → Dashboard: grüner Haken = fertig · roter Hinweis = Frist abgelaufen
      → Änderungen sind jederzeit möglich, solange Fenster offen
```

---

## Technologie-Stack

| Schicht | Technologie |
|---------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS v3, React Router v6 |
| Backend | PHP 8.3, kein Framework, REST API |
| Storage | JSON-Dateien, atomares `flock()` + rename (Repository-Pattern, MySQL-ready) |
| Auth | PHP Sessions, SameSite=Strict, HttpOnly, CSRF via Origin/Referer-Check |
| Hosting | Shared Hosting (World4You), FTP-Deployment, kein SSH |

---

## Projektstruktur

```
/
├── backend/api/                  PHP REST API
│   ├── index.php                 Front-Controller / Router
│   ├── config.php                BASE_PATH, DATA_DIR (auto-detect), Session, bcrypt
│   ├── seed.php                  CLI-Seed für initialen Admin-User
│   └── src/
│       ├── Auth/                 login.php, logout.php, me.php
│       ├── Admin/                CRUD Users, Evaluations, Assignments, Publish
│       ├── Jury/                 eval list/detail, submission get/put, candidates
│       ├── Public/               results.php (publish-gating, simple + candidates)
│       ├── Middleware/           session.php, rbac.php (requireAuth/requireRole, CSRF)
│       ├── Model/                models.php (make_user, make_evaluation, …)
│       └── Repository/           JsonStore.php, repositories.php
│
├── frontend/                     React SPA
│   ├── eslint.config.js          ESLint v9 Flat Config (TS + React Hooks)
│   ├── public/
│   │   ├── workflow_Admin.jpg     Infografik Admin-Workflow
│   │   ├── workflow_Jury.jpg      Infografik Jury-Workflow
│   │   └── workflow_Zuschauer.jpg Infografik Zuschauer-Workflow
│   ├── src/
│   │   ├── api/client.ts         Typed API-Client (fetch + credentials)
│   │   ├── hooks/useAuth.tsx     AuthProvider + useAuth Hook
│   │   ├── types/
│   │   │   └── qrcode.d.ts       Lokale Typen für `qrcode` (toDataURL)
│   │   ├── utils/
│   │   │   ├── formatting.ts     fmtDate – Datumsformatierung (de-AT)
│   │   │   └── errors.ts         getErrorMessage – ApiError → string
│   │   ├── components/
│   │   │   ├── Layout.tsx        Header (Hamburger Mobile), Hilfe-Dropdown, Footer
│   │   │   ├── EmptyState.tsx    Wiederverwendbarer Leer-Zustand
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── Alert.tsx
│   │   │   └── Spinner.tsx
│   │   └── pages/
│   │       ├── LoginPage.tsx
│   │       ├── HelpPage.tsx           10 Abschnitte: Workflow + Best Practices
│   │       ├── WorkflowPage.tsx       3 Infografiken (Admin/Jury/Zuschauer) mit Tabs + Pan & Zoom
│   │       ├── PublicResultsPage.tsx  Animierte Ergebnisseite; "X von Y Wertungen"
│   │       ├── admin/
│   │       │   ├── AdminUsersPage.tsx       Benutzerverwaltung (2-Spalten-Layout: Formular + Tabelle)
│   │       │   ├── AdminEvalsPage.tsx        Wertungsübersicht + Workflow-CTAs
│   │       │   ├── AdminEvalFormPage.tsx     Erstellen/Bearbeiten (2-Spalten: Inhalt + Sidebar);
│   │       │   │                             im Edit-Modus: Publikums-Link, Teilnehmer-Counter, Countdown
│   │       │   └── AdminAssignmentsPage.tsx  Jury + Status + Freigabe (2-Spalten: Liste + Sidebar);
│   │       │                                 zugängliches Teilen-Modal (ARIA, Fokus-Trap, Esc)
│   │       └── jury/
│   │           ├── JuryDashboardPage.tsx    Übersicht + Warnungen + Fortschritt
│   │           └── JuryEvalPage.tsx         Bewertungsformular + Weiter-Führung
│   ├── vite.config.ts            Build + assembleDistPlugin
│   └── .env                      VITE_BASE_PATH=/apps/jury
│
├── data/                         JSON-Datenspeicher (nicht in dist/ committed)
│   ├── .htaccess                 Deny all HTTP
│   ├── users.json
│   ├── evaluations.json
│   ├── submissions.json
│   └── audience_votes.json       Publikumsstimmen (pro Gerät einmalig)
│
├── dist/                         Deployables (gitignored, per Build erzeugt)
├── scripts/
│   ├── build.sh                  Shell-Build (Unix/macOS)
│   └── create_dummy_data.php     Erzeugt Test-Daten (4 User, 3 Wertungen)
├── CLAUDE.md                     Projektdokumentation für KI-Assistenten
└── DEPLOYMENT.md                 Schritt-für-Schritt FTP-Deployment-Anleitung
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
  "candidates":  [{ "id": "uuid", "name": "string", "description": "string" }],
  "categories":  [{ "id": "uuid", "name": "string", "description": "string", "max_score": 10 }],
  "submission_open_at":   1700000000,
  "submission_close_at":  1700086400,
  "results_publish_at":   1700090000,
  "results_is_published": false,
  "results_published_at": null,
  "audience_enabled":     true,
  "audience_max_score":   10,
  "jury_assignments":     ["userId"],
  "created_at": 0,
  "updated_at": 0
}
```

> `candidates: []` → einfacher Modus
> `candidates: [{…}]` → Kandidaten-Modus

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

### AudienceVote
```json
{
  "id": "uuid",
  "evaluation_id": "uuid",
  "device_id": "string",
  "candidate_id": "uuid | null",
  "score": 0,
  "submitted_at": 0
}
```

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
| GET    | `/api/admin/evaluations/:id/submissions` | admin | Einreichstatus pro Mitglied + Kandidaten-Detail |
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
| GET | `/api/public/evaluations/:id/audience` | – | Publikums-Info (Status, Modus, Kandidaten; `audience_max_score` nur im einfachen Modus) |
| POST | `/api/public/evaluations/:id/audience/vote` | – | Publikums-Stimme abgeben (einmalig pro Gerät) |

---

## Frontend Routes

| Route | Zugang | Seite |
|-------|--------|-------|
| `/` | – | Redirect je nach Rolle |
| `/login` | – | Anmeldeseite |
| `/hilfe` | – | Hilfe & Dokumentation (10 Abschnitte) |
| `/hilfe/infografik` | – | Workflow-Infografik (Pan & Zoom) |
| `/results/:id` | – | Öffentliche Ergebnisse (animiert) |
| `/audience/:id` | – | Publikumswertung (QR-Link) |
| `/admin/users` | admin | Benutzerverwaltung |
| `/admin/evaluations` | admin | Wertungsübersicht |
| `/admin/evaluations/new` | admin | Neue Wertung |
| `/admin/evaluations/:id/edit` | admin | Wertung bearbeiten |
| `/admin/evaluations/:id/assignments` | admin | Jury & Status / Freigabe |
| `/jury` | jury | Meine Wertungen (Dashboard + Warnungen) |
| `/jury/evaluations/:id` | jury | Bewertungsformular |

---

## Publikumswertung

- Aktivierung in der Wertungs-Form (Admin) per Toggle; Max-Punkte konfigurierbar (einfacher Modus).
- **Im Bearbeiten-Modus** wird der Publikums-Link direkt angezeigt (Kopieren-Button, Teilen via Web Share API oder Clipboard-Fallback).
- **Teilnehmer-Counter** mit Live-Aktualisierung: während des aktiven Abstimmungsfensters automatisch alle 60 s; Countdown-Anzeige im Refresh-Button; manueller Refresh jederzeit möglich.
- QR-Code und Link auch auf der **Jury & Status**-Seite (inkl. QR-Bild).
- Einmalige Stimmabgabe pro Gerät (Cookie-basiert, Best-Effort; Inkognito/Cookie-Löschen ermöglicht erneute Stimme).
- Kandidaten-Modus: Publikum wählt einen Kandidaten; Stimmenanteil wird linear auf die Jury-Gesamtpunkte skaliert (100% = volle Punkte).
- Einfacher Modus: Punkte `0–X` (0 erlaubt, X konfigurierbar; Default 10 falls nicht gesetzt).
- Ergebnisse: Publikum zählt als gleichrangiges Jury-Mitglied, Teilnehmerzahl wird angezeigt.
- Deaktivieren entfernt bestehende Publikumsstimmen nicht; Reaktivieren zählt alte Stimmen wieder mit.
- QR-Code wird im Frontend lokal generiert (kein externer Dienst).

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
# → http://localhost:5173/apps/jury/
# (Pfad aus VITE_BASE_PATH in frontend/.env)
```

Der Vite Dev-Server proxied API-Anfragen automatisch an `localhost:8000`.

### Codequalität prüfen
```bash
cd frontend
npm run lint
npm run build
```

### Ersten Admin anlegen
```bash
cd backend/api
php seed.php
# Legt admin / admin123 an — Passwort sofort ändern!
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
- `.htaccess` mit korrektem `RewriteBase /apps/jury/`
- `backend/api/` → `dist/api/` kopieren + `BASE_PATH` patchen
- `data/*.json` → `dist/data/` kopieren

### Basispfad konfigurieren
`frontend/.env`:
```
VITE_BASE_PATH=/apps/jury      # Produktion (Standard)
VITE_BASE_PATH=/jurysystem     # Alternativ für lokale Entwicklung
```

### FTP Upload
Inhalt von `dist/` nach `/apps/jury/` uploaden.

> **Wichtig:** In FileZilla unter *Server → Versteckte Dateien anzeigen erzwingen* aktivieren,
> damit `.htaccess`-Dateien sichtbar und übertragbar sind.

Detaillierte Anleitung: [DEPLOYMENT.md](DEPLOYMENT.md)

---

## Dummy-Daten

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
| Musikwettbewerb 2026 | Einfach | Offen (1 h) | alle 3 |
| Nachwuchspreis 2026 | Einfach | Bald offen (morgen) | jury1 + jury2 |
| Talentwettbewerb 2026 | Kandidaten (3) | Offen (7 Tage) | alle 3 |

Demo-Submissions (Talentwettbewerb, Kandidaten: Anna, Ben, Clara):
- **jury2** – alle 3 bewertet
- **jury3** – 2/3 (Anna + Clara)
- **jury1** – noch keine Wertung → zeigt orangen Warnblock

---

## Architekturentscheidungen

| Thema | Entscheidung | Begründung |
|-------|---|---|
| Auth | PHP Sessions, SameSite=Strict, HttpOnly | Einfach, sicher, kein Token-Handling nötig |
| CSRF | Origin/Referer-Check + SameSite | Kein separates CSRF-Token nötig für SPA |
| Dev-CORS | `CORS_ALLOWED_ORIGINS` Whitelist | `localhost:5173` überspringt CSRF-Check |
| Publish | Admin-Toggle + Zeitschranke (beide müssen erfüllt sein) | Admin kann Freigabe vorab aktivieren |
| Freigabe-UI | Nur auf Jury-&-Status-Seite | Status vor Freigabe immer sichtbar; verhindert versehentliche Freigabe |
| Freigabe-Sperre | Freigabe blockiert solange Slot aktiv oder Publikum läuft; Ausnahme: alle Jury abgestimmt + kein Publikum | Verhindert Veröffentlichung vor Abstimmungsende; vorzeitige Freigabe nur wenn Ergebnis vollständig |
| 404 vs 403 | Nicht freigegebene Ergebnisse → 404 | Verhindert Information Leakage |
| JSON Concurrency | `flock()` + temp-file rename | Atomares Schreiben ohne externe Lock-Dienste |
| DATA_DIR | Auto-detect: `../data` (dist) oder `../../data` (dev) | Ein `config.php` für beide Layouts |
| Jury-Entfernung | Alle Submissions mitgelöscht | Konsistenz; Frontend warnt mit Bestätigung |
| Kandidaten | `candidate_id` auf Submission; null = einfach, uuid = Kandidaten | Abwärtskompatibel, Repository-neutral |
| Ergebnis-Enthüllung | Animierte Phasen: intro → reveal → finale | Spannung bei öffentlicher Bekanntgabe |
| Responsivität | Mobile-first, Hamburger < 640 px, overflow-x-auto für Tabellen | Nutzbar auf Smartphones, Tablets, Desktop |
| Workflow-Führung | CTAs, Warnungen, Auto-Redirect | Fehlbedienung und vergessene Schritte minimieren |
| Fehlende Abgaben | Konsequenz erklären + Lösungshinweise (Abwählen / Frist verlängern) | Admin kann informiert entscheiden statt blind freigeben |
| total_jury_count | In Public-Results-Response immer enthalten (simple + candidates) | Zuschauer sehen Vollständigkeit der Wertungsbasis |
| Publikumswertung | Einmalige Stimme pro Gerät via Cookie (Best-Effort, nicht manipulationssicher) | Niedrige Einstiegshürde, kein Login nötig |
| Publikum nach Voting | Ergebnislink auf "geschlossen" und "Danke für deine Stimme" | Direkter Übergang zur öffentlichen Ergebnisansicht |
| Infografik Pan+Zoom | CSS-Transform (`translate` + `scale`), dynamische Container-Höhe, Zoom-Toolbar, Tastatur, Doppelklick 2× | Fit-to-View beim Laden; focal-point Zoom; kein Scroll-basiertes Pan → keine Scrollbalken; vollständige Eingabe: Maus, Rad, Touch, Tastatur, Buttons |
| Infografik Tabs | 3 rollenspezifische Bilder (Admin/Jury/Zuschauer), Tab-Umschaltung setzt Fit-to-View zurück | Keine Überfrachtung eines einzelnen Diagramms; Rol­len­per­spek­ti­ve sofort klar |
| Responsives Layout | 2-Spalten-Grid (`lg:grid`) mit sticky Sidebar auf AdminUsersPage, AdminEvalFormPage, AdminAssignmentsPage; `max-w-6xl` im Layout | Nutzt verfügbaren Bildschirmplatz auf Desktop; stapelt mobil |
| Accessibility Modal | `role="dialog"`, `aria-modal`, `aria-labelledby`, Fokus-Trap (Tab/Shift+Tab), Esc-Taste schließt | Teilen-Modal in AdminAssignmentsPage vollständig screenreader-zugänglich |
| Audience Live-Counter | Interval läuft immer; Fenster-Check im Tick (nicht im Effect-Guard) | Start/Stopp an Voting-Window-Grenzen automatisch; kein manueller Re-Mount nötig |
| DRY-Utilities | `utils/formatting.ts` + `utils/errors.ts` + `EmptyState` | fmtDate, getErrorMessage und Leer-Zustand je einmalig zentralisiert |
| Linting | ESLint v9 Flat Config + TS + React Hooks | Konsistente statische Analyse (`npm run lint`) im Frontend |

---

## Bekannte Einschränkungen

- Keine MySQL-Implementierung (Repository-Pattern vorbereitet, JSON reicht für aktuellen Umfang)
- Kein E-Mail-Versand (Passwort-Reset nur durch Admin möglich)
- Keine Paginierung (bei sehr vielen Einträgen nachrüsten)
- `scripts/build.sh` nur Unix/macOS — Windows: `cd frontend && npm run build`
- Publikumswertung ist Best-Effort (Cookie-basiert); Inkognito/Cookie-Löschen ermöglicht erneute Stimmen
- Deaktivieren der Publikumswertung löscht vorhandene Stimmen nicht (bei Reaktivierung zählen alte Stimmen mit)
- Keine automatisierten Tests (Infrastruktur-Aufwand; manuelle Tests mit Dummy-Daten)
