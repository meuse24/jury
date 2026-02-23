import { useCallback, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { adminEvals, AudienceVoteLog } from '../../api/client'
import Spinner from '../../components/Spinner'
import Alert from '../../components/Alert'
import { fmtDate } from '../../utils/formatting'

export default function AdminAudienceLogPage() {
  const { id } = useParams<{ id: string }>()
  const [title, setTitle]   = useState('')
  const [votes, setVotes]   = useState<AudienceVoteLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const r = await adminEvals.getAudienceVotes(id!)
      setTitle(r.evaluation.title)
      setVotes(r.votes)
    } catch {
      setError('Fehler beim Laden des Abstimmungs-Logs.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading) return <Spinner />

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Publikumswertung – Log</h1>
          {title && <p className="text-sm text-gray-500 mt-0.5">{title}</p>}
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="text-sm border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50"
          >
            Aktualisieren
          </button>
          <Link
            to={`/admin/evaluations/${id}/assignments`}
            className="text-sm border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50"
          >
            ← Zurück
          </Link>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <div className="bg-white shadow rounded-xl overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Eingegangene Stimmen</span>
          <span className="text-xs text-gray-400">{votes.length} Einträge · neueste zuerst</span>
        </div>

        {votes.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">
            Noch keine Stimmen eingegangen.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-gray-500 uppercase tracking-wide">
                  <th className="text-left px-4 py-2 font-medium">#</th>
                  <th className="text-left px-4 py-2 font-medium">Zeitpunkt</th>
                  <th className="text-left px-4 py-2 font-medium">Gerät (Cookie)</th>
                  <th className="text-left px-4 py-2 font-medium">Wertung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {votes.map((v, i) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-400 tabular-nums">{votes.length - i}</td>
                    <td className="px-4 py-2 text-gray-700 whitespace-nowrap tabular-nums">
                      {fmtDate(v.submitted_at)}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-gray-500 break-all">
                      {v.device_id}
                    </td>
                    <td className="px-4 py-2 text-gray-700">
                      {v.candidate_name != null ? (
                        <span className="inline-flex items-center gap-1">
                          <span className="text-indigo-500">▶</span>
                          {v.candidate_name}
                        </span>
                      ) : v.score != null ? (
                        <span>
                          <span className="font-semibold text-indigo-700">{v.score}</span>
                          <span className="text-gray-400"> Punkte</span>
                        </span>
                      ) : (
                        <span className="text-gray-400">–</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
