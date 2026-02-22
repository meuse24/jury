import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminEvals, Category, Candidate, EvalPayload } from '../../api/client'
import Alert from '../../components/Alert'
import Spinner from '../../components/Spinner'
import { getErrorMessage } from '../../utils/errors'

function tsToInput(ts: number | undefined) {
  if (!ts) return ''
  const d = new Date(ts * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function inputToTs(s: string): number {
  return Math.floor(new Date(s).getTime() / 1000)
}

const emptyCategory = (): Omit<Category, 'id'> & { id?: string } =>
  ({ name: '', description: '', max_score: 10 })

const emptyCandidate = (): Omit<Candidate, 'id'> & { id?: string } =>
  ({ name: '', description: '' })

export default function AdminEvalFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit  = id !== undefined && id !== 'new'
  const nav     = useNavigate()

  const [loading, setLoading]       = useState(isEdit)
  const [error, setError]           = useState('')
  const [title, setTitle]           = useState('')
  const [desc, setDesc]             = useState('')
  const [openAt, setOpenAt]         = useState('')
  const [closeAt, setCloseAt]       = useState('')
  const [pubAt, setPubAt]           = useState('')
  const [categories, setCategories] = useState<(Omit<Category,'id'> & {id?:string})[]>([emptyCategory()])
  const [candidates, setCandidates] = useState<(Omit<Candidate,'id'> & {id?:string})[]>([])
  const [audienceEnabled, setAudienceEnabled] = useState(false)
  const [audienceMaxScore, setAudienceMaxScore] = useState(10)
  const [submitting, setSub]        = useState(false)

  // Audience live-data (edit mode only)
  const [origin, setOrigin]               = useState('')
  const [participantCount, setParticipantCount] = useState<number | null>(null)
  const [savedOpenTs, setSavedOpenTs]     = useState<number | null>(null)
  const [savedCloseTs, setSavedCloseTs]   = useState<number | null>(null)
  const [copied, setCopied]               = useState(false)
  const [countdown, setCountdown]         = useState(60)
  const [refreshKey, setRefreshKey]       = useState(0)
  const countdownRef                      = useRef(60)

  useEffect(() => { setOrigin(window.location.origin) }, [])

  useEffect(() => {
    if (!isEdit) return
    adminEvals.get(id!).then(r => {
      const ev = r.evaluation
      setTitle(ev.title)
      setDesc(ev.description)
      setOpenAt(tsToInput(ev.submission_open_at))
      setCloseAt(tsToInput(ev.submission_close_at))
      setPubAt(tsToInput(ev.results_publish_at))
      setCategories(ev.categories)
      setCandidates(ev.candidates ?? [])
      setAudienceEnabled(ev.audience_enabled ?? false)
      setAudienceMaxScore(ev.audience_max_score ?? 10)
      setParticipantCount(ev.audience_participant_count ?? 0)
      setSavedOpenTs(ev.submission_open_at ?? null)
      setSavedCloseTs(ev.submission_close_at ?? null)
    }).catch(() => setError('Wertung nicht gefunden.'))
    .finally(() => setLoading(false))
  }, [id, isEdit])

  const basePath = import.meta.env.VITE_BASE_PATH || '/jurysystem'
  const audienceUrl = (isEdit && audienceEnabled && origin) ? `${origin}${basePath}/audience/${id}` : ''

  const nowTs = Math.floor(Date.now() / 1000)
  const isVotingActive = Boolean(
    isEdit && audienceEnabled && savedOpenTs && savedCloseTs &&
    nowTs >= savedOpenTs && nowTs <= savedCloseTs
  )

  const fetchParticipantCount = useCallback(async () => {
    if (!isEdit || !id) return
    try {
      const r = await adminEvals.get(id)
      setParticipantCount(r.evaluation.audience_participant_count ?? 0)
    } catch { /* silent */ }
  }, [isEdit, id])

  // Countdown + auto-poll every 60s.
  // Interval runs whenever audience is enabled; the window check happens inside
  // each tick so start/stop at window boundaries work automatically.
  useEffect(() => {
    if (!isEdit || !audienceEnabled || !savedOpenTs || !savedCloseTs) return

    countdownRef.current = 60
    setCountdown(60)

    const interval = setInterval(() => {
      const ts = Math.floor(Date.now() / 1000)
      const inWindow = ts >= savedOpenTs && ts <= savedCloseTs

      if (!inWindow) {
        // Outside window: keep countdown frozen at 60 so it's ready when window opens
        countdownRef.current = 60
        setCountdown(60)
        return
      }

      countdownRef.current -= 1
      setCountdown(countdownRef.current)
      if (countdownRef.current <= 0) {
        countdownRef.current = 60
        setCountdown(60)
        fetchParticipantCount()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isEdit, audienceEnabled, savedOpenTs, savedCloseTs, fetchParticipantCount, refreshKey])

  const copyAudienceUrl = async () => {
    if (!audienceUrl) return
    try {
      await navigator.clipboard.writeText(audienceUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { setCopied(false) }
  }

  const handleShare = async () => {
    if (!audienceUrl) return
    if (navigator.share) {
      try { await navigator.share({ url: audienceUrl, title: `Publikumswertung: ${title}` }) }
      catch { /* cancelled */ }
    } else {
      await copyAudienceUrl()
    }
  }

  const manualRefresh = () => {
    fetchParticipantCount()
    setRefreshKey(k => k + 1)
  }

  const addCategory    = () => setCategories(c => [...c, emptyCategory()])
  const removeCategory = (i: number) => setCategories(c => c.filter((_, j) => j !== i))
  const updateCategory = (i: number, field: string, value: string | number) =>
    setCategories(c => c.map((cat, j) => j === i ? { ...cat, [field]: value } : cat))

  const addCandidate    = () => setCandidates(c => [...c, emptyCandidate()])
  const removeCandidate = (i: number) => setCandidates(c => c.filter((_, j) => j !== i))
  const updateCandidate = (i: number, field: string, value: string) =>
    setCandidates(c => c.map((cand, j) => j === i ? { ...cand, [field]: value } : cand))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSub(true); setError('')
    try {
      const payload: EvalPayload = {
        title,
        description: desc,
        submission_open_at:  inputToTs(openAt),
        submission_close_at: inputToTs(closeAt),
        results_publish_at:  inputToTs(pubAt),
        categories: categories.map(c => ({ ...c, max_score: Number(c.max_score) })),
        candidates: candidates.length > 0 ? candidates : [],
        audience_enabled: audienceEnabled,
        audience_max_score: Number(audienceMaxScore),
      }
      if (isEdit) {
        await adminEvals.update(id!, payload)
        nav('/admin/evaluations')
      } else {
        const r = await adminEvals.create(payload)
        // After creating, guide admin directly to jury assignment
        nav(`/admin/evaluations/${r.evaluation.id}/assignments`)
      }
    } catch (e) {
      setError(getErrorMessage(e, 'Fehler beim Speichern.'))
    } finally {
      setSub(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => nav('/admin/evaluations')}
          className="text-gray-400 hover:text-gray-600 text-xl transition-colors"
          aria-label="Zurück"
        >
          ←
        </button>
        <h1 className="text-2xl font-bold">{isEdit ? 'Wertung bearbeiten' : 'Neue Wertung'}</h1>
      </div>
      {error && <Alert type="error">{error}</Alert>}

      <form onSubmit={submit}>
        <div className="space-y-4 lg:grid lg:grid-cols-[1fr_300px] lg:gap-6 lg:items-start lg:space-y-0">

          {/* ── Linke Spalte: Inhalt ── */}
          <div className="space-y-4">

            {/* Basisdaten */}
            <div className="bg-white shadow rounded-lg p-5 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Titel *</label>
                <input value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Beschreibung</label>
                <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3}
                  className="w-full border rounded px-3 py-2 text-sm resize-none" />
              </div>
            </div>

            {/* Kandidaten */}
            <div className="bg-white shadow rounded-lg p-5 sm:p-6 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">Kandidaten</span>
                  <span className="ml-2 text-xs text-gray-400">(optional – ohne = einfache Wertung)</span>
                </div>
                <button type="button" onClick={addCandidate}
                  className="text-xs text-indigo-600 hover:underline">+ Hinzufügen</button>
              </div>
              {candidates.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Keine Kandidaten – die Jury bewertet allgemein.</p>
              ) : (
                <div className="space-y-2">
                  {candidates.map((cand, i) => (
                    <div key={i} className="border rounded p-3 space-y-2 bg-blue-50">
                      <div className="flex gap-2">
                        <input placeholder="Name des Kandidaten *" value={cand.name}
                          onChange={e => updateCandidate(i, 'name', e.target.value)}
                          className="flex-1 border rounded px-3 py-1.5 text-sm" required />
                        <button type="button" onClick={() => removeCandidate(i)}
                          className="text-red-500 hover:text-red-700 text-sm px-2">✕</button>
                      </div>
                      <input placeholder="Beschreibung (optional)" value={cand.description}
                        onChange={e => updateCandidate(i, 'description', e.target.value)}
                        className="w-full border rounded px-3 py-1.5 text-sm" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Kategorien */}
            <div className="bg-white shadow rounded-lg p-5 sm:p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Kategorien *</span>
                <button type="button" onClick={addCategory}
                  className="text-xs text-indigo-600 hover:underline">+ Hinzufügen</button>
              </div>
              <div className="space-y-3">
                {categories.map((cat, i) => (
                  <div key={i} className="border rounded p-3 space-y-2 bg-gray-50">
                    <div className="flex gap-2">
                      <input placeholder="Kategoriename *" value={cat.name}
                        onChange={e => updateCategory(i, 'name', e.target.value)}
                        className="flex-1 border rounded px-3 py-1.5 text-sm" required />
                      <input type="number" placeholder="Max" min={1} value={cat.max_score}
                        onChange={e => updateCategory(i, 'max_score', parseInt(e.target.value))}
                        className="w-20 border rounded px-3 py-1.5 text-sm" required />
                      {categories.length > 1 && (
                        <button type="button" onClick={() => removeCategory(i)}
                          className="text-red-500 hover:text-red-700 text-sm px-2">✕</button>
                      )}
                    </div>
                    <input placeholder="Beschreibung (optional)" value={cat.description}
                      onChange={e => updateCategory(i, 'description', e.target.value)}
                      className="w-full border rounded px-3 py-1.5 text-sm" />
                  </div>
                ))}
              </div>
            </div>

          </div>{/* end left column */}

          {/* ── Rechte Sidebar: Einstellungen + Aktionen ── */}
          <div className="space-y-4 lg:sticky lg:top-20">

            {/* Zeitslots */}
            <div className="bg-white shadow rounded-lg p-5 space-y-3">
              <h2 className="text-sm font-semibold text-gray-700">Zeitraum</h2>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Einreichung ab *</label>
                <input type="datetime-local" value={openAt} onChange={e => setOpenAt(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Einreichung bis *</label>
                <input type="datetime-local" value={closeAt} onChange={e => setCloseAt(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Ergebnisse ab *</label>
                <input type="datetime-local" value={pubAt} onChange={e => setPubAt(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm" required />
              </div>
            </div>

            {/* Publikumswertung */}
            <div className="bg-white shadow rounded-lg p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-gray-700">Publikumswertung</div>
                  <p className="text-xs text-gray-500">Publikum kann per QR-Code einmalig abstimmen.</p>
                </div>
                <label className="inline-flex items-center gap-2 text-sm shrink-0">
                  <input
                    type="checkbox"
                    checked={audienceEnabled}
                    onChange={e => setAudienceEnabled(e.target.checked)}
                    className="h-4 w-4 rounded text-indigo-600"
                  />
                  Aktiv
                </label>
              </div>

              {audienceEnabled && candidates.length === 0 && (
                <div className="flex items-center gap-3">
                  <label className="text-xs text-gray-600">Max. Punkte</label>
                  <input
                    type="number"
                    min={1}
                    value={audienceMaxScore}
                    onChange={e => {
                      const val = parseInt(e.target.value)
                      setAudienceMaxScore(Number.isFinite(val) ? val : 1)
                    }}
                    className="w-20 border rounded px-2 py-1 text-sm"
                  />
                </div>
              )}

              {audienceEnabled && candidates.length > 0 && (
                <p className="text-xs text-gray-500">
                  Im Kandidaten-Modus wählt das Publikum einen Kandidaten.
                  Stimmenanteil wird linear auf Jury-Punkte skaliert.
                </p>
              )}

              {/* Link + Teilnehmer — nur im Edit-Modus wenn Audience aktiv */}
              {isEdit && audienceEnabled && audienceUrl ? (
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-xs text-gray-500">Teilnehmer</span>
                    <span className="font-semibold text-indigo-700">
                      {participantCount ?? '–'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      value={audienceUrl}
                      readOnly
                      aria-label="Publikums-Link"
                      onClick={e => (e.target as HTMLInputElement).select()}
                      className="flex-1 min-w-0 border rounded px-2 py-1 text-xs bg-white"
                    />
                    <button
                      type="button"
                      onClick={copyAudienceUrl}
                      className="shrink-0 text-xs bg-indigo-700 hover:bg-indigo-800 text-white px-2.5 py-1.5 rounded transition-colors"
                    >
                      {copied ? '✓' : 'Kopieren'}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleShare}
                      className="flex-1 text-xs border border-indigo-300 text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded transition-colors"
                    >
                      Teilen
                    </button>
                    <button
                      type="button"
                      onClick={manualRefresh}
                      aria-label={isVotingActive
                        ? `Aktualisieren – nächste Aktualisierung in ${countdown} Sekunden`
                        : 'Teilnehmeranzahl aktualisieren'}
                      className="flex-1 text-xs border rounded px-3 py-1.5 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                    >
                      <span aria-hidden="true">↻</span>
                      <span aria-hidden="true">{isVotingActive ? `${countdown}s` : 'Aktualisieren'}</span>
                    </button>
                  </div>
                  {isVotingActive && (
                    <p className="text-xs text-gray-400 text-center">
                      Automatische Aktualisierung alle 60 s
                    </p>
                  )}
                </div>
              ) : audienceEnabled && !isEdit ? (
                <p className="text-xs text-gray-500">
                  QR-Code und Link findest du nach dem Speichern auf der Seite <em>Jury &amp; Status</em>.
                </p>
              ) : null}
            </div>

            {/* Aktionen */}
            <div className="flex flex-col gap-2">
              <button type="submit" disabled={submitting}
                className="w-full bg-indigo-700 hover:bg-indigo-800 text-white px-6 py-2.5 rounded text-sm font-medium disabled:opacity-50 transition-colors">
                {submitting ? 'Speichern…' : isEdit ? 'Aktualisieren' : 'Erstellen & Jury zuweisen'}
              </button>
              <button type="button" onClick={() => nav('/admin/evaluations')}
                className="w-full border rounded px-4 py-2 text-sm hover:bg-gray-50 transition-colors">
                Abbrechen
              </button>
            </div>

          </div>{/* end sidebar */}

        </div>{/* end grid */}
      </form>
    </div>
  )
}
