import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { jury, Evaluation, Submission, ScoreEntry, ApiError } from '../../api/client'
import Alert from '../../components/Alert'
import Spinner from '../../components/Spinner'

export default function JuryEvalPage() {
  const { id } = useParams<{ id: string }>()
  const nav     = useNavigate()

  const [ev, setEv]         = useState<(Evaluation & { status: string }) | null>(null)
  const [submissions, setSubs] = useState<Submission[]>([])
  const [loading, setLoading]  = useState(true)
  const [error, setError]      = useState('')
  const [success, setSuccess]  = useState('')
  const [saving, setSaving]    = useState(false)

  // Candidates mode: which candidate is currently selected
  const [activeCandidateId, setActiveCandidateId] = useState<string | null>(null)

  // Per-key scores and comments (key = candidate_id or 'no-candidate')
  const [scoresByCand, setScoresByCand]     = useState<Record<string, Record<string, number>>>({})
  const [commentByCand, setCommentByCand]   = useState<Record<string, string>>({})

  useEffect(() => {
    jury.getEval(id!).then(r => {
      setEv(r.evaluation)
      setSubs(r.submissions)

      const cats       = r.evaluation.categories
      const candidates = r.evaluation.candidates ?? []
      const hasCands   = candidates.length > 0

      // Build submission map keyed by candidate_id (or 'no-candidate')
      const subMap: Record<string, Submission> = {}
      for (const s of r.submissions) {
        subMap[s.candidate_id ?? 'no-candidate'] = s
      }

      const keys = hasCands ? candidates.map(c => c.id) : ['no-candidate']
      const initScores: Record<string, Record<string, number>>  = {}
      const initComments: Record<string, string> = {}

      for (const key of keys) {
        const sub = subMap[key]
        const scoreMap: Record<string, number> = {}
        cats.forEach(c => { scoreMap[c.id] = 0 })
        if (sub) {
          sub.scores.forEach(s => { scoreMap[s.category_id] = s.score })
          initComments[key] = sub.comment ?? ''
        } else {
          initComments[key] = ''
        }
        initScores[key] = scoreMap
      }

      setScoresByCand(initScores)
      setCommentByCand(initComments)
      if (hasCands) setActiveCandidateId(candidates[0].id)
    }).catch(e => setError(e instanceof ApiError ? e.message : 'Fehler beim Laden.'))
    .finally(() => setLoading(false))
  }, [id])

  if (loading) return <Spinner />
  if (!ev)     return <Alert type="error">{error || 'Wertung nicht gefunden.'}</Alert>

  const hasCandidates = (ev.candidates?.length ?? 0) > 0
  const activeKey     = hasCandidates ? (activeCandidateId ?? '') : 'no-candidate'
  const scores        = scoresByCand[activeKey] ?? {}
  const comment       = commentByCand[activeKey] ?? ''
  const currentSub    = submissions.find(s => (s.candidate_id ?? 'no-candidate') === activeKey) ?? null
  const isOpen        = ev.status === 'open'
  const maxTotal      = ev.categories.reduce((s, c) => s + c.max_score, 0)
  const curTotal      = Object.values(scores).reduce((s, v) => s + v, 0)

  const handleScoreChange = (catId: string, value: number) =>
    setScoresByCand(prev => ({ ...prev, [activeKey]: { ...prev[activeKey], [catId]: value } }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ev) return
    setSaving(true); setError(''); setSuccess('')
    try {
      const scoreEntries: ScoreEntry[] = ev.categories.map(c => ({
        category_id: c.id,
        score: scores[c.id] ?? 0,
      }))

      let newSub: Submission
      if (hasCandidates && activeCandidateId) {
        const r = await jury.putCandidateSubmission(id!, activeCandidateId, scoreEntries, comment || undefined)
        newSub = r.submission
      } else {
        const r = await jury.putSubmission(id!, scoreEntries, comment || undefined)
        newSub = r.submission
      }

      setSubs(prev => [
        ...prev.filter(s => (s.candidate_id ?? 'no-candidate') !== activeKey),
        newSub,
      ])
      setSuccess('Wertung erfolgreich gespeichert!')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Fehler beim Speichern.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => nav('/jury')} className="text-gray-400 hover:text-gray-600 text-xl">←</button>
        <h1 className="text-2xl font-bold">{ev.title}</h1>
      </div>

      {ev.description && <p className="text-gray-600">{ev.description}</p>}

      {error   && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      {!isOpen && (
        <Alert type="info">
          {ev.status === 'upcoming'
            ? 'Das Einreichfenster ist noch nicht offen.'
            : 'Das Einreichfenster ist geschlossen. Deine gespeicherte Wertung wird unten angezeigt.'}
        </Alert>
      )}

      {/* Candidate tabs */}
      {hasCandidates && (
        <div className="border-b flex gap-1 overflow-x-auto">
          {ev.candidates.map(c => {
            const hasSub = submissions.some(s => s.candidate_id === c.id)
            return (
              <button
                key={c.id}
                onClick={() => { setActiveCandidateId(c.id); setSuccess('') }}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeCandidateId === c.id
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {c.name}
                {hasSub && <span className="ml-1.5 text-green-500 text-xs">✓</span>}
              </button>
            )
          })}
        </div>
      )}

      {/* Candidate description */}
      {hasCandidates && activeCandidateId && (() => {
        const cand = ev.candidates.find(c => c.id === activeCandidateId)
        return cand?.description
          ? <p className="text-sm text-gray-500 italic">{cand.description}</p>
          : null
      })()}

      {/* Progress summary for candidates mode */}
      {hasCandidates && (
        <div className="text-sm text-gray-500">
          Bewertet: <span className="font-semibold text-indigo-700">
            {submissions.filter(s => s.candidate_id !== null).length}
          </span> von {ev.candidates.length} Kandidaten
        </div>
      )}

      <form onSubmit={submit} className="bg-white shadow rounded-lg p-6 space-y-5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-600">Gesamtpunkte</span>
          <span className="text-2xl font-bold text-indigo-700">{curTotal} / {maxTotal}</span>
        </div>

        {ev.categories.map(cat => (
          <div key={cat.id} className="border-t pt-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="font-medium">{cat.name}</div>
                {cat.description && <div className="text-sm text-gray-500">{cat.description}</div>}
              </div>
              <span className="text-sm text-gray-500">0 – {cat.max_score}</span>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={0}
                max={cat.max_score}
                value={scores[cat.id] ?? 0}
                onChange={e => handleScoreChange(cat.id, parseInt(e.target.value))}
                disabled={!isOpen}
                className="flex-1 accent-indigo-700"
              />
              <input
                type="number"
                min={0}
                max={cat.max_score}
                value={scores[cat.id] ?? 0}
                onChange={e => {
                  const v = Math.min(cat.max_score, Math.max(0, parseInt(e.target.value) || 0))
                  handleScoreChange(cat.id, v)
                }}
                disabled={!isOpen}
                className="w-16 border rounded px-2 py-1 text-sm text-center"
              />
            </div>
          </div>
        ))}

        <div className="border-t pt-4">
          <label className="block text-sm font-medium mb-1">Kommentar (optional)</label>
          <textarea
            value={comment}
            onChange={e => setCommentByCand(prev => ({ ...prev, [activeKey]: e.target.value }))}
            disabled={!isOpen}
            rows={3}
            className="w-full border rounded px-3 py-2 text-sm disabled:bg-gray-50"
            placeholder="Begründung oder Anmerkungen…"
          />
        </div>

        {isOpen && (
          <button type="submit" disabled={saving}
            className="w-full bg-indigo-700 hover:bg-indigo-800 text-white py-2 rounded font-medium disabled:opacity-50">
            {saving ? 'Speichern…' : currentSub ? 'Wertung aktualisieren' : 'Wertung abgeben'}
          </button>
        )}
      </form>
    </div>
  )
}
