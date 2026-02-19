import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminEvals, Evaluation, ApiError } from '../../api/client'
import Alert from '../../components/Alert'
import Spinner from '../../components/Spinner'

function fmtDate(ts: number) {
  return new Date(ts * 1000).toLocaleString('de-AT')
}

export default function AdminEvalsPage() {
  const [evals, setEvals]   = useState<Evaluation[]>([])
  const [loading, setLoad]  = useState(true)
  const [error, setError]   = useState('')
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Wertungen verwalten</h1>
        <Link to="/admin/evaluations/new"
          className="bg-indigo-700 hover:bg-indigo-800 text-white px-4 py-2 rounded text-sm">
          + Neue Wertung
        </Link>
      </div>

      {error   && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      {loading ? <Spinner /> : (
        <div className="space-y-4">
          {evals.length === 0 && <p className="text-gray-500 text-center py-8">Keine Wertungen vorhanden.</p>}
          {evals.map(ev => (
            <div key={ev.id} className="bg-white shadow rounded-lg p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">{ev.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">{ev.description}</p>
                  <div className="text-xs text-gray-400 mt-2 space-y-0.5">
                    <div>Einreichung: {fmtDate(ev.submission_open_at)} – {fmtDate(ev.submission_close_at)}</div>
                    <div>Ergebnisse ab: {fmtDate(ev.results_publish_at)}</div>
                    <div>Jury: {ev.jury_assignments.length} Mitglied(er)</div>
                    <div>Kategorien: {ev.categories.length}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ev.results_is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {ev.results_is_published ? 'Veröffentlicht' : 'Nicht veröffentlicht'}
                  </span>
                  <div className="flex gap-2 text-xs flex-wrap justify-end">
                    <Link to={`/admin/evaluations/${ev.id}/edit`}
                      className="text-indigo-600 hover:underline">Bearbeiten</Link>
                    <Link to={`/admin/evaluations/${ev.id}/assignments`}
                      className="text-indigo-600 hover:underline">Zuweisung</Link>
                    <button onClick={() => togglePublish(ev)}
                      className={`hover:underline ${ev.results_is_published ? 'text-orange-600' : 'text-green-600'}`}>
                      {ev.results_is_published ? 'Zurückziehen' : 'Freigeben'}
                    </button>
                    <a href={`/results/${ev.id}`} target="_blank" rel="noreferrer"
                      className="text-gray-500 hover:underline">Ergebnisse</a>
                    <button onClick={() => del(ev.id, ev.title)}
                      className="text-red-600 hover:underline">Löschen</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
