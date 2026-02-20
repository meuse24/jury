// ---- Hilfskomponenten ----

function SectionTitle({ nr, title, badge, badgeColor = 'purple' }: {
  nr: string; title: string; badge?: string; badgeColor?: 'purple' | 'blue' | 'green'
}) {
  const colors = {
    purple: 'bg-purple-100 text-purple-700',
    blue:   'bg-blue-100 text-blue-700',
    green:  'bg-green-100 text-green-700',
  }
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="flex-shrink-0 w-9 h-9 rounded-full bg-indigo-700 text-white text-sm font-bold flex items-center justify-center shadow">
        {nr}
      </span>
      <h2 className="text-xl font-bold text-gray-800">{title}</h2>
      {badge && (
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${colors[badgeColor]}`}>
          {badge}
        </span>
      )}
    </div>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white shadow rounded-xl p-6 space-y-3 text-sm text-gray-700 ${className}`}>
      {children}
    </div>
  )
}

function Steps({ children }: { children: React.ReactNode }) {
  return <ol className="list-decimal list-inside space-y-2 ml-1">{children}</ol>
}

function Step({ children }: { children: React.ReactNode }) {
  return <li className="text-gray-700 leading-snug">{children}</li>
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-amber-800 text-xs mt-2">
      <strong>Hinweis: </strong>{children}
    </div>
  )
}

function BestPractice({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-green-800 text-xs mt-2">
      <strong>Best Practice: </strong>{children}
    </div>
  )
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 text-orange-800 text-xs mt-2">
      <strong>Achtung: </strong>{children}
    </div>
  )
}

function WorkflowStep({ n, title, desc, last = false }: {
  n: number; title: string; desc: string; last?: boolean
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
          {n}
        </div>
        {!last && <div className="w-0.5 flex-1 bg-indigo-100 my-1" />}
      </div>
      <div className={`pb-5 ${last ? '' : ''}`}>
        <p className="font-semibold text-gray-800 text-sm">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

// ---- Hauptkomponente ----

export default function HelpPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-12 pb-16">

      {/* Hero */}
      <div className="text-center py-8">
        <div className="text-5xl mb-3">⚖</div>
        <h1 className="text-3xl font-bold text-indigo-700">Hilfe & Dokumentation</h1>
        <p className="text-gray-500 mt-2">Anleitung für Administratoren, Jury-Mitglieder und Zuschauer</p>
      </div>

      {/* Schnellstart-Karten */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a href="#admin-workflow"
          className="block bg-purple-50 border-2 border-purple-200 rounded-xl p-5 hover:border-purple-400 transition-colors group">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🛠</span>
            <span className="font-bold text-purple-800 group-hover:underline">Admin-Workflow</span>
          </div>
          <p className="text-xs text-purple-700">Benutzer anlegen → Wertung erstellen → Jury zuweisen → Ergebnisse freigeben</p>
        </a>
        <a href="#jury-workflow"
          className="block bg-blue-50 border-2 border-blue-200 rounded-xl p-5 hover:border-blue-400 transition-colors group">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">✍</span>
            <span className="font-bold text-blue-800 group-hover:underline">Jury-Workflow</span>
          </div>
          <p className="text-xs text-blue-700">Anmelden → Wertung öffnen → Punkte vergeben → Abgeben</p>
        </a>
      </div>

      {/* Inhaltsverzeichnis */}
      <nav className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
        <h2 className="font-semibold text-indigo-800 mb-3">Inhaltsverzeichnis</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm text-indigo-700 columns-1 sm:columns-2">
          <li><a href="#anmeldung"         className="hover:underline">Anmeldung &amp; Abmeldung</a></li>
          <li><a href="#admin-workflow"    className="hover:underline">Admin: Kompletter Workflow</a></li>
          <li><a href="#admin-benutzer"    className="hover:underline">Admin: Benutzer verwalten</a></li>
          <li><a href="#admin-wertungen"   className="hover:underline">Admin: Wertungen erstellen</a></li>
          <li><a href="#admin-kandidaten"  className="hover:underline">Admin: Kandidaten-Modus</a></li>
          <li><a href="#admin-status"      className="hover:underline">Admin: Jury-Status &amp; Freigabe</a></li>
          <li><a href="#jury-workflow"     className="hover:underline">Jury: Kompletter Workflow</a></li>
          <li><a href="#jury-bewertung"    className="hover:underline">Jury: Bewertung abgeben</a></li>
          <li><a href="#ergebnisse-public" className="hover:underline">Öffentliche Ergebnisseite</a></li>
          <li><a href="#sicherheit"        className="hover:underline">Sicherheit &amp; Datenschutz</a></li>
        </ol>
      </nav>

      {/* 1 – Anmeldung */}
      <section id="anmeldung">
        <SectionTitle nr="1" title="Anmeldung & Abmeldung" />
        <Card>
          <p>Das Jury System ist passwortgeschützt. Alle Bereiche außer den öffentlichen Ergebnisseiten erfordern eine Anmeldung.</p>
          <Steps>
            <Step>Öffne die Startseite — du wirst automatisch zur Anmeldeseite weitergeleitet.</Step>
            <Step>Gib <strong>Benutzername</strong> und <strong>Passwort</strong> ein und klicke auf <em>Anmelden</em>.</Step>
            <Step>Nach der Anmeldung wirst du je nach Rolle direkt weitergeleitet:
              <ul className="list-disc list-inside ml-4 mt-1 text-gray-600 space-y-0.5">
                <li><strong>Admin</strong> → Wertungsübersicht</li>
                <li><strong>Jury</strong> → Meine Wertungen</li>
              </ul>
            </Step>
            <Step>Zum Abmelden: Klicke oben rechts auf <em>Abmelden</em> (auf Mobile: Hamburger-Menü öffnen).</Step>
          </Steps>
          <table className="w-full text-sm border rounded-lg overflow-hidden mt-3">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2">Rolle</th>
                <th className="text-left px-3 py-2">Berechtigungen</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="px-3 py-2 font-medium">
                  <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-semibold">Admin</span>
                </td>
                <td className="px-3 py-2 text-gray-600">Vollzugriff: Benutzer, Wertungen, Zuweisung, Freigabe</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium">
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-semibold">Jury</span>
                </td>
                <td className="px-3 py-2 text-gray-600">Nur zugewiesene Wertungen sehen und Punkte abgeben</td>
              </tr>
            </tbody>
          </table>
          <Note>Passwörter werden verschlüsselt gespeichert (bcrypt). Bei vergessenem Passwort: Administrator kontaktieren.</Note>
        </Card>
      </section>

      {/* 2 – Admin-Workflow */}
      <section id="admin-workflow">
        <SectionTitle nr="2" title="Admin: Kompletter Workflow" badge="Admin" />
        <Card>
          <p className="font-medium text-gray-800">
            Dieser Abschnitt beschreibt den empfohlenen Ablauf von Anfang bis zur Ergebnisveröffentlichung.
          </p>

          <div className="mt-4">
            <WorkflowStep n={1} title="Jury-Mitglieder anlegen"
              desc="Lege zuerst alle Jury-Mitglieder unter Benutzer an (Rolle: Jury). Ohne Jury-Konten kannst du keine Wertung zuweisen." />
            <WorkflowStep n={2} title="Wertung erstellen"
              desc="Klicke auf + Neue Wertung. Wähle den Modus: Einfach (eine Gesamtbewertung) oder Kandidaten (jedes Mitglied einzeln bewertet). Lege Zeitfenster und Kategorien fest." />
            <WorkflowStep n={3} title="Jury zuweisen"
              desc="Nach dem Erstellen wirst du direkt zur Seite Jury & Status weitergeleitet. Setze Häkchen und speichere. Ab jetzt sehen die Jury-Mitglieder die Wertung." />
            <WorkflowStep n={4} title="Bewertungsphase beobachten"
              desc="Unter Jury & Status siehst du live, wer bereits bewertet hat. Orange = ausstehend, Grün = abgegeben. Erinnere fehlende Mitglieder rechtzeitig." />
            <WorkflowStep n={5} title="Ergebnisse freigeben" last
              desc="Wenn alle Wertungen vollständig sind, erscheint der grüne Button Ergebnisse freigeben direkt auf der Jury-&-Status-Seite. Nur dort kann freigegeben werden." />
          </div>

          <BestPractice>
            Erstelle Jury-Mitglieder <strong>vor</strong> der Wertung. Lege das Einreichfenster so, dass die Jury ausreichend Zeit hat (mind. 24 h). Gib Ergebnisse erst frei, wenn <strong>alle</strong> Jury-Mitglieder vollständig bewertet haben.
          </BestPractice>

          <Warning>
            Das Einreichfenster lässt sich nach dem Erstellen zwar bearbeiten, aber bereits abgegebene Wertungen bleiben erhalten — prüfe Zeitfenster sorgfältig vor dem Start.
          </Warning>

          <h3 className="font-semibold mt-5 mb-2">Checkliste vor der Freigabe</h3>
          <ul className="space-y-1.5 text-sm text-gray-700">
            {[
              'Alle Jury-Mitglieder haben vollständig bewertet (grüne Zusammenfassung auf Jury & Status)',
              'Das Einreichfenster ist abgelaufen (oder du bist sicher, dass keine Nachträge mehr kommen)',
              'Der Ergebnisse-ab-Zeitpunkt ist erreicht oder überschritten',
              'Du hast die Ergebnisse stichprobenartig geprüft (Ansehen ↗)',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-gray-300 shrink-0">☐</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* 3 – Benutzer */}
      <section id="admin-benutzer">
        <SectionTitle nr="3" title="Admin: Benutzer verwalten" badge="Admin" />
        <Card>
          <p>Unter <strong>Benutzer</strong> (Navigation oben) verwaltest du alle Konten.</p>

          <h3 className="font-semibold mt-4 mb-2">Neuen Benutzer anlegen</h3>
          <Steps>
            <Step>Klicke in der Navigation auf <em>Benutzer</em>.</Step>
            <Step>Fülle das Formular aus: Benutzername, Name, Passwort und Rolle.</Step>
            <Step>Klicke auf <em>Erstellen</em>. Der Benutzer wird sofort aktiv.</Step>
          </Steps>

          <h3 className="font-semibold mt-4 mb-2">Benutzer bearbeiten</h3>
          <Steps>
            <Step>Klicke in der Liste auf <em>Bearbeiten</em> — das Formular füllt sich automatisch.</Step>
            <Step>Ändere Name, Rolle oder Passwort. Passwortfeld leer lassen = Passwort bleibt unverändert.</Step>
            <Step>Klicke auf <em>Aktualisieren</em>.</Step>
          </Steps>

          <BestPractice>
            Vergib sichere Passwörter (mind. 8 Zeichen, Buchstaben + Zahlen). Kommuniziere die Zugangsdaten sicher — z. B. persönlich oder über einen verschlüsselten Kanal.
          </BestPractice>
          <Note>Du kannst deinen eigenen Account nicht löschen. Das Standard-Passwort <strong>admin123</strong> muss nach dem ersten Login sofort geändert werden.</Note>
        </Card>
      </section>

      {/* 4 – Wertungen */}
      <section id="admin-wertungen">
        <SectionTitle nr="4" title="Admin: Wertungen erstellen & bearbeiten" badge="Admin" />
        <Card>
          <p>Wertungen legen fest, <em>was</em> bewertet wird, <em>wie</em> (Kategorien + Max-Punkte) und <em>wann</em> (Zeitfenster).</p>

          <h3 className="font-semibold mt-4 mb-2">Neue Wertung anlegen</h3>
          <Steps>
            <Step>Klicke auf <em>+ Neue Wertung</em> (oben rechts in der Wertungsübersicht).</Step>
            <Step>Trage <strong>Titel</strong> und optionale <strong>Beschreibung</strong> ein.</Step>
            <Step>Lege das Zeitfenster fest:
              <ul className="list-disc list-inside ml-4 mt-1 text-gray-600 space-y-0.5">
                <li><strong>Einreichung ab / bis</strong> — in diesem Zeitraum kann die Jury Punkte abgeben.</li>
                <li><strong>Ergebnisse ab</strong> — frühestmöglicher Zeitpunkt der öffentlichen Veröffentlichung.</li>
              </ul>
            </Step>
            <Step>Optional: Füge <strong>Kandidaten</strong> hinzu (Abschnitt 5) — ohne Kandidaten läuft alles im einfachen Modus.</Step>
            <Step>Füge mindestens eine <strong>Kategorie</strong> hinzu (Name + Max-Punkte). Kategorien bestimmen, was die Jury bewertet.</Step>
            <Step>Klicke auf <em>Erstellen & Jury zuweisen</em> — du wirst direkt zur Zuweisung weitergeleitet.</Step>
          </Steps>

          <h3 className="font-semibold mt-5 mb-2">Status-Übersicht</h3>
          <table className="w-full text-sm border rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">Bedeutung</th>
                <th className="text-left px-3 py-2">Jury kann bewerten?</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="px-3 py-2"><span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-medium">Bald offen</span></td>
                <td className="px-3 py-2 text-gray-600">Einreichfenster noch nicht gestartet</td>
                <td className="px-3 py-2 text-gray-500">Nein</td>
              </tr>
              <tr>
                <td className="px-3 py-2"><span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">Einreichung offen</span></td>
                <td className="px-3 py-2 text-gray-600">Jury kann jetzt Punkte abgeben</td>
                <td className="px-3 py-2 text-green-600 font-medium">Ja</td>
              </tr>
              <tr>
                <td className="px-3 py-2"><span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium">Geschlossen</span></td>
                <td className="px-3 py-2 text-gray-600">Einreichfenster abgelaufen</td>
                <td className="px-3 py-2 text-gray-500">Nein (Lesemodus)</td>
              </tr>
              <tr>
                <td className="px-3 py-2"><span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">Veröffentlicht</span></td>
                <td className="px-3 py-2 text-gray-600">Ergebnisse öffentlich sichtbar</td>
                <td className="px-3 py-2 text-gray-500">Nein</td>
              </tr>
            </tbody>
          </table>

          <Note>Kategorien und Kandidaten können nachträglich bearbeitet werden. Ändere Kategorien <strong>nicht</strong> während die Jury bereits bewertet — bestehende Punkte könnten inkonsistent werden.</Note>
        </Card>
      </section>

      {/* 5 – Kandidaten */}
      <section id="admin-kandidaten">
        <SectionTitle nr="5" title="Admin: Kandidaten-Modus" badge="Admin" />
        <Card>
          <p>
            Im <strong>Kandidaten-Modus</strong> bewertet die Jury jeden Kandidaten einzeln anhand derselben Kategorien.
            Am Ende erstellt das System automatisch eine Rangfolge.
          </p>

          <h3 className="font-semibold mt-4 mb-2">Kandidaten anlegen</h3>
          <Steps>
            <Step>Öffne <em>Neue Wertung</em> oder <em>Bearbeiten</em>.</Step>
            <Step>Klicke im Abschnitt <strong>Kandidaten</strong> auf <em>+ Hinzufügen</em>.</Step>
            <Step>Trage Name und optionale Beschreibung für jeden Kandidaten ein.</Step>
            <Step>Speichere — jedes Jury-Mitglied sieht nun einen Tab pro Kandidaten.</Step>
          </Steps>

          <h3 className="font-semibold mt-5 mb-2">Einfacher Modus vs. Kandidaten-Modus</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border rounded-lg overflow-hidden min-w-[420px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2">Merkmal</th>
                  <th className="text-left px-3 py-2">Einfach</th>
                  <th className="text-left px-3 py-2">Kandidaten</th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-600">
                <tr>
                  <td className="px-3 py-2 font-medium text-gray-700">Abgaben pro Jury</td>
                  <td className="px-3 py-2">1 Wertung gesamt</td>
                  <td className="px-3 py-2">1 Wertung pro Kandidat</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium text-gray-700">Status-Anzeige</td>
                  <td className="px-3 py-2">✓ Abgegeben / ○ Ausstehend</td>
                  <td className="px-3 py-2">X / Y Kandidaten bewertet</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium text-gray-700">Ergebnisseite</td>
                  <td className="px-3 py-2">Kategorie-Enthüllung</td>
                  <td className="px-3 py-2">Rang-Enthüllung (letzter → Sieger)</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium text-gray-700">Nachträgliche Änderung</td>
                  <td className="px-3 py-2">Jederzeit im offenen Fenster</td>
                  <td className="px-3 py-2">Je Kandidat, im offenen Fenster</td>
                </tr>
              </tbody>
            </table>
          </div>

          <BestPractice>
            Lege alle Kandidaten an, <strong>bevor</strong> du die Jury zuweist und das Einreichfenster startet.
            Kandidaten nachträglich hinzuzufügen ist möglich, führt aber dazu, dass bereits abgegebene Wertungen den neuen Kandidaten nicht enthalten.
          </BestPractice>
        </Card>
      </section>

      {/* 6 – Jury & Status / Freigabe */}
      <section id="admin-status">
        <SectionTitle nr="6" title="Admin: Jury-Status & Ergebnisfreigabe" badge="Admin" />
        <Card>
          <p>
            Die Seite <strong>Jury &amp; Status / Freigabe</strong> ist die zentrale Anlaufstelle für Zuweisung, Statusübersicht
            und Ergebnisfreigabe. Sie ist bewusst an einem Ort gebündelt, damit vor der Freigabe immer der vollständige
            Einreichstatus sichtbar ist.
          </p>

          <h3 className="font-semibold mt-5 mb-2">Jury zuweisen</h3>
          <Steps>
            <Step>Klicke in der Wertungsliste auf <em>Jury &amp; Status / Freigabe</em>.</Step>
            <Step>Setze Häkchen bei allen Jury-Mitgliedern, die bewerten sollen.</Step>
            <Step>Klicke auf <em>Zuweisung speichern</em>. Ab jetzt sehen die Mitglieder die Wertung.</Step>
          </Steps>

          <h3 className="font-semibold mt-5 mb-2">Einreichstatus lesen</h3>
          <p className="text-sm text-gray-600">Der Status wird rechts neben jedem Mitglied angezeigt:</p>
          <ul className="mt-2 space-y-1.5 text-sm text-gray-700">
            <li className="flex items-center gap-2">
              <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap">✓ Abgegeben</span>
              <span className="text-gray-500">— vollständig bewertet</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap">○ Ausstehend</span>
              <span className="text-gray-500">— noch keine Wertung (einfacher Modus)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap">2/3 Kandidaten</span>
              <span className="text-gray-500">— Kandidaten-Modus, teilweise bewertet</span>
            </li>
          </ul>

          <h3 className="font-semibold mt-5 mb-2">Ergebnisse freigeben</h3>
          <p className="text-sm text-gray-600 mb-2">
            Am Ende der Seite befindet sich der Freigabe-Bereich. Er passt sich automatisch dem aktuellen Stand an:
          </p>
          <div className="space-y-2">
            <div className="border-2 border-green-200 bg-green-50 rounded-lg px-4 py-3 text-sm text-green-800">
              <strong>Alle abgegeben</strong> → grüner Button <em>✓ Ergebnisse jetzt freigeben</em>
            </div>
            <div className="border-2 border-amber-200 bg-amber-50 rounded-lg px-4 py-3 text-sm text-amber-800">
              <strong>Noch ausstehend</strong> → namentliche Warnung mit fehlenden Mitgliedern und Button <em>Trotzdem freigeben ⚠</em>
            </div>
            <div className="border-2 border-green-300 bg-green-50 rounded-lg px-4 py-3 text-sm text-green-800">
              <strong>Bereits freigegeben</strong> → Link zur öffentlichen Seite + <em>Freigabe zurückziehen</em>
            </div>
          </div>

          <Warning>
            Wird ein Jury-Mitglied aus der Zuweisung entfernt, werden <strong>alle</strong> seine Wertungen (auch einzelne Kandidaten-Wertungen) unwiderruflich gelöscht. Das System zeigt vorher eine Warnung und fordert eine Bestätigung.
          </Warning>

          <Note>
            Zwei Bedingungen müssen für die öffentliche Sichtbarkeit erfüllt sein: (1) der Admin hat freigegeben
            und (2) der konfigurierte <em>Ergebnisse-ab</em>-Zeitpunkt ist erreicht. Damit kann der Admin die
            Freigabe vorab aktivieren, ohne dass die Ergebnisse sofort sichtbar werden.
          </Note>
        </Card>
      </section>

      {/* 7 – Jury-Workflow */}
      <section id="jury-workflow">
        <SectionTitle nr="7" title="Jury: Kompletter Workflow" badge="Jury" badgeColor="blue" />
        <Card>
          <p className="font-medium text-gray-800">
            Als Jury-Mitglied siehst du nur die Wertungen, für die du zugewiesen wurdest.
            Dieser Abschnitt beschreibt den empfohlenen Ablauf.
          </p>

          <div className="mt-4">
            <WorkflowStep n={1} title="Anmelden & Übersicht verschaffen"
              desc="Nach der Anmeldung siehst du alle dir zugewiesenen Wertungen. Ein oranger Warnblock oben zeigt, welche Wertungen noch deine Bewertung benötigen." />
            <WorkflowStep n={2} title="Offene Wertung öffnen"
              desc="Klicke auf Jetzt bewerten oder Kandidaten bewerten. Der Button ist orange hervorgehoben, solange Bewertungen fehlen." />
            <WorkflowStep n={3} title="Punkte vergeben"
              desc="Vergib für jede Kategorie Punkte per Schieberegler oder Zahlenfeld. Im Kandidaten-Modus: wechsle nach jeder Bewertung zum nächsten Tab — der Weiter-Button erscheint direkt nach dem Speichern." />
            <WorkflowStep n={4} title="Vollständigkeit prüfen & abgeben" last
              desc="Prüfe auf dem Dashboard, ob alle Wertungen vollständig sind (grüner Haken). Solange das Einreichfenster offen ist, kannst du jede Wertung beliebig oft ändern." />
          </div>

          <BestPractice>
            Gib alle Kandidaten-Wertungen in einer Sitzung ab, damit du keinen vergisst.
            Das System zeigt dir auf jedem Kandidaten-Tab ○ (offen) oder ✓ (abgegeben).
            Der Fortschrittsbalken auf dem Dashboard zeigt deinen aktuellen Stand.
          </BestPractice>

          <Warning>
            Nach Ablauf des Einreichfensters sind <strong>keine Änderungen mehr möglich</strong>.
            Das System zeigt dann das Formular im Lesemodus an. Vergissst du die Abgabe,
            erscheint im Dashboard dauerhaft ein roter Hinweis.
          </Warning>

          <h3 className="font-semibold mt-5 mb-2">Warnungen & Hinweise verstehen</h3>
          <div className="space-y-2 text-sm">
            <div className="border-2 border-orange-200 bg-orange-50 rounded-lg px-3 py-2 text-orange-800">
              <strong>⚠️ Oranger Warnblock (Dashboard)</strong> — Du hast noch offene Bewertungen. Klicke auf den verlinkten Titel um direkt dorthin zu springen.
            </div>
            <div className="border-2 border-orange-200 bg-orange-50 rounded-lg px-3 py-2 text-orange-800">
              <strong>⚠️ Oranger Warnblock (Bewertungsseite)</strong> — Im Kandidaten-Modus: Diese Kandidaten fehlen noch. Klicke auf den Namen um direkt zum Tab zu wechseln.
            </div>
            <div className="border border-red-200 bg-red-50 rounded-lg px-3 py-2 text-red-700">
              <strong>✗ Roter Hinweis (Dashboard)</strong> — Das Einreichfenster ist abgelaufen, ohne dass du bewertet hast. Keine Änderung mehr möglich.
            </div>
            <div className="border border-green-200 bg-green-50 rounded-lg px-3 py-2 text-green-700">
              <strong>✓ Grüner Haken</strong> — Vollständig abgegeben. Gut gemacht!
            </div>
          </div>
        </Card>
      </section>

      {/* 8 – Jury: Bewertung */}
      <section id="jury-bewertung">
        <SectionTitle nr="8" title="Jury: Bewertung abgeben" badge="Jury" badgeColor="blue" />
        <Card>
          <h3 className="font-semibold mb-2">Einfacher Modus</h3>
          <Steps>
            <Step>Klicke auf dem Dashboard auf <em>Jetzt bewerten</em>.</Step>
            <Step>Vergib für jede Kategorie Punkte zwischen 0 und dem angezeigten Maximum — per Schieberegler oder Zahlenfeld (beide sind synchronisiert).</Step>
            <Step>Optional: Trage einen Kommentar ein.</Step>
            <Step>Klicke auf <em>Wertung abgeben</em>. Eine grüne Bestätigung erscheint.</Step>
          </Steps>

          <h3 className="font-semibold mt-5 mb-2">Kandidaten-Modus</h3>
          <Steps>
            <Step>Öffne die Wertung — oben erscheinen Tabs für jeden Kandidaten (○ = offen, ✓ = bewertet).</Step>
            <Step>Wähle einen Kandidaten-Tab. Falls vorhanden, siehst du die Kandidatenbeschreibung.</Step>
            <Step>Vergib Punkte und klicke auf <em>Wertung abgeben</em>.</Step>
            <Step>In der Erfolgs-Meldung erscheint der Button <em>Weiter: [Kandidat] →</em> — klicke ihn, um direkt zum nächsten zu gelangen.</Step>
            <Step>Wiederhole für alle Kandidaten. Der Fortschrittsbalken zeigt deinen Stand.</Step>
          </Steps>

          <h3 className="font-semibold mt-5 mb-2">Wertung nachträglich ändern</h3>
          <p className="text-sm text-gray-600">
            Solange das Einreichfenster offen ist, kannst du jede Wertung (auch je Kandidat) beliebig oft ändern.
            Klicke einfach erneut auf <em>Wertung aktualisieren</em>.
          </p>

          <Note>
            Nach Ablauf des Einreichfensters wird das Formular im Lesemodus angezeigt — Schieberegler und Eingaben sind deaktiviert.
            Deine letzte abgegebene Wertung bleibt gespeichert und für den Admin sichtbar.
          </Note>
        </Card>
      </section>

      {/* 9 – Öffentliche Ergebnisse */}
      <section id="ergebnisse-public">
        <SectionTitle nr="9" title="Öffentliche Ergebnisseite" />
        <Card>
          <p>
            Nach Freigabe durch den Administrator sind die Ergebnisse <strong>ohne Login</strong> öffentlich einsehbar.
            Die Enthüllung erfolgt animiert — für Spannung bei der Bekanntgabe.
          </p>

          <h3 className="font-semibold mt-4 mb-2">Einfacher Modus</h3>
          <Steps>
            <Step>Klicke auf <em>Ergebnisse enthüllen</em>.</Step>
            <Step>Jede Kategorie wird einzeln mit animiertem Balken und Durchschnittspunktzahl enthüllt.</Step>
            <Step>Am Ende erscheint das Gesamtergebnis mit vollständiger Kategorien-Aufschlüsselung.</Step>
          </Steps>

          <h3 className="font-semibold mt-5 mb-2">Kandidaten-Modus</h3>
          <Steps>
            <Step>Klicke auf <em>Rangfolge enthüllen</em>.</Step>
            <Step>Die Kandidaten werden in umgekehrter Reihenfolge enthüllt — der Letztplatzierte zuerst, der Sieger zuletzt.</Step>
            <Step>Für jeden Kandidaten erscheinen Gesamtdurchschnitt und Kategorien-Aufschlüsselung.</Step>
            <Step>Am Ende wird der Gewinner mit goldenem Finale und vollständiger Rangliste präsentiert.</Step>
          </Steps>

          <BestPractice>
            Projiziere die Ergebnisseite bei der offiziellen Bekanntgabe auf einen Beamer.
            Die URL <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">/apps/jury/results/[ID]</code> kann öffentlich verlinkt oder per QR-Code geteilt werden.
          </BestPractice>

          <Note>
            Falls die Ergebnisse noch nicht freigegeben sind, erscheint eine neutrale „Nicht verfügbar"-Meldung — kein Hinweis auf Punktzahlen oder Kandidaten.
          </Note>
        </Card>
      </section>

      {/* 10 – Sicherheit */}
      <section id="sicherheit">
        <SectionTitle nr="10" title="Sicherheit & Datenschutz" />
        <Card>
          <ul className="space-y-2.5 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="shrink-0">🔒</span>
              <span><strong>Passwörter</strong> werden verschlüsselt gespeichert (bcrypt, kein Klartext).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="shrink-0">🍪</span>
              <span><strong>Sessions</strong> verwenden HttpOnly-Cookies — nicht per JavaScript auslesbar. Cookie-Attribut SameSite=Strict schützt vor CSRF-Angriffen.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="shrink-0">🚫</span>
              <span><strong>Datendateien</strong> sind nicht direkt über HTTP abrufbar — Zugriff nur über die API.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="shrink-0">👁</span>
              <span><strong>Ergebnis-Leakage</strong> wird verhindert: nicht freigegebene Wertungen liefern eine neutrale 404-Antwort — keine Informationen über Punktzahlen oder Kandidaten.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="shrink-0">🎯</span>
              <span><strong>Jury-Isolation</strong>: Jury-Mitglieder sehen ausschließlich ihre zugewiesenen Wertungen — keine fremden Ergebnisse.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="shrink-0">✍</span>
              <span><strong>Anonymität der Jury</strong>: Einzelne Jury-Wertungen sind nur für Admins einsehbar, nicht öffentlich. Die öffentliche Seite zeigt nur Durchschnittswerte.</span>
            </li>
          </ul>
          <Warning>
            Ändere das Standard-Passwort <strong>admin123</strong> nach dem ersten Login sofort unter <em>Benutzer → Bearbeiten</em>. Teile Zugangsdaten niemals per unverschlüsselter E-Mail.
          </Warning>
        </Card>
      </section>

    </div>
  )
}
