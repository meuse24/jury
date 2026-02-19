import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { jury, JuryEvaluationSummary, ApiError } from '../../api/client'
import Alert from '../../components/Alert'
import Spinner from '../../components/Spinner'

function fmtDate(ts: number) {
  return new Date(ts * 1000).toLocaleString('de-AT')
}

const statusLabel = {
  upcoming: { label: 'Bald verfügbar', cls: 'bg-yellow-100 text-yellow-700' },
  open:     { label: 'Offen',          cls: 'bg-green-100 text-green-700'  },
  closed:   { label: 'Geschlossen',    cls: 'bg-gray-100 text-gray-600'    },
}

export default function JuryDashboardPage() {
  const [evals, setEvals]   = useState<JuryEvaluationSummary[]>([])
  const [loading, setLoad]  = useState(true)
  const [error, setError]   = useState('')

  useEffect(() => {
    jury.listEvals()
      .then(r => setEvals(r.evaluations))
      .catch(e => setError(e instanceof ApiError ? e.message : 'Fehler beim Laden.'))
      .finally(() => setLoad(false))
  }, [])

  if (loading) return <Spinner />

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Meine Wertungen</h1>
      {error && <Alert type="error">{error}</Alert>}
      {evals.length === 0 && !error && (
        <p className="text-gray-500 text-center py-12">Dir sind noch keine Wertungen zugewiesen.</p>
      )}
      <div className="space-y-4">
        {evals.map(ev => {
          const st = statusLabel[ev.status]
          return (
            <div key={ev.id} className="bg-white shadow rounded-lg p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-semibold">{ev.title}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.cls}`}>{st.label}</span>
                    {ev.has_submission && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">Abgegeben</span>
                    )}
                  </div>
                  {ev.description && <p className="text-sm text-gray-500 mb-2">{ev.description}</p>}
                  <p className="text-xs text-gray-400">
                    {fmtDate(ev.submission_open_at)} – {fmtDate(ev.submission_close_at)}
                  </p>
                </div>
                {ev.status === 'open' && (
                  <Link to={`/jury/evaluations/${ev.id}`}
                    className="shrink-0 bg-indigo-700 hover:bg-indigo-800 text-white px-4 py-2 rounded text-sm">
                    {ev.has_submission ? 'Bearbeiten' : 'Bewerten'}
                  </Link>
                )}
                {ev.status !== 'open' && (
                  <Link to={`/jury/evaluations/${ev.id}`}
                    className="shrink-0 border rounded px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                    Ansehen
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
