import { useEffect, useState } from 'react'
import { adminUsers, User, ApiError } from '../../api/client'
import Alert from '../../components/Alert'
import Spinner from '../../components/Spinner'

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
    } catch (e) {
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
      setError(e instanceof ApiError ? e.message : 'Fehler beim Speichern.')
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
      setError(e instanceof ApiError ? e.message : 'Fehler beim Löschen.')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Benutzer verwalten</h1>

      {error   && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">{editId ? 'Benutzer bearbeiten' : 'Neuer Benutzer'}</h2>
        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {!editId && (
            <div>
              <label className="block text-sm font-medium mb-1">Benutzername</label>
              <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                className="w-full border rounded px-3 py-2 text-sm" required />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full border rounded px-3 py-2 text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Passwort {editId && '(leer = unverändert)'}</label>
            <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full border rounded px-3 py-2 text-sm" required={!editId} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Rolle</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full border rounded px-3 py-2 text-sm">
              <option value="jury">Jury</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="sm:col-span-2 flex gap-2">
            <button type="submit" disabled={submitting}
              className="bg-indigo-700 hover:bg-indigo-800 text-white px-4 py-2 rounded text-sm disabled:opacity-50">
              {submitting ? 'Speichern…' : editId ? 'Aktualisieren' : 'Erstellen'}
            </button>
            {editId && (
              <button type="button" onClick={cancelEdit}
                className="border rounded px-4 py-2 text-sm hover:bg-gray-50">
                Abbrechen
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? <Spinner /> : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Name', 'Benutzername', 'Rolle', 'Aktionen'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-gray-600">{u.username}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => startEdit(u)}
                      className="text-indigo-600 hover:underline text-xs">Bearbeiten</button>
                    <button onClick={() => deleteUser(u.id, u.name)}
                      className="text-red-600 hover:underline text-xs">Löschen</button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={4} className="text-center text-gray-400 py-8">Keine Benutzer vorhanden.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
