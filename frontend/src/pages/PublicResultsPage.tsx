import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { publicApi, PublicResults, ApiError } from '../api/client'
import Spinner from '../components/Spinner'
import Alert from '../components/Alert'

export default function PublicResultsPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData]     = useState<PublicResults | null>(null)
  const [loading, setLoad]  = useState(true)
  const [error, setError]   = useState('')

  useEffect(() => {
    publicApi.getResults(id!)
      .then(setData)
      .catch(e => setError(e instanceof ApiError && e.status === 404
        ? 'Die Ergebnisse sind noch nicht verfügbar oder diese Wertung existiert nicht.'
        : 'Fehler beim Laden der Ergebnisse.'))
      .finally(() => setLoad(false))
  }, [id])

  if (loading) return <Spinner />

  if (error || !data) return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <div className="text-center space-y-3">
        <div className="text-5xl">🏆</div>
        <Alert type="info">{error}</Alert>
      </div>
    </div>
  )

  const { evaluation, results } = data
  const totalMaxPerJuror = results.categories.reduce((s, c) => s + c.max_score, 0)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2 py-4">
        <div className="text-4xl">🏆</div>
        <h1 className="text-3xl font-bold">{evaluation.title}</h1>
        {evaluation.description && <p className="text-gray-600">{evaluation.description}</p>}
        {evaluation.published_at && (
          <p className="text-xs text-gray-400">
            Veröffentlicht: {new Date(evaluation.published_at * 1000).toLocaleString('de-AT')}
          </p>
        )}
      </div>

      <div className="bg-indigo-700 text-white rounded-lg p-6 text-center shadow">
        <div className="text-5xl font-bold">{results.total_average?.toFixed(2) ?? '—'}</div>
        <div className="text-indigo-200 mt-1">Durchschnitt gesamt (max. {totalMaxPerJuror})</div>
        <div className="text-sm text-indigo-300 mt-2">{results.submission_count} Jury-Wertung(en)</div>
      </div>

      <div className="space-y-3">
        {results.categories.map(cat => {
          const pct = totalMaxPerJuror > 0 ? (cat.average ?? 0) / cat.max_score * 100 : 0
          return (
            <div key={cat.id} className="bg-white shadow rounded-lg p-5">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">{cat.name}</span>
                <span className="text-2xl font-bold text-indigo-700">
                  {cat.average?.toFixed(2) ?? '—'}
                  <span className="text-sm text-gray-400 font-normal"> / {cat.max_score}</span>
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all"
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
              <div className="text-xs text-gray-400 mt-1">Summe: {cat.sum}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
