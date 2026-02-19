export default function HelpPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-12">
      <div className="text-center py-6">
        <h1 className="text-3xl font-bold text-indigo-700">Hilfe & Dokumentation</h1>
        <p className="text-gray-500 mt-2">Anleitung für Administratoren, Jury-Mitglieder und Zuschauer</p>
      </div>

      {/* Inhaltsverzeichnis */}
      <nav className="bg-indigo-50 border border-indigo-100 rounded-lg p-5">
        <h2 className="font-semibold text-indigo-800 mb-3">Inhaltsverzeichnis</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm text-indigo-700">
          <li><a href="#anmeldung"        className="hover:underline">Anmeldung & Abmeldung</a></li>
          <li><a href="#admin-benutzer"   className="hover:underline">Admin: Benutzer verwalten</a></li>
          <li><a href="#admin-wertungen"  className="hover:underline">Admin: Wertungen erstellen & bearbeiten</a></li>
          <li><a href="#admin-kandidaten" className="hover:underline">Admin: Kandidaten-Wertungen</a></li>
          <li><a href="#admin-zuweisung"  className="hover:underline">Admin: Jury-Mitglieder zuweisen & Status</a></li>
          <li><a href="#admin-ergebnisse" className="hover:underline">Admin: Ergebnisse freigeben</a></li>
          <li><a href="#jury-bewertung"   className="hover:underline">Jury: Bewertung abgeben</a></li>
          <li><a href="#ergebnisse-public" className="hover:underline">Öffentliche Ergebnisseite</a></li>
          <li><a href="#sicherheit"       className="hover:underline">Sicherheit & Datenschutz</a></li>
        </ol>
      </nav>

      {/* 1 */}
      <section id="anmeldung">
        <SectionTitle nr="1" title="Anmeldung & Abmeldung" />
        <Card>
          <p>Das Jury System ist passwortgeschützt. Alle Bereiche außer den öffentlichen Ergebnisseiten erfordern eine Anmeldung.</p>
          <Steps>
            <Step>Öffne die Startseite der App. Du wirst automatisch zur Anmeldeseite weitergeleitet.</Step>
            <Step>Gib deinen <strong>Benutzernamen</strong> und dein <strong>Passwort</strong> ein und klicke auf <em>Anmelden</em>.</Step>
            <Step>Nach erfolgreicher Anmeldung wirst du je nach Rolle weitergeleitet:
              <ul className="list-disc list-inside ml-4 mt-1 text-gray-600">
                <li><strong>Admin</strong> → Wertungsübersicht</li>
                <li><strong>Jury</strong> → Meine Wertungen</li>
              </ul>
            </Step>
            <Step>Zum Abmelden klicke oben rechts auf <em>Abmelden</em>.</Step>
          </Steps>
          <Note>Passwörter werden verschlüsselt gespeichert (bcrypt). Falls du dein Passwort vergessen hast, wende dich an den Administrator.</Note>
        </Card>
      </section>

      {/* 2 */}
      <section id="admin-benutzer">
        <SectionTitle nr="2" title="Admin: Benutzer verwalten" badge="Admin" />
        <Card>
          <p>Im Bereich <strong>Benutzer</strong> kannst du Konten für Administratoren und Jury-Mitglieder anlegen und verwalten.</p>
          <h3 className="font-semibold mt-4 mb-2">Neuen Benutzer anlegen</h3>
          <Steps>
            <Step>Klicke in der Navigation auf <em>Benutzer</em>.</Step>
            <Step>Fülle das Formular aus: Benutzername, Name, Passwort (mind. 8 Zeichen) und Rolle.</Step>
            <Step>Klicke auf <em>Erstellen</em>. Der Benutzer wird sofort angelegt.</Step>
          </Steps>
          <h3 className="font-semibold mt-4 mb-2">Benutzer bearbeiten</h3>
          <Steps>
            <Step>Klicke in der Benutzerliste auf <em>Bearbeiten</em>.</Step>
            <Step>Ändere Name, Rolle oder Passwort. Das Passwortfeld leer lassen = Passwort bleibt unverändert.</Step>
            <Step>Klicke auf <em>Aktualisieren</em>.</Step>
          </Steps>
          <h3 className="font-semibold mt-4 mb-2">Rollen</h3>
          <table className="w-full text-sm border rounded overflow-hidden mt-2">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2">Rolle</th>
                <th className="text-left px-3 py-2">Berechtigungen</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="px-3 py-2 font-medium">Admin</td>
                <td className="px-3 py-2 text-gray-600">Vollzugriff: Benutzer, Wertungen, Zuweisung, Ergebnisfreigabe</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium">Jury</td>
                <td className="px-3 py-2 text-gray-600">Nur zugewiesene Wertungen sehen und bewerten</td>
              </tr>
            </tbody>
          </table>
          <Note>Du kannst deinen eigenen Account nicht löschen.</Note>
        </Card>
      </section>

      {/* 3 */}
      <section id="admin-wertungen">
        <SectionTitle nr="3" title="Admin: Wertungen erstellen & bearbeiten" badge="Admin" />
        <Card>
          <p>Wertungen definieren, was bewertet wird, welche Kategorien es gibt und in welchem Zeitfenster die Jury abstimmen kann.</p>
          <h3 className="font-semibold mt-4 mb-2">Neue Wertung anlegen</h3>
          <Steps>
            <Step>Klicke auf <em>+ Neue Wertung</em>.</Step>
            <Step>Fülle Titel und Beschreibung aus.</Step>
            <Step>Lege das Einreichfenster fest: <strong>Einreichung ab</strong> und <strong>Einreichung bis</strong>.</Step>
            <Step><strong>Ergebnisse ab</strong>: Frühestmöglicher Zeitpunkt der öffentlichen Veröffentlichung.</Step>
            <Step>Optional: Füge <strong>Kandidaten</strong> hinzu (siehe Abschnitt 4) — ohne Kandidaten arbeitet die Wertung im einfachen Modus.</Step>
            <Step>Lege mindestens eine <strong>Kategorie</strong> an: Name, Beschreibung und maximale Punktzahl.</Step>
            <Step>Klicke auf <em>Erstellen</em>.</Step>
          </Steps>
          <h3 className="font-semibold mt-4 mb-2">Zeitfenster & Status</h3>
          <table className="w-full text-sm border rounded overflow-hidden mt-2">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">Bedeutung</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr><td className="px-3 py-2 font-medium text-yellow-700">Upcoming</td><td className="px-3 py-2 text-gray-600">Einreichfenster noch nicht geöffnet</td></tr>
              <tr><td className="px-3 py-2 font-medium text-green-700">Offen</td><td className="px-3 py-2 text-gray-600">Jury kann gerade Punkte einreichen</td></tr>
              <tr><td className="px-3 py-2 font-medium text-gray-600">Geschlossen</td><td className="px-3 py-2 text-gray-600">Einreichfenster abgelaufen</td></tr>
            </tbody>
          </table>
          <Note>Kategorien und Kandidaten können nachträglich bearbeitet werden, solange noch keine Ergebnisse veröffentlicht wurden.</Note>
        </Card>
      </section>

      {/* 4 — NEU: Kandidaten */}
      <section id="admin-kandidaten">
        <SectionTitle nr="4" title="Admin: Kandidaten-Wertungen" badge="Admin" />
        <Card>
          <p>
            Im <strong>Kandidaten-Modus</strong> treten mehrere Personen oder Teams gegeneinander an.
            Die Jury bewertet jeden Kandidaten <em>einzeln</em> anhand derselben Kategorien.
            Am Ende wird automatisch eine Rangfolge erstellt.
          </p>

          <h3 className="font-semibold mt-4 mb-2">Kandidaten anlegen</h3>
          <Steps>
            <Step>Öffne das Formular <em>Neue Wertung</em> oder <em>Bearbeiten</em>.</Step>
            <Step>Klicke im Abschnitt <strong>Kandidaten</strong> auf <em>+ Hinzufügen</em>.</Step>
            <Step>Trage Name und optionale Beschreibung für jeden Kandidaten ein.</Step>
            <Step>Speichere die Wertung — ab jetzt erscheint für jede Jury pro Kandidat ein eigenes Tab.</Step>
          </Steps>

          <h3 className="font-semibold mt-4 mb-2">Unterschiede zum einfachen Modus</h3>
          <table className="w-full text-sm border rounded overflow-hidden mt-2">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2">Merkmal</th>
                <th className="text-left px-3 py-2">Einfacher Modus</th>
                <th className="text-left px-3 py-2">Kandidaten-Modus</th>
              </tr>
            </thead>
            <tbody className="divide-y text-gray-600">
              <tr>
                <td className="px-3 py-2 font-medium text-gray-700">Bewertung</td>
                <td className="px-3 py-2">1× pro Jury-Mitglied</td>
                <td className="px-3 py-2">1× pro Kandidat pro Jury-Mitglied</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium text-gray-700">Status-Anzeige</td>
                <td className="px-3 py-2">Abgegeben / Ausstehend</td>
                <td className="px-3 py-2">X/Y Kandidaten bewertet</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium text-gray-700">Ergebnisseite</td>
                <td className="px-3 py-2">Kategorie-für-Kategorie-Enthüllung</td>
                <td className="px-3 py-2">Kandidat-für-Kandidat-Enthüllung mit Ranking</td>
              </tr>
            </tbody>
          </table>

          <Note>
            Eine Wertung kann nachträglich von einfach auf Kandidaten umgestellt werden (Kandidaten hinzufügen im Bearbeiten-Formular).
            Bereits abgegebene Wertungen bleiben erhalten.
          </Note>
        </Card>
      </section>

      {/* 5 (ehemals 4) */}
      <section id="admin-zuweisung">
        <SectionTitle nr="5" title="Admin: Jury-Mitglieder zuweisen & Status" badge="Admin" />
        <Card>
          <p>Nur explizit zugewiesene Jury-Mitglieder können eine Wertung sehen und bewerten. Die Seite <em>Jury & Status</em> zeigt außerdem den Einreichstatus jedes Mitglieds.</p>
          <Steps>
            <Step>Öffne die Wertungsübersicht und klicke bei der gewünschten Wertung auf <em>Jury & Status</em>.</Step>
            <Step>Setze Häkchen bei allen Jury-Mitgliedern, die diese Wertung bewerten sollen.</Step>
            <Step>Der aktuelle Einreichstatus wird rechts angezeigt:
              <ul className="list-disc list-inside ml-4 mt-1 text-gray-600">
                <li><strong>Einfacher Modus:</strong> ✓ Abgegeben / ○ Ausstehend</li>
                <li><strong>Kandidaten-Modus:</strong> X/Y Kandidaten mit Einzel-Status je Kandidat</li>
              </ul>
            </Step>
            <Step>Klicke auf <em>Zuweisung speichern</em>.</Step>
          </Steps>
          <Note>
            Wird ein Jury-Mitglied aus der Zuweisung entfernt, werden <strong>alle</strong> seine abgegebenen Wertungen (auch einzelne Kandidaten-Wertungen) unwiderruflich gelöscht.
            Das System warnt vorher mit einem Bestätigungsdialog.
          </Note>
        </Card>
      </section>

      {/* 6 (ehemals 5) */}
      <section id="admin-ergebnisse">
        <SectionTitle nr="6" title="Admin: Ergebnisse freigeben" badge="Admin" />
        <Card>
          <p>Ergebnisse werden <strong>nicht automatisch</strong> veröffentlicht. Es gilt ein zweistufiger Mechanismus:</p>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 mt-3 ml-2">
            <li>Die aktuelle Zeit muss nach dem konfigurierten <strong>Ergebnisse ab</strong>-Zeitpunkt liegen.</li>
            <li>Ein Admin muss die Ergebnisse aktiv <strong>freigeben</strong>.</li>
          </ol>
          <h3 className="font-semibold mt-4 mb-2">Ergebnisse freigeben</h3>
          <Steps>
            <Step>Klicke in der Wertungsübersicht auf <em>Freigeben</em>.</Step>
            <Step>Die Ergebnisseite ist nun öffentlich zugänglich — auch ohne Login.</Step>
          </Steps>
          <h3 className="font-semibold mt-4 mb-2">Ergebnisse zurückziehen</h3>
          <Steps>
            <Step>Klicke auf <em>Zurückziehen</em>. Die öffentliche Seite zeigt dann wieder eine "Nicht verfügbar"-Meldung.</Step>
          </Steps>
          <Note>Der Admin kann die Freigabe vorab setzen — die öffentliche Seite bleibt trotzdem gesperrt, bis der <em>Ergebnisse ab</em>-Zeitpunkt erreicht ist.</Note>
        </Card>
      </section>

      {/* 7 (ehemals 6) */}
      <section id="jury-bewertung">
        <SectionTitle nr="7" title="Jury: Bewertung abgeben" badge="Jury" badgeColor="blue" />
        <Card>
          <p>Als Jury-Mitglied siehst du nur die Wertungen, denen du zugewiesen wurdest.</p>

          <h3 className="font-semibold mt-4 mb-2">Einfacher Modus (keine Kandidaten)</h3>
          <Steps>
            <Step>Nach der Anmeldung siehst du alle dir zugewiesenen Wertungen.</Step>
            <Step>Klicke bei einer <strong>offenen</strong> Wertung auf <em>Bewerten</em>.</Step>
            <Step>Vergib für jede Kategorie Punkte zwischen 0 und dem angezeigten Maximum — per Schieberegler oder Zahleneingabe.</Step>
            <Step>Optional: Trage einen Kommentar ein.</Step>
            <Step>Klicke auf <em>Wertung abgeben</em>.</Step>
          </Steps>

          <h3 className="font-semibold mt-4 mb-2">Kandidaten-Modus</h3>
          <Steps>
            <Step>Öffne die Wertung — oben erscheinen <strong>Tabs</strong> für jeden Kandidaten.</Step>
            <Step>Wähle einen Kandidaten-Tab. Ein <span className="text-green-600 font-bold">✓</span> zeigt an, dass du für diesen Kandidaten bereits bewertet hast.</Step>
            <Step>Vergib die Punkte und klicke auf <em>Wertung abgeben</em>. Die Wertung gilt nur für diesen Kandidaten.</Step>
            <Step>Wechsle zum nächsten Tab und wiederhole den Vorgang für jeden Kandidaten.</Step>
            <Step>Die Fortschrittsanzeige zeigt, wie viele Kandidaten du bereits bewertet hast.</Step>
          </Steps>

          <h3 className="font-semibold mt-4 mb-2">Wertung nachträglich ändern</h3>
          <p className="text-sm text-gray-600">Solange das Einreichfenster offen ist, kannst du jede Wertung (auch je Kandidat) beliebig oft ändern.</p>
          <Note>Nach Ablauf des Einreichfensters sind keine Änderungen mehr möglich. Das Formular wird dann im Lesemodus angezeigt.</Note>
        </Card>
      </section>

      {/* 8 (ehemals 7) */}
      <section id="ergebnisse-public">
        <SectionTitle nr="8" title="Öffentliche Ergebnisseite" />
        <Card>
          <p>Nach Freigabe durch den Administrator sind die Ergebnisse <strong>ohne Login</strong> öffentlich einsehbar. Die Enthüllung erfolgt animiert — Schritt für Schritt.</p>

          <h3 className="font-semibold mt-4 mb-2">Einfacher Modus</h3>
          <Steps>
            <Step>Klicke auf <em>Ergebnisse enthüllen</em>.</Step>
            <Step>Jede Kategorie wird einzeln mit animiertem Balken und Durchschnittspunktzahl enthüllt.</Step>
            <Step>Am Ende erscheint das Gesamtergebnis mit Übersicht aller Kategorien.</Step>
          </Steps>

          <h3 className="font-semibold mt-4 mb-2">Kandidaten-Modus</h3>
          <Steps>
            <Step>Klicke auf <em>Rangfolge enthüllen</em>.</Step>
            <Step>Die Kandidaten werden in umgekehrter Reihenfolge enthüllt — der Letztplatzierte zuerst, der Sieger zuletzt.</Step>
            <Step>Für jeden Kandidaten erscheinen animierter Balken, Gesamtdurchschnitt und Kategorien-Aufschlüsselung.</Step>
            <Step>Am Ende wird der <strong>Gewinner</strong> mit goldenem Finale und vollständiger Rangliste präsentiert.</Step>
          </Steps>

          <Note>Die URL lautet <code className="bg-gray-100 px-1.5 py-0.5 rounded">/apps/jury/results/[ID]</code> und kann öffentlich verlinkt werden. Falls die Ergebnisse noch nicht freigegeben sind, erscheint eine neutrale "Nicht verfügbar"-Meldung.</Note>
        </Card>
      </section>

      {/* 9 (ehemals 8) */}
      <section id="sicherheit">
        <SectionTitle nr="9" title="Sicherheit & Datenschutz" />
        <Card>
          <ul className="space-y-2 text-sm text-gray-700">
            <li><span className="font-medium">🔒 Passwörter</span> werden verschlüsselt gespeichert (bcrypt, kein Klartext).</li>
            <li><span className="font-medium">🍪 Sessions</span> verwenden HttpOnly-Cookies, die nicht per JavaScript auslesbar sind.</li>
            <li><span className="font-medium">🚫 Datendateien</span> sind nicht direkt über HTTP abrufbar — der Datenzugriff erfolgt ausschließlich über die API.</li>
            <li><span className="font-medium">👁 Ergebnis-Leakage</span> wird verhindert: nicht freigegebene Wertungen geben eine neutrale 404-Antwort zurück.</li>
            <li><span className="font-medium">🎯 Jury-Isolation</span>: Jury-Mitglieder sehen ausschließlich ihre zugewiesenen Wertungen.</li>
          </ul>
          <Note>Ändere das Standard-Passwort <strong>admin123</strong> nach dem ersten Login sofort unter <em>Benutzer → Bearbeiten</em>.</Note>
        </Card>
      </section>
    </div>
  )
}

// ---- Hilfskomponenten ----

function SectionTitle({ nr, title, badge, badgeColor = 'purple' }: {
  nr: string; title: string; badge?: string; badgeColor?: 'purple' | 'blue'
}) {
  const colors = { purple: 'bg-purple-100 text-purple-700', blue: 'bg-blue-100 text-blue-700' }
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-700 text-white text-sm font-bold flex items-center justify-center">{nr}</span>
      <h2 className="text-xl font-bold text-gray-800">{title}</h2>
      {badge && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[badgeColor]}`}>{badge}</span>}
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white shadow rounded-lg p-6 space-y-3 text-sm text-gray-700">{children}</div>
}

function Steps({ children }: { children: React.ReactNode }) {
  return <ol className="list-decimal list-inside space-y-1.5 ml-2">{children}</ol>
}

function Step({ children }: { children: React.ReactNode }) {
  return <li className="text-gray-700">{children}</li>
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded px-4 py-2 text-amber-800 text-xs mt-3">
      <strong>Hinweis:</strong> {children}
    </div>
  )
}
