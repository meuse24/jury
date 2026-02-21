import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { publicApi, AudienceInfo, ApiError } from '../api/client'
import Spinner from '../components/Spinner'
import Alert from '../components/Alert'

export default function AudienceVotePage() {
  const { id } = useParams<{ id: string }>()
  const [info, setInfo] = useState<AudienceInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<string>('')
  const [score, setScore] = useState(0)

  useEffect(() => {
    publicApi.getAudienceInfo(id!)
      .then(r => {
        setInfo(r)
        setScore(Math.floor((r.audience_max_score ?? 10) / 2))
      })
      .catch(e => {
        setLoadError(
          e instanceof ApiError && e.status === 404
            ? 'Für diese Wertung ist keine Publikumswertung verfügbar.'
            : 'Fehler beim Laden der Publikumswertung.'
        )
      })
      .finally(() => setLoading(false))
  }, [id])

  const submit = async () => {
    if (!info) return
    setSubmitting(true)
    setSubmitError('')
    try {
      if (info.mode === 'candidates') {
        await publicApi.voteAudience(id!, { candidate_id: selectedCandidate })
      } else {
        await publicApi.voteAudience(id!, { score })
      }
      setSubmitted(true)
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setSubmitted(true)
      } else if (e instanceof ApiError && e.status === 403) {
        setSubmitError('Die Publikumswertung ist aktuell nicht offen.')
      } else {
        setSubmitError('Fehler beim Senden der Stimme.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Spinner />
  if (loadError || !info) return (
    <div className="flex justify-center items-center min-h-[50vh] px-4">
      <Alert type="info">{loadError || 'Nicht verfügbar.'}</Alert>
    </div>
  )

  const openAt = new Date(info.evaluation.submission_open_at * 1000).toLocaleString('de-AT')
  const closeAt = new Date(info.evaluation.submission_close_at * 1000).toLocaleString('de-AT')

  if (info.status !== 'open') {
    return (
      <div className="max-w-lg mx-auto w-full space-y-4 text-center py-10 px-4">
        <div className="text-5xl">🕒</div>
        <h1 className="text-2xl font-bold">{info.evaluation.title}</h1>
        <p className="text-gray-500 text-sm">
          Die Publikumswertung ist {info.status === 'upcoming' ? 'noch nicht geöffnet' : 'bereits geschlossen'}.
        </p>
        <div className="text-xs text-gray-400">
          Zeitraum: {openAt} – {closeAt}
        </div>
      </div>
    )
  }

  if (submitted || info.already_voted) {
    return (
      <div className="max-w-lg mx-auto w-full text-center py-10 px-4 space-y-4">
        <div className="text-6xl">✅</div>
        <h1 className="text-2xl font-bold">Danke für deine Stimme!</h1>
        <p className="text-gray-500 text-sm">Du kannst nur einmal abstimmen.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto w-full space-y-6 px-4 py-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">{info.evaluation.title}</h1>
        {info.evaluation.description && (
          <p className="text-gray-500">{info.evaluation.description}</p>
        )}
        <p className="text-xs text-gray-400">Du kannst nur einmal abstimmen.</p>
        <p className="text-xs text-gray-400">Zeitraum: {openAt} – {closeAt}</p>
        <p className="text-xs text-gray-400">Teilnehmer bisher: {info.audience_participants}</p>
      </div>

      {submitError && <Alert type="error">{submitError}</Alert>}

      {info.mode === 'candidates' ? (
        <div className="space-y-4">
          <div className="text-sm text-gray-600">Wähle deinen Favoriten:</div>
          <div className="grid gap-3 sm:grid-cols-2">
            {info.candidates.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCandidate(c.id)}
                className={`text-left border rounded-lg p-4 transition-colors ${
                  selectedCandidate === c.id ? 'border-indigo-600 bg-indigo-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="font-semibold">{c.name}</div>
                {c.description && <div className="text-xs text-gray-500 mt-1">{c.description}</div>}
              </button>
            ))}
          </div>
          {!selectedCandidate && (
            <p className="text-xs text-gray-400">Bitte wähle einen Kandidaten aus.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-sm text-gray-600">Vergib deine Punkte:</div>
          <div className="bg-white border rounded-lg p-4 space-y-3">
            <input
              type="range"
              min={0}
              max={info.audience_max_score}
              value={score}
              onChange={e => setScore(parseInt(e.target.value))}
              className="w-full accent-indigo-600"
            />
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>0</span>
              <span>max. {info.audience_max_score}</span>
            </div>
            <div className="text-center text-4xl font-black text-indigo-700">{score}</div>
          </div>
        </div>
      )}

      <button
        onClick={submit}
        disabled={submitting || (info.mode === 'candidates' && !selectedCandidate)}
        className="w-full bg-indigo-700 hover:bg-indigo-800 text-white py-3 rounded-lg font-semibold disabled:opacity-50 transition-colors"
      >
        {submitting ? 'Senden…' : 'Stimme abgeben'}
      </button>
    </div>
  )
}
