import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { jury, Evaluation, Submission, ScoreEntry, ApiError } from '../../api/client'
import Alert from '../../components/Alert'
import Spinner from '../../components/Spinner'

export default function JuryEvalPage() {
  const { id } = useParams<{ id: string }>()
  const nav     = useNavigate()

  const [ev, setEv]           = useState<(Evaluation & { status: string }) | null>(null)
  const [submission, setSub]  = useState<Submission | null>(null)
  const [scores, setScores]   = useState<Record<string, number>>({})
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    jury.getEval(id!).then(r => {
      setEv(r.evaluation)
      setSub(r.submission)
      if (r.submission) {
        const map: Record<string, number> = {}
        r.submission.scores.forEach(s => { map[s.category_id] = s.score })
        setScores(map)
        setComment(r.submission.comment ?? '')
      } else {
        // Init all scores to 0
        const map: Record<string, number> = {}
        r.evaluation.categories.forEach(c => { map[c.id] = 0 })
        setScores(map)
      }
    }).catch(e => setError(e instanceof ApiError ? e.message : 'Fehler beim Laden.'))
    .finally(() => setLoading(false))
  }, [id])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ev) return
    setSaving(true); setError(''); setSuccess('')
    try {
      const scoreEntries: ScoreEntry[] = ev.categories.map(c => ({
        category_id: c.id,
        score: scores[c.id] ?? 0,
      }))
      const r = await jury.putSubmission(id!, scoreEntries, comment || undefined)
      setSub(r.submission)
      setSuccess('Wertung erfolgreich gespeichert!')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Fehler beim Speichern.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />
  if (!ev)     return <Alert type="error">{error || 'Wertung nicht gefunden.'}</Alert>

  const isOpen  = ev.status === 'open'
  const maxTotal = ev.categories.reduce((s, c) => s + c.max_score, 0)
  const curTotal = Object.values(scores).reduce((s, v) => s + v, 0)

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
          {ev.status === 'upcoming' ? 'Das Einreichfenster ist noch nicht offen.' : 'Das Einreichfenster ist geschlossen. Deine gespeicherte Wertung wird unten angezeigt.'}
        </Alert>
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
                onChange={e => setScores(s => ({ ...s, [cat.id]: parseInt(e.target.value) }))}
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
                  setScores(s => ({ ...s, [cat.id]: v }))
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
            onChange={e => setComment(e.target.value)}
            disabled={!isOpen}
            rows={3}
            className="w-full border rounded px-3 py-2 text-sm disabled:bg-gray-50"
            placeholder="Begründung oder Anmerkungen…"
          />
        </div>

        {isOpen && (
          <button type="submit" disabled={saving}
            className="w-full bg-indigo-700 hover:bg-indigo-800 text-white py-2 rounded font-medium disabled:opacity-50">
            {saving ? 'Speichern…' : submission ? 'Wertung aktualisieren' : 'Wertung abgeben'}
          </button>
        )}
      </form>
    </div>
  )
}
