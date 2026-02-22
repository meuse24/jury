import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { adminEvals, adminUsers, Evaluation, User, JurySubmissionStatus } from '../../api/client'
import Alert from '../../components/Alert'
import Spinner from '../../components/Spinner'
import { fmtDate } from '../../utils/formatting'
import { getErrorMessage } from '../../utils/errors'
import * as QRCode from 'qrcode'

export default function AdminAssignmentsPage() {
  const { id } = useParams<{ id: string }>()
  const nav     = useNavigate()

  const [ev, setEv]                       = useState<Evaluation | null>(null)
  const [users, setUsers]                 = useState<User[]>([])
  const [statuses, setStatuses]           = useState<Record<string, JurySubmissionStatus>>({})
  const [selected, setSelected]           = useState<Set<string>>(new Set())
  const [hasCandidates, setHasCandidates] = useState(false)
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState('')
  const [success, setSuccess]             = useState('')
  const [saving, setSaving]               = useState(false)
  const [publishing, setPublishing]       = useState(false)
  const [pendingRemove, setPendingRemove] = useState<Set<string>>(new Set())
  const [origin, setOrigin]               = useState('')
  const [qrDataUrl, setQrDataUrl]         = useState('')
  const [copied, setCopied]               = useState(false)
  const [shareUserId, setShareUserId]     = useState<string | null>(null)
  const [sharePassword, setSharePassword] = useState('')
  const [shareCopied, setShareCopied]     = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  const loadAll = useCallback(async () => {
    const [er, ur] = await Promise.all([adminEvals.get(id!), adminUsers.list()])
    const juryUsers = ur.users.filter(u => u.role === 'jury')
    setEv(er.evaluation)
    setUsers(juryUsers)
    setSelected(new Set(er.evaluation.jury_assignments))

    if (er.evaluation.jury_assignments.length > 0) {
      const sr = await adminEvals.getSubmissions(id!)
      const map: Record<string, JurySubmissionStatus> = {}
      sr.submissions.forEach(s => { map[s.user_id] = s })
      setStatuses(map)
      setHasCandidates(sr.has_candidates)
    } else {
      setStatuses({})
      setHasCandidates(false)
    }
  }, [id])

  useEffect(() => {
    loadAll()
      .catch(() => setError('Fehler beim Laden.'))
      .finally(() => setLoading(false))
  }, [loadAll])

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const toggle = (uid: string) => {
    setSelected(s => {
      const next = new Set(s)
      if (next.has(uid)) {
        next.delete(uid)
        if (statuses[uid]?.has_submission) {
          setPendingRemove(p => new Set([...p, uid]))
        }
      } else {
        next.add(uid)
        setPendingRemove(p => { const n = new Set(p); n.delete(uid); return n })
      }
      return next
    })
  }

  const save = async () => {
    if (pendingRemove.size > 0) {
      const names = [...pendingRemove]
        .map(uid => statuses[uid]?.name ?? uid)
        .join(', ')
      const confirmed = window.confirm(
        `Achtung: Die folgenden Jury-Mitglieder werden entfernt und ihre abgegebene Wertung wird unwiderruflich gelöscht:\n\n${names}\n\nFortfahren?`
      )
      if (!confirmed) return
    }

    setSaving(true); setError(''); setSuccess('')
    try {
      const r = await adminEvals.setAssignments(id!, [...selected])
      setSuccess(
        r.deleted_submissions_for.length > 0
          ? `Zuweisung gespeichert. ${r.deleted_submissions_for.length} Wertung(en) gelöscht.`
          : 'Zuweisung gespeichert.'
      )
      setPendingRemove(new Set())
      await loadAll()
    } catch (e) {
      setError(getErrorMessage(e, 'Fehler beim Speichern.'))
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async (force = false) => {
    if (assignedCount > 0 && !force && !allSubmitted) {
      const missing = pendingMembers.map(uid => statuses[uid]?.name ?? uid).join(', ')
      const confirmed = window.confirm(
        `Achtung: Folgende Jury-Mitglieder haben noch keine vollständige Wertung abgegeben:\n\n${missing}\n\nDie Ergebnisse trotzdem jetzt freigeben?`
      )
      if (!confirmed) return
    }
    setPublishing(true); setError(''); setSuccess('')
    try {
      await adminEvals.publish(id!)
      setSuccess('Ergebnisse wurden freigegeben.')
      await loadAll()
    } catch (e) {
      setError(getErrorMessage(e, 'Fehler beim Freigeben.'))
    } finally {
      setPublishing(false)
    }
  }

  const handleUnpublish = async () => {
    setPublishing(true); setError(''); setSuccess('')
    try {
      await adminEvals.unpublish(id!)
      setSuccess('Freigabe wurde zurückgezogen.')
      await loadAll()
    } catch (e) {
      setError(getErrorMessage(e, 'Fehler.'))
    } finally {
      setPublishing(false)
    }
  }

  const assignedCount  = selected.size
  const submittedCount = hasCandidates
    ? [...selected].filter(uid => {
        const s = statuses[uid]
        return s && s.submission_count === s.candidate_count && (s.candidate_count ?? 0) > 0
      }).length
    : [...selected].filter(uid => statuses[uid]?.has_submission).length

  const allSubmitted   = assignedCount > 0 && submittedCount === assignedCount
  const isPublished    = ev?.results_is_published ?? false
  const audienceEnabled = ev?.audience_enabled ?? false
  const nowTs = Math.floor(Date.now() / 1000)
  const slotOpenAt = ev?.submission_open_at ?? null
  const slotCloseAt = ev?.submission_close_at ?? null
  const slotStatus = !slotOpenAt || !slotCloseAt
    ? 'unknown'
    : nowTs < slotOpenAt
      ? 'upcoming'
      : nowTs > slotCloseAt
        ? 'closed'
        : 'open'
  const basePath = import.meta.env.VITE_BASE_PATH || '/jurysystem'
  const audienceUrl = origin ? `${origin}${basePath}/audience/${id}` : ''

  useEffect(() => {
    let cancelled = false
    if (!audienceEnabled || !audienceUrl) {
      setQrDataUrl('')
      return
    }
    QRCode.toDataURL(audienceUrl, { width: 180, margin: 1 })
      .then((url: string) => { if (!cancelled) setQrDataUrl(url) })
      .catch(() => { if (!cancelled) setQrDataUrl('') })
    return () => { cancelled = true }
  }, [audienceEnabled, audienceUrl])

  const copyAudienceUrl = async () => {
    if (!audienceUrl) return
    try {
      await navigator.clipboard.writeText(audienceUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  // Esc key + focus trap for share modal
  useEffect(() => {
    if (!shareUserId) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setShareUserId(null); return }
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, input, [href], select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const first = focusable[0]
        const last  = focusable[focusable.length - 1]
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus() }
        } else {
          if (document.activeElement === last)  { e.preventDefault(); first.focus() }
        }
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [shareUserId])

  const loginUrl = origin ? `${origin}${basePath}/login` : ''

  const buildShareText = (user: User) => {
    const lines = [
      `Jury-Zugang: ${ev?.title ?? ''}`,
      '',
      `Name: ${user.name}`,
      `Link: ${loginUrl}`,
      `Benutzer: ${user.username}`,
    ]
    if (sharePassword) lines.push(`Passwort: ${sharePassword}`)
    if (slotOpenAt && slotCloseAt) {
      lines.push('', `Zeitraum: ${fmtDate(slotOpenAt)} – ${fmtDate(slotCloseAt)}`)
    }
    return lines.join('\n')
  }

  const handleShare = async (user: User) => {
    const text = buildShareText(user)
    if (navigator.share) {
      try {
        await navigator.share({ text })
      } catch {
        // user cancelled share dialog
      }
    } else {
      try {
        await navigator.clipboard.writeText(text)
        setShareCopied(true)
        setTimeout(() => setShareCopied(false), 1500)
      } catch {
        // clipboard not available
      }
    }
  }

  const handleCopyShare = async (user: User) => {
    const text = buildShareText(user)
    try {
      await navigator.clipboard.writeText(text)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 1500)
    } catch {
      // clipboard not available
    }
  }

  // Members with missing or incomplete submissions
  const pendingMembers = [...selected].filter(uid => {
    if (hasCandidates) {
      const s = statuses[uid]
      return !s || (s.submission_count ?? 0) < (s.candidate_count ?? 1)
    }
    return !statuses[uid]?.has_submission
  })

  if (loading) return <Spinner />

  return (
    <div className="space-y-6">

      {/* Breadcrumb / Back */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => nav('/admin/evaluations')}
          className="text-gray-400 hover:text-gray-600 text-xl transition-colors"
          aria-label="Zurück"
        >
          ←
        </button>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Jury &amp; Status</h1>
          <p className="text-sm text-gray-500 truncate">{ev?.title}</p>
        </div>
      </div>

      {error   && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      {/* 2-column layout: sidebar (stats/timeslot/audience) + main (jury/publish) */}
      <div className="space-y-4 lg:grid lg:grid-cols-[1fr_320px] lg:gap-6 lg:items-start lg:space-y-0">

        {/* ── Main column (left on desktop) ── */}
        <div className="space-y-4 order-2 lg:order-1">

      {/* Jury-Mitglieder */}
      <div className="bg-white shadow rounded-lg divide-y">
        <div className="px-5 py-3 bg-gray-50 rounded-t-lg flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Jury-Mitglied</span>
          <span className="text-sm font-medium text-gray-600">Status</span>
        </div>

        {users.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-8 px-4">
            Keine Jury-Mitglieder vorhanden. Bitte zuerst unter <em>Benutzer</em> anlegen.
          </p>
        )}

        {users.map(u => {
          const isSelected    = selected.has(u.id)
          const status        = statuses[u.id]
          const hasSubmission = status?.has_submission ?? false
          const willDelete    = pendingRemove.has(u.id)

          return (
            <label
              key={u.id}
              className={`flex items-start justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors gap-3
                ${willDelete ? 'bg-red-50' : ''}`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(u.id)}
                  className="h-4 w-4 rounded text-indigo-600 mt-0.5 shrink-0"
                />
                <div>
                  <div className="font-medium text-sm flex items-center gap-1.5">
                    {u.name}
                    {isSelected && (
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShareUserId(u.id); setSharePassword(''); setShareCopied(false) }}
                        title="Zugangsdaten teilen"
                        className="text-gray-400 hover:text-indigo-600 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path d="M13 4.5a2.5 2.5 0 1 1 .702 1.737L6.97 9.604a2.5 2.5 0 0 1 0 .792l6.733 3.367a2.5 2.5 0 1 1-.671 1.341l-6.733-3.367a2.5 2.5 0 1 1 0-3.474l6.733-3.367A2.5 2.5 0 0 1 13 4.5Z" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">@{u.username}</div>
                  {willDelete && (
                    <span className="text-xs text-red-600 font-medium mt-1 block">⚠ Wertung wird gelöscht</span>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                {isSelected ? (
                  hasCandidates && status?.candidates ? (
                    <div>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                        status.submission_count === status.candidate_count
                          ? 'bg-green-100 text-green-700'
                          : status.submission_count! > 0
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-500'
                      }`}>
                        {status.submission_count}/{status.candidate_count} Kandidaten
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {status.candidates.map(cs => (
                          <div key={cs.candidate_id} className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                            <span className="truncate max-w-[140px]">{cs.candidate_name}</span>
                            <span className={cs.has_submission ? 'text-green-500' : 'text-amber-400'}>
                              {cs.has_submission ? '✓' : '○'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : hasSubmission ? (
                    <div>
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                        ✓ Abgegeben
                      </span>
                      {status?.updated_at && (
                        <div className="text-xs text-gray-400 mt-0.5">{fmtDate(status.updated_at)}</div>
                      )}
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                      ○ Ausstehend
                    </span>
                  )
                ) : (
                  <span className="text-xs text-gray-400">— nicht zugewiesen</span>
                )}
              </div>
            </label>
          )
        })}
      </div>

      {pendingRemove.size > 0 && (
        <Alert type="error">
          <strong>Achtung:</strong> {pendingRemove.size} Jury-Mitglied{pendingRemove.size > 1 ? 'er werden' : ' wird'} entfernt.
          {' '}Deren abgegebene Wertung{pendingRemove.size > 1 ? 'en werden' : ' wird'} beim Speichern <strong>unwiderruflich gelöscht</strong>.
        </Alert>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="w-full bg-indigo-700 hover:bg-indigo-800 text-white py-2.5 rounded font-medium disabled:opacity-50 transition-colors"
      >
        {saving ? 'Speichern…' : 'Zuweisung speichern'}
      </button>

      {/* ── Ergebnisse freigeben ─────────────────────────────── */}
      {(assignedCount > 0 || audienceEnabled) && (
        <div className={`rounded-xl border-2 p-5 space-y-4 ${
          isPublished
            ? 'border-green-300 bg-green-50'
            : allSubmitted
              ? 'border-green-200 bg-green-50'
              : 'border-amber-200 bg-amber-50'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{isPublished ? '✅' : allSubmitted ? '🟢' : '⚠️'}</span>
            <h2 className="font-semibold text-gray-800">Ergebnisse freigeben</h2>
          </div>

          {isPublished ? (
            <>
              <p className="text-sm text-green-800">
                Die Ergebnisse sind aktuell <strong>öffentlich zugänglich</strong>.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to={`/results/${id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded font-medium transition-colors"
                >
                  Ergebnisse ansehen ↗
                </Link>
                <button
                  onClick={handleUnpublish}
                  disabled={publishing}
                  className="text-sm border border-red-300 text-red-600 hover:bg-red-50 px-4 py-2 rounded font-medium disabled:opacity-50 transition-colors"
                >
                  {publishing ? 'Bitte warten…' : 'Freigabe zurückziehen'}
                </button>
              </div>
            </>
          ) : allSubmitted ? (
            <>
              <p className="text-sm text-green-800">
                Alle {assignedCount} Jury-Mitglieder haben ihre Wertung abgegeben.
                Die Ergebnisse können jetzt veröffentlicht werden.
              </p>
              <button
                onClick={() => handlePublish(true)}
                disabled={publishing}
                className="w-full sm:w-auto text-sm bg-green-700 hover:bg-green-800 text-white px-6 py-2.5 rounded font-semibold disabled:opacity-50 transition-colors"
              >
                {publishing ? 'Freigeben…' : '✓ Ergebnisse jetzt freigeben'}
              </button>
            </>
          ) : (
            <>
              {assignedCount === 0 ? (
                <div className="text-sm text-amber-900">
                  Keine Jury-Mitglieder zugewiesen. Ergebnisse können trotzdem veröffentlicht werden
                  {audienceEnabled ? ' (Publikumswertung aktiv).' : '.'}
                </div>
              ) : (
                <div className="text-sm text-amber-900 space-y-1">
                  <p className="font-medium">
                    {pendingMembers.length} von {assignedCount} Jury-Mitglied{pendingMembers.length !== 1 ? 'ern' : ''} {pendingMembers.length !== 1 ? 'fehlen' : 'fehlt'} noch {hasCandidates ? 'Kandidaten-' : ''}Bewertungen:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-amber-800">
                    {pendingMembers.map(uid => {
                      const s = statuses[uid]
                      const name = s?.name ?? uid
                      if (hasCandidates && s?.candidates) {
                        const missing = s.candidates.filter(c => !c.has_submission).map(c => c.candidate_name)
                        return (
                          <li key={uid}>
                            {name}
                            {missing.length > 0 && (
                              <span className="text-amber-700"> – fehlt: {missing.join(', ')}</span>
                            )}
                          </li>
                        )
                      }
                      return <li key={uid}>{name}</li>
                    })}
                  </ul>
                </div>
              )}
              {/* Konsequenz + Lösungshinweise */}
              {assignedCount > 0 && (
                <div className="bg-white/70 border border-amber-200 rounded-lg px-3 py-2.5 space-y-2">
                  <p className="text-xs font-semibold text-amber-900">
                    Auswirkung auf das Ergebnis:
                  </p>
                  <p className="text-xs text-amber-800">
                    Die Durchschnittswerte werden nur aus <strong>{submittedCount}</strong> statt <strong>{assignedCount}</strong> Wertungen berechnet
                    — fehlende Abgaben verzerren das Ergebnis, da einzelne Jury-Mitglieder überproportional gewichtet werden.
                  </p>
                  <p className="text-xs font-semibold text-amber-900 pt-1">Mögliche Maßnahmen:</p>
                  <div className="text-xs text-amber-800 flex gap-1.5">
                    <span className="shrink-0 font-bold">1.</span>
                    <span>
                      Jury-Mitglieder ohne vollständige Abgabe oben <strong>abwählen</strong> und speichern —
                      ihre Wertung wird aus der Berechnung entfernt.
                    </span>
                  </div>
                  <div className="text-xs text-amber-800 flex gap-1.5">
                    <span className="shrink-0 font-bold">2.</span>
                    <span>
                      <Link
                        to={`/admin/evaluations/${id}/edit`}
                        className="font-semibold underline hover:text-amber-900 transition-colors"
                      >
                        Einreichfrist verlängern →
                      </Link>
                      {' '}damit ausstehende Mitglieder noch abgeben können.
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={() => handlePublish(false)}
                disabled={publishing}
                className="text-sm border border-amber-400 text-amber-800 hover:bg-amber-100 px-4 py-2 rounded font-medium disabled:opacity-50 transition-colors"
              >
                {publishing ? 'Freigeben…' : 'Trotzdem freigeben ⚠'}
              </button>
            </>
          )}
        </div>
      )}

        </div>{/* end main column */}

        {/* ── Sidebar (right on desktop, first on mobile via order) ── */}
        <div className="space-y-4 order-1 lg:order-2 lg:sticky lg:top-20">
          {/* Zusammenfassung */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white shadow rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-indigo-700">{assignedCount}</div>
              <div className="text-sm text-gray-500 mt-1">Zugewiesen</div>
            </div>
            <div className="bg-white shadow rounded-lg p-4 text-center">
              <div className={`text-3xl font-bold ${allSubmitted ? 'text-green-600' : 'text-amber-600'}`}>
                {submittedCount} / {assignedCount}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {hasCandidates ? 'Vollständig bewertet' : 'Abgegeben'}
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-4 space-y-2">
            <div className="text-sm font-medium text-gray-700">Abstimmungszeitslot</div>
            {slotOpenAt && slotCloseAt ? (
              <>
                <div className="text-sm text-gray-600">
                  {fmtDate(slotOpenAt)} – {fmtDate(slotCloseAt)}
                </div>
                {slotStatus === 'closed' ? (
                  <p className="text-sm font-medium text-amber-700">Abgelaufen</p>
                ) : slotStatus === 'upcoming' ? (
                  <p className="text-sm text-gray-500">Noch nicht begonnen</p>
                ) : (
                  <p className="text-sm text-green-700 font-medium">Aktuell geöffnet</p>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500">Kein Zeitslot verfügbar.</p>
            )}
          </div>

          {audienceEnabled && (
            <div className="bg-white shadow rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-medium">Publikumswertung</div>
                  <div className="text-xs text-gray-500">
                    {ev?.audience_participant_count !== undefined && (
                      <span>Teilnehmer: {ev.audience_participant_count}</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={copyAudienceUrl}
                  className="text-xs bg-indigo-700 text-white px-3 py-1.5 rounded shrink-0"
                >
                  {copied ? 'Kopiert' : 'Kopieren'}
                </button>
              </div>
              <input
                value={audienceUrl}
                readOnly
                aria-label="Publikums-Link"
                className="w-full border rounded px-2 py-1 text-xs bg-white"
              />
              <div className="flex justify-center">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR-Code Publikum"
                    className="border rounded bg-white p-2"
                  />
                ) : (
                  <div className="w-[180px] h-[180px] flex items-center justify-center text-xs text-gray-500 border rounded bg-white">
                    QR-Code wird erstellt…
                  </div>
                )}
              </div>
            </div>
          )}
        </div>{/* end sidebar */}

      </div>{/* end grid */}

      {/* ── Teilen-Modal ─────────────────────────────── */}
      {shareUserId && (() => {
        const shareUser = users.find(u => u.id === shareUserId)
        if (!shareUser) return null
        return (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShareUserId(null)}>
            <div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="share-modal-title"
              className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 id="share-modal-title" className="font-semibold text-gray-800">Zugangsdaten teilen</h3>
                <button
                  onClick={() => setShareUserId(null)}
                  className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                >
                  &times;
                </button>
              </div>

              <div className="text-sm text-gray-600 space-y-1">
                <div><span className="text-gray-400">Name:</span> {shareUser.name}</div>
                <div><span className="text-gray-400">Benutzer:</span> {shareUser.username}</div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Passwort (optional eingeben)
                </label>
                <input
                  type="text"
                  value={sharePassword}
                  onChange={e => setSharePassword(e.target.value)}
                  placeholder="Passwort eingeben…"
                  className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  autoFocus
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words font-sans">{buildShareText(shareUser)}</pre>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyShare(shareUser)}
                  className="flex-1 text-sm bg-indigo-700 hover:bg-indigo-800 text-white py-2 rounded font-medium transition-colors"
                >
                  {shareCopied ? 'Kopiert!' : 'Kopieren'}
                </button>
                {typeof navigator !== 'undefined' && !!navigator.share && (
                  <button
                    type="button"
                    onClick={() => handleShare(shareUser)}
                    className="flex-1 text-sm border border-indigo-300 text-indigo-700 hover:bg-indigo-50 py-2 rounded font-medium transition-colors"
                  >
                    Teilen…
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
