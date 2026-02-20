import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminEvals, adminUsers, Evaluation, User, JurySubmissionStatus, ApiError } from '../../api/client'
import Alert from '../../components/Alert'
import Spinner from '../../components/Spinner'

function fmtDate(ts: number) {
  return new Date(ts * 1000).toLocaleString('de-AT')
}

export default function AdminAssignmentsPage() {
  const { id } = useParams<{ id: string }>()
  const nav     = useNavigate()

  const [ev, setEv]                 = useState<Evaluation | null>(null)
  const [users, setUsers]           = useState<User[]>([])
  const [statuses, setStatuses]     = useState<Record<string, JurySubmissionStatus>>({})
  const [selected, setSelected]     = useState<Set<string>>(new Set())
  const [hasCandidates, setHasCandidates] = useState(false)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState('')
  const [saving, setSaving]         = useState(false)
  // Track which unchecked members have existing submissions (for warning)
  const [pendingRemove, setPendingRemove] = useState<Set<string>>(new Set())

  const loadAll = async () => {
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
      // Reset stale status state when all assignments are removed
      setStatuses({})
      setHasCandidates(false)
    }
  }

  useEffect(() => {
    loadAll()
      .catch(() => setError('Fehler beim Laden.'))
      .finally(() => setLoading(false))
  }, [id])

  const toggle = (uid: string) => {
    setSelected(s => {
      const next = new Set(s)
      if (next.has(uid)) {
        next.delete(uid)
        // Flag for warning if this member has a submission
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
    // Warn if removing members with submissions
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
      // Reload statuses
      await loadAll()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Fehler beim Speichern.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />

  const assignedCount  = selected.size
  const submittedCount = hasCandidates
    ? [...selected].filter(uid => (statuses[uid]?.submission_count ?? 0) > 0).length
    : [...selected].filter(uid => statuses[uid]?.has_submission).length

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => nav('/admin/evaluations')} className="text-gray-400 hover:text-gray-600 text-xl">←</button>
        <div>
          <h1 className="text-2xl font-bold">Jury & Status</h1>
          <p className="text-sm text-gray-500">{ev?.title}</p>
        </div>
      </div>

      {error   && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      {/* Zusammenfassung */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white shadow rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-indigo-700">{assignedCount}</div>
          <div className="text-sm text-gray-500 mt-1">Zugewiesen</div>
        </div>
        <div className="bg-white shadow rounded-lg p-4 text-center">
          <div className={`text-3xl font-bold ${submittedCount === assignedCount && assignedCount > 0 ? 'text-green-600' : 'text-amber-600'}`}>
            {submittedCount} / {assignedCount}
          </div>
          <div className="text-sm text-gray-500 mt-1">Wertung abgegeben</div>
        </div>
      </div>

      {/* Jury-Mitglieder */}
      <div className="bg-white shadow rounded-lg divide-y">
        <div className="px-5 py-3 bg-gray-50 rounded-t-lg flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Jury-Mitglied</span>
          <span className="text-sm font-medium text-gray-600">Status</span>
        </div>

        {users.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-8">
            Keine Jury-Mitglieder vorhanden. Bitte zuerst unter <em>Benutzer</em> anlegen.
          </p>
        )}

        {users.map(u => {
          const isSelected  = selected.has(u.id)
          const status      = statuses[u.id]
          const hasSubmission = status?.has_submission ?? false
          const willDelete  = pendingRemove.has(u.id)

          return (
            <label key={u.id}
              className={`flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${willDelete ? 'bg-red-50' : ''}`}>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(u.id)}
                  className="h-4 w-4 rounded text-indigo-600"
                />
                <div>
                  <div className="font-medium text-sm">{u.name}</div>
                  <div className="text-xs text-gray-400">@{u.username}</div>
                </div>
                {willDelete && (
                  <span className="text-xs text-red-600 font-medium">⚠ Wertung wird gelöscht</span>
                )}
              </div>

              <div className="text-right">
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
                          <div key={cs.candidate_id} className="text-xs text-gray-400 flex items-center gap-1">
                            <span className={cs.has_submission ? 'text-green-500' : 'text-gray-300'}>
                              {cs.has_submission ? '✓' : '○'}
                            </span>
                            <span className="truncate max-w-[120px]">{cs.candidate_name}</span>
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
        className="w-full bg-indigo-700 hover:bg-indigo-800 text-white py-2 rounded font-medium disabled:opacity-50"
      >
        {saving ? 'Speichern…' : 'Zuweisung speichern'}
      </button>
    </div>
  )
}
