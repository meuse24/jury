import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { jury, JuryEvaluationSummary } from '../../api/client'
import Alert from '../../components/Alert'
import EmptyState from '../../components/EmptyState'
import Spinner from '../../components/Spinner'
import { fmtDate } from '../../utils/formatting'
import { getErrorMessage } from '../../utils/errors'

const statusConfig = {
  upcoming: { label: 'Bald verfügbar', cls: 'bg-yellow-100 text-yellow-700' },
  open:     { label: 'Offen',          cls: 'bg-green-100 text-green-700'  },
  closed:   { label: 'Geschlossen',    cls: 'bg-gray-100 text-gray-600'    },
}

function CandidateProgress({ submitted, total }: { submitted: number; total: number }) {
  const pct = total > 0 ? Math.round((submitted / total) * 100) : 0
  return (
    <div className="mt-2 space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>Kandidaten bewertet</span>
        <span className="font-medium">{submitted} / {total}</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={submitted}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`${submitted} von ${total} Kandidaten bewertet`}
        className="w-full bg-gray-100 rounded-full h-1.5"
      >
        <div
          className={`h-1.5 rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function JuryDashboardPage() {
  const [evals, setEvals]  = useState<JuryEvaluationSummary[]>([])
  const [loading, setLoad] = useState(true)
  const [error, setError]  = useState('')

  useEffect(() => {
    jury.listEvals()
      .then(r => setEvals(r.evaluations))
      .catch(e => setError(getErrorMessage(e, 'Fehler beim Laden.')))
      .finally(() => setLoad(false))
  }, [])

  if (loading) return <Spinner />

  const openEvals = evals.filter(e => e.status === 'open')

  // Offene Wertungen mit noch fehlenden Bewertungen
  const pendingEvals = openEvals.filter(e => {
    if (e.candidate_count > 0) {
      const [done, total] = (e.submission_summary ?? '0/0').split('/').map(Number)
      return done < total || total === 0
    }
    return !e.has_submission
  })

  const allDone = openEvals.length > 0 && pendingEvals.length === 0

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Meine Wertungen</h1>

      {error && <Alert type="error">{error}</Alert>}

      {evals.length === 0 && !error && (
        <EmptyState
          title="Dir sind noch keine Wertungen zugewiesen."
          description="Wende dich an den Administrator."
        />
      )}

      {/* Prominente Warnung wenn noch Bewertungen ausstehen */}
      {pendingEvals.length > 0 && (
        <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4 flex gap-3">
          <span className="text-2xl shrink-0">⚠️</span>
          <div className="space-y-1">
            <p className="font-semibold text-orange-900">
              {pendingEvals.length === 1
                ? 'Du hast noch eine offene Bewertung!'
                : `Du hast noch ${pendingEvals.length} offene Bewertungen!`}
            </p>
            <ul className="text-sm text-orange-800 space-y-0.5">
              {pendingEvals.map(e => {
                const hasCands = e.candidate_count > 0
                const [done, total] = hasCands
                  ? (e.submission_summary ?? '0/0').split('/').map(Number)
                  : [0, 0]
                return (
                  <li key={e.id} className="flex items-center gap-2">
                    <span className="text-orange-400">›</span>
                    <Link to={`/jury/evaluations/${e.id}`} className="hover:underline font-medium">
                      {e.title}
                    </Link>
                    {hasCands && (
                      <span className="text-orange-600 text-xs">({done}/{total} Kandidaten)</span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}

      {allDone && (
        <Alert type="success">
          ✓ Du hast alle offenen Wertungen vollständig abgegeben. Gut gemacht!
        </Alert>
      )}

      <div className="space-y-4">
        {evals.map(ev => {
          const st = statusConfig[ev.status]
          const hasCands   = ev.candidate_count > 0
          const [submittedCands, totalCands] = hasCands
            ? (ev.submission_summary ?? '0/0').split('/').map(Number)
            : [0, 0]
          const isFullyDone = hasCands
            ? submittedCands === totalCands && totalCands > 0
            : ev.has_submission
          const isPending = ev.status === 'open' && !isFullyDone

          return (
            <div
              key={ev.id}
              className={`bg-white shadow rounded-lg p-5 transition-all ${
                isPending ? 'border-l-4 border-orange-400' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left: Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h2 className="text-lg font-semibold leading-tight">{ev.title}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${st.cls}`}>
                      {st.label}
                    </span>
                    {isFullyDone && ev.status === 'open' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium shrink-0">
                        ✓ Vollständig abgegeben
                      </span>
                    )}
                    {isPending && !hasCands && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold shrink-0">
                        ! Noch nicht abgegeben
                      </span>
                    )}
                  </div>

                  {ev.description && (
                    <p className="text-sm text-gray-500 mb-2 line-clamp-2">{ev.description}</p>
                  )}

                  <p className="text-xs text-gray-400">
                    {fmtDate(ev.submission_open_at)} – {fmtDate(ev.submission_close_at)}
                  </p>

                  {/* Kandidaten-Fortschritt */}
                  {hasCands && ev.status === 'open' && (
                    <CandidateProgress submitted={submittedCands} total={totalCands} />
                  )}
                  {hasCands && ev.status !== 'open' && (
                    <p className="text-xs text-gray-400 mt-1">{ev.submission_summary} Kandidaten bewertet</p>
                  )}

                  {/* Hinweis: Einreichfenster geschlossen ohne Abgabe */}
                  {ev.status === 'closed' && !ev.has_submission && ev.candidate_count === 0 && (
                    <p className="text-xs text-red-500 mt-1 font-medium">
                      ✗ Keine Wertung abgegeben – Frist abgelaufen
                    </p>
                  )}
                  {ev.status === 'closed' && hasCands && submittedCands < totalCands && (
                    <p className="text-xs text-red-500 mt-1 font-medium">
                      ✗ Unvollständig abgegeben ({submittedCands}/{totalCands}) – Frist abgelaufen
                    </p>
                  )}
                </div>

                {/* Right: CTA */}
                <div className="shrink-0 flex flex-col gap-2">
                  {ev.status === 'open' ? (
                    <Link
                      to={`/jury/evaluations/${ev.id}`}
                      className={`px-4 py-2 rounded text-sm text-center font-medium transition-colors whitespace-nowrap ${
                        isFullyDone
                          ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          : 'bg-orange-500 hover:bg-orange-600 text-white'
                      }`}
                    >
                      {isFullyDone ? 'Bearbeiten' : hasCands ? 'Kandidaten bewerten' : 'Jetzt bewerten'}
                    </Link>
                  ) : (
                    <Link
                      to={`/jury/evaluations/${ev.id}`}
                      className="border rounded px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors text-center whitespace-nowrap"
                    >
                      Ansehen
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
