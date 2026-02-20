import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { jury, Evaluation, Submission, ScoreEntry, ApiError } from '../../api/client'
import Alert from '../../components/Alert'
import Spinner from '../../components/Spinner'

export default function JuryEvalPage() {
  const { id } = useParams<{ id: string }>()
  const nav     = useNavigate()

  const [ev, setEv]               = useState<(Evaluation & { status: string }) | null>(null)
  const [submissions, setSubs]    = useState<Submission[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState('')
  const [saving, setSaving]       = useState(false)
  const [activeCandidateId, setActiveCandidateId] = useState<string | null>(null)
  const [scoresByCand, setScoresByCand]   = useState<Record<string, Record<string, number>>>({})
  const [commentByCand, setCommentByCand] = useState<Record<string, string>>({})

  useEffect(() => {
    jury.getEval(id!).then(r => {
      setEv(r.evaluation)
      setSubs(r.submissions)

      const cats       = r.evaluation.categories
      const candidates = r.evaluation.candidates ?? []
      const hasCands   = candidates.length > 0

      const subMap: Record<string, Submission> = {}
      for (const s of r.submissions) {
        subMap[s.candidate_id ?? 'no-candidate'] = s
      }

      const keys = hasCands ? candidates.map(c => c.id) : ['no-candidate']
      const initScores: Record<string, Record<string, number>> = {}
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

  // Candidates navigation helpers
  const candidateIds  = ev.candidates?.map(c => c.id) ?? []
  const activeIdx     = candidateIds.indexOf(activeCandidateId ?? '')
  const nextCandidate = activeIdx >= 0 && activeIdx < candidateIds.length - 1
    ? ev.candidates[activeIdx + 1]
    : null
  const submittedCount = submissions.filter(s => s.candidate_id !== null).length
  const allSubmitted   = hasCandidates && submittedCount === ev.candidates.length

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
      setSuccess(
        hasCandidates
          ? nextCandidate
            ? `Wertung für "${ev.candidates.find(c => c.id === activeCandidateId)?.name}" gespeichert!`
            : 'Alle Kandidaten bewertet!'
          : 'Wertung erfolgreich gespeichert!'
      )
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Fehler beim Speichern.')
    } finally {
      setSaving(false)
    }
  }

  const goToNextCandidate = () => {
    if (nextCandidate) {
      setActiveCandidateId(nextCandidate.id)
      setSuccess('')
      setError('')
    }
  }

  return (
    <div className="max-w-2xl w-full space-y-6">

      {/* Back + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => nav('/jury')}
          className="text-gray-400 hover:text-gray-600 text-xl transition-colors"
          aria-label="Zurück"
        >
          ←
        </button>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold leading-tight">{ev.title}</h1>
          {ev.description && <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{ev.description}</p>}
        </div>
      </div>

      {error   && <Alert type="error">{error}</Alert>}
      {success && (
        <Alert type="success">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span>{success}</span>
            {hasCandidates && nextCandidate && (
              <button
                onClick={goToNextCandidate}
                className="text-sm font-medium bg-green-700 hover:bg-green-800 text-white px-3 py-1 rounded transition-colors"
              >
                Weiter: {nextCandidate.name} →
              </button>
            )}
          </div>
        </Alert>
      )}

      {!isOpen && (
        <Alert type="info">
          {ev.status === 'upcoming'
            ? 'Das Einreichfenster ist noch nicht offen.'
            : 'Das Einreichfenster ist geschlossen. Deine gespeicherte Wertung wird unten angezeigt.'}
        </Alert>
      )}

      {/* Kandidaten-Tabs */}
      {hasCandidates && (
        <>
          <div className="border-b flex gap-1 overflow-x-auto pb-0 -mb-px">
            {ev.candidates.map(c => {
              const hasSub = submissions.some(s => s.candidate_id === c.id)
              return (
                <button
                  key={c.id}
                  onClick={() => { setActiveCandidateId(c.id); setSuccess(''); setError('') }}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex items-center gap-1 ${
                    activeCandidateId === c.id
                      ? 'border-indigo-600 text-indigo-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {c.name}
                  {hasSub
                    ? <span className="text-green-500 text-xs">✓</span>
                    : <span className="text-gray-300 text-xs">○</span>
                  }
                </button>
              )
            })}
          </div>

          {/* Kandidaten-Fortschritt */}
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-500">
              Bewertet:{' '}
              <span className="font-semibold text-indigo-700">{submittedCount}</span>
              {' '}von {ev.candidates.length} Kandidaten
            </div>
            {allSubmitted && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                ✓ Alle bewertet
              </span>
            )}
          </div>

          {/* Kandidatenbeschreibung */}
          {activeCandidateId && (() => {
            const cand = ev.candidates.find(c => c.id === activeCandidateId)
            return cand?.description
              ? <p className="text-sm text-gray-500 italic bg-gray-50 rounded px-3 py-2">{cand.description}</p>
              : null
          })()}
        </>
      )}

      {/* Bewertungsformular */}
      <form onSubmit={submit} className="bg-white shadow rounded-lg p-5 sm:p-6 space-y-5">

        {/* Gesamtpunktzahl */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Gesamtpunkte</span>
          <span className="text-2xl font-bold text-indigo-700">{curTotal} / {maxTotal}</span>
        </div>

        {/* Kategorien */}
        {ev.categories.map(cat => (
          <div key={cat.id} className="border-t pt-4">
            <div className="flex justify-between items-start mb-3 gap-2">
              <div className="min-w-0">
                <div className="font-medium">{cat.name}</div>
                {cat.description && <div className="text-sm text-gray-500 mt-0.5">{cat.description}</div>}
              </div>
              <span className="text-xs text-gray-400 shrink-0">0 – {cat.max_score}</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={cat.max_score}
                value={scores[cat.id] ?? 0}
                onChange={e => handleScoreChange(cat.id, parseInt(e.target.value))}
                disabled={!isOpen}
                className="flex-1 accent-indigo-700 min-w-0"
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
                className="w-16 border rounded px-2 py-1 text-sm text-center shrink-0"
              />
            </div>
          </div>
        ))}

        {/* Kommentar */}
        <div className="border-t pt-4">
          <label className="block text-sm font-medium mb-1">Kommentar <span className="font-normal text-gray-400">(optional)</span></label>
          <textarea
            value={comment}
            onChange={e => setCommentByCand(prev => ({ ...prev, [activeKey]: e.target.value }))}
            disabled={!isOpen}
            rows={3}
            className="w-full border rounded px-3 py-2 text-sm disabled:bg-gray-50 resize-none"
            placeholder="Begründung oder Anmerkungen…"
          />
        </div>

        {/* Submit */}
        {isOpen && (
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-indigo-700 hover:bg-indigo-800 text-white py-2.5 rounded font-medium disabled:opacity-50 transition-colors"
            >
              {saving ? 'Speichern…' : currentSub ? 'Wertung aktualisieren' : 'Wertung abgeben'}
            </button>
            {hasCandidates && nextCandidate && (
              <button
                type="button"
                onClick={goToNextCandidate}
                className="sm:w-auto border rounded px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors text-center"
              >
                Überspringen →
              </button>
            )}
          </div>
        )}
      </form>
    </div>
  )
}
