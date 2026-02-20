import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminEvals, Evaluation, ApiError } from '../../api/client'
import Alert from '../../components/Alert'
import Spinner from '../../components/Spinner'

function fmtDate(ts: number) {
  return new Date(ts * 1000).toLocaleString('de-AT')
}

function EvalStatusBadge({ ev }: { ev: Evaluation }) {
  const now = Date.now() / 1000
  if (ev.results_is_published) return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">Veröffentlicht</span>
  )
  if (now < ev.submission_open_at) return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-yellow-100 text-yellow-700">Bald offen</span>
  )
  if (now <= ev.submission_close_at) return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">Einreichung offen</span>
  )
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">Geschlossen</span>
  )
}

export default function AdminEvalsPage() {
  const [evals, setEvals]     = useState<Evaluation[]>([])
  const [loading, setLoad]    = useState(true)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  const load = async () => {
    setLoad(true)
    try {
      const r = await adminEvals.list()
      setEvals(r.evaluations)
    } catch { setError('Fehler beim Laden.') }
    finally { setLoad(false) }
  }

  useEffect(() => { load() }, [])

  const del = async (id: string, title: string) => {
    if (!confirm(`Wertung "${title}" wirklich löschen?`)) return
    try {
      await adminEvals.delete(id)
      setSuccess('Wertung gelöscht.'); setError('')
      await load()
    } catch (e) { setError(e instanceof ApiError ? e.message : 'Fehler.') }
  }

  const togglePublish = async (ev: Evaluation) => {
    try {
      if (ev.results_is_published) {
        await adminEvals.unpublish(ev.id)
        setSuccess('Ergebnisse zurückgezogen.')
      } else {
        await adminEvals.publish(ev.id)
        setSuccess('Ergebnisse freigegeben.')
      }
      setError(''); await load()
    } catch (e) { setError(e instanceof ApiError ? e.message : 'Fehler.') }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Wertungen verwalten</h1>
        <Link
          to="/admin/evaluations/new"
          className="bg-indigo-700 hover:bg-indigo-800 text-white px-4 py-2 rounded text-sm transition-colors shrink-0"
        >
          + Neue Wertung
        </Link>
      </div>

      {error   && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      {loading ? <Spinner /> : (
        <div className="space-y-4">
          {evals.length === 0 && (
            <div className="bg-white shadow rounded-lg p-10 text-center space-y-3">
              <div className="text-4xl text-gray-200">📋</div>
              <p className="text-gray-500">Noch keine Wertungen vorhanden.</p>
              <Link
                to="/admin/evaluations/new"
                className="inline-block bg-indigo-700 hover:bg-indigo-800 text-white px-5 py-2 rounded text-sm transition-colors"
              >
                Erste Wertung erstellen
              </Link>
            </div>
          )}

          {evals.map(ev => {
            const noJury = ev.jury_assignments.length === 0
            return (
              <div key={ev.id} className="bg-white shadow rounded-lg p-5">
                {/* Card Header */}
                <div className="flex items-start gap-4">
                  {/* Left: Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h2 className="text-lg font-semibold leading-tight">{ev.title}</h2>
                      <EvalStatusBadge ev={ev} />
                      {ev.candidates && ev.candidates.length > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-100 text-indigo-700">
                          {ev.candidates.length} Kandidaten
                        </span>
                      )}
                    </div>
                    {ev.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{ev.description}</p>
                    )}
                    <div className="text-xs text-gray-400 mt-2 space-y-0.5">
                      <div>Einreichung: {fmtDate(ev.submission_open_at)} – {fmtDate(ev.submission_close_at)}</div>
                      <div>Ergebnisse ab: {fmtDate(ev.results_publish_at)}</div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span>Jury: {ev.jury_assignments.length} Mitglied(er)</span>
                        <span>·</span>
                        <span>Kategorien: {ev.categories.length}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Workflow CTA: Jury zuweisen wenn noch keine */}
                {noJury && (
                  <div className="mt-3 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
                    <span className="text-amber-600 text-sm shrink-0">⚡ Nächster Schritt:</span>
                    <Link
                      to={`/admin/evaluations/${ev.id}/assignments`}
                      className="text-sm font-medium text-amber-700 hover:underline"
                    >
                      Jury-Mitglieder zuweisen →
                    </Link>
                  </div>
                )}

                {/* Action Bar */}
                <div className="mt-3 pt-3 border-t flex items-center gap-x-4 gap-y-2 flex-wrap text-xs">
                  <Link to={`/admin/evaluations/${ev.id}/edit`}
                    className="text-indigo-600 hover:underline font-medium">
                    Bearbeiten
                  </Link>
                  <Link to={`/admin/evaluations/${ev.id}/assignments`}
                    className="text-indigo-600 hover:underline font-medium">
                    Jury & Status
                  </Link>
                  <button
                    onClick={() => togglePublish(ev)}
                    className={`hover:underline font-medium ${ev.results_is_published ? 'text-orange-600' : 'text-green-600'}`}
                  >
                    {ev.results_is_published ? 'Freigabe zurückziehen' : 'Ergebnisse freigeben'}
                  </button>
                  <Link to={`/results/${ev.id}`} target="_blank" rel="noreferrer"
                    className="text-gray-500 hover:underline">
                    Ergebnisse ansehen ↗
                  </Link>
                  <button
                    onClick={() => del(ev.id, ev.title)}
                    className="text-red-600 hover:underline ml-auto"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
