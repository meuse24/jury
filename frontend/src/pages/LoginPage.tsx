import { useState, FormEvent, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ApiError } from '../api/client'
import Alert from '../components/Alert'

export default function LoginPage() {
  const { login, user } = useAuth()
  const nav = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    if (user) {
      nav(user.role === 'admin' ? '/admin/evaluations' : '/jury', { replace: true })
    }
  }, [user, nav])

  if (user) return null

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      nav('/', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Anmeldung fehlgeschlagen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="bg-white shadow rounded-lg p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-6 text-indigo-700">Jury System</h1>
        <form onSubmit={submit} className="space-y-4">
          {error && <Alert type="error">{error}</Alert>}
          <div>
            <label className="block text-sm font-medium mb-1">Benutzername</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              autoFocus
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Passwort</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-700 hover:bg-indigo-800 text-white py-2 rounded font-medium disabled:opacity-50"
          >
            {loading ? 'Anmelden…' : 'Anmelden'}
          </button>
        </form>
      </div>
    </div>
  )
}
