import { useEffect, useState } from 'react'
import { adminUsers, User } from '../../api/client'
import Alert from '../../components/Alert'
import Spinner from '../../components/Spinner'
import { getErrorMessage } from '../../utils/errors'

const emptyForm = { username: '', password: '', name: '', role: 'jury' }

export default function AdminUsersPage() {
  const [users, setUsers]     = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm]       = useState(emptyForm)
  const [editId, setEditId]   = useState<string | null>(null)
  const [submitting, setSub]  = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await adminUsers.list()
      setUsers(r.users)
    } catch {
      setError('Fehler beim Laden der Benutzer.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const startEdit = (u: User) => {
    setEditId(u.id)
    setForm({ username: u.username, password: '', name: u.name, role: u.role })
    setError(''); setSuccess('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => { setEditId(null); setForm(emptyForm); setError(''); setSuccess('') }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSub(true); setError(''); setSuccess('')
    try {
      if (editId) {
        const changes: Record<string, string> = { name: form.name, role: form.role }
        if (form.password) changes.password = form.password
        await adminUsers.update(editId, changes)
        setSuccess('Benutzer aktualisiert.')
      } else {
        await adminUsers.create({ username: form.username, password: form.password, name: form.name, role: form.role })
        setSuccess('Benutzer erstellt.')
      }
      setEditId(null); setForm(emptyForm)
      await load()
    } catch (e) {
      setError(getErrorMessage(e, 'Fehler beim Speichern.'))
    } finally {
      setSub(false)
    }
  }

  const deleteUser = async (id: string, name: string) => {
    if (!confirm(`Benutzer "${name}" wirklich löschen?`)) return
    try {
      await adminUsers.delete(id)
      setSuccess('Benutzer gelöscht.')
      await load()
    } catch (e) {
      setError(getErrorMessage(e, 'Fehler beim Löschen.'))
    }
  }

  const juryCount = users.filter(u => u.role === 'jury').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Benutzer verwalten</h1>
        {juryCount === 0 && !loading && (
          <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-medium">
            Noch keine Jury-Mitglieder
          </span>
        )}
      </div>

      {error   && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <div className="lg:grid lg:grid-cols-[340px_1fr] lg:gap-6 lg:items-start">

      {/* Formular – sticky sidebar on desktop */}
      <div className="lg:sticky lg:top-20 mb-6 lg:mb-0">
      <div className="bg-white shadow rounded-lg p-5">
        <h2 className="text-lg font-semibold mb-4">
          {editId ? 'Benutzer bearbeiten' : 'Neuer Benutzer'}
        </h2>
        <form onSubmit={submit} className="space-y-3">
          {!editId && (
            <div>
              <label className="block text-sm font-medium mb-1">Benutzername</label>
              <input
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                className="w-full border rounded px-3 py-2 text-sm"
                required
                autoComplete="off"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full border rounded px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Passwort {editId && <span className="font-normal text-gray-400">(leer = unverändert)</span>}
            </label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full border rounded px-3 py-2 text-sm"
              required={!editId}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Rolle</label>
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full border rounded px-3 py-2 text-sm bg-white"
            >
              <option value="jury">Jury</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-2 flex-wrap pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="bg-indigo-700 hover:bg-indigo-800 text-white px-5 py-2 rounded text-sm disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Speichern…' : editId ? 'Aktualisieren' : 'Erstellen'}
            </button>
            {editId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="border rounded px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Workflow-Hinweis wenn noch keine Jury-Mitglieder */}
      {!loading && juryCount === 0 && users.length > 0 && (
        <div className="mt-4">
        <Alert type="info">
          Erstellen Sie zunächst Jury-Mitglieder (Rolle: Jury), um diese später Wertungen zuweisen zu können.
        </Alert>
        </div>
      )}
      </div>

      {/* Tabelle */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Name', 'Benutzername', 'Rolle', 'Aktionen'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium whitespace-nowrap">{u.name}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">@{u.username}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap
                        ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {u.role === 'admin' ? 'Admin' : 'Jury'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <button
                          onClick={() => startEdit(u)}
                          className="text-indigo-600 hover:underline text-xs whitespace-nowrap"
                        >
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => deleteUser(u.id, u.name)}
                          className="text-red-600 hover:underline text-xs whitespace-nowrap"
                        >
                          Löschen
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-gray-400 py-8">
                      Noch keine Benutzer vorhanden. Erstellen Sie den ersten Benutzer oben.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      </div>{/* end grid */}
    </div>
  )
}
