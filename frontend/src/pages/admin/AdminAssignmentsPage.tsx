import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminEvals, adminUsers, Evaluation, User, ApiError } from '../../api/client'
import Alert from '../../components/Alert'
import Spinner from '../../components/Spinner'

export default function AdminAssignmentsPage() {
  const { id } = useParams<{ id: string }>()
  const nav     = useNavigate()

  const [ev, setEv]           = useState<Evaluation | null>(null)
  const [users, setUsers]     = useState<User[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving]   = useState(false)

  useEffect(() => {
    Promise.all([adminEvals.get(id!), adminUsers.list()])
      .then(([er, ur]) => {
        setEv(er.evaluation)
        setUsers(ur.users.filter(u => u.role === 'jury'))
        setSelected(new Set(er.evaluation.jury_assignments))
      })
      .catch(() => setError('Fehler beim Laden.'))
      .finally(() => setLoading(false))
  }, [id])

  const toggle = (uid: string) => {
    setSelected(s => {
      const next = new Set(s)
      next.has(uid) ? next.delete(uid) : next.add(uid)
      return next
    })
  }

  const save = async () => {
    setSaving(true); setError(''); setSuccess('')
    try {
      await adminEvals.setAssignments(id!, [...selected])
      setSuccess('Zuweisung gespeichert.')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Fehler beim Speichern.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => nav('/admin/evaluations')} className="text-gray-400 hover:text-gray-600 text-xl">←</button>
        <h1 className="text-2xl font-bold">Jury-Zuweisung: {ev?.title}</h1>
      </div>

      {error   && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <div className="bg-white shadow rounded-lg p-6 space-y-3">
        <p className="text-sm text-gray-600 mb-4">Wähle die Jury-Mitglieder, die diese Wertung bewerten dürfen:</p>
        {users.length === 0 && <p className="text-gray-400 text-sm">Keine Jury-Mitglieder vorhanden. Bitte zuerst Benutzer anlegen.</p>}
        {users.map(u => (
          <label key={u.id} className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-50">
            <input type="checkbox"
              checked={selected.has(u.id)}
              onChange={() => toggle(u.id)}
              className="h-4 w-4 rounded text-indigo-600" />
            <span className="text-sm font-medium">{u.name}</span>
            <span className="text-xs text-gray-400">@{u.username}</span>
          </label>
        ))}
        <div className="pt-4">
          <button onClick={save} disabled={saving}
            className="bg-indigo-700 hover:bg-indigo-800 text-white px-6 py-2 rounded text-sm disabled:opacity-50">
            {saving ? 'Speichern…' : 'Zuweisung speichern'}
          </button>
        </div>
      </div>
    </div>
  )
}
