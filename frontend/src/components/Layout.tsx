import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const nav = useNavigate()

  const handleLogout = async () => {
    await logout()
    nav('/login')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-indigo-700 text-white shadow">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold tracking-tight">Jury System</Link>
          <div className="flex items-center gap-4">
            {user && (
              <>
                <span className="text-sm opacity-75">{user.name} <span className="text-xs bg-indigo-900 px-1.5 py-0.5 rounded">{user.role}</span></span>
                {user.role === 'admin' && (
                  <>
                    <Link to="/admin/users"       className="text-sm hover:underline">Benutzer</Link>
                    <Link to="/admin/evaluations" className="text-sm hover:underline">Wertungen</Link>
                  </>
                )}
              </>
            )}
            <Link to="/hilfe" className="text-sm hover:underline opacity-80">Hilfe</Link>
            {user && (
              <button onClick={handleLogout} className="text-sm bg-indigo-800 hover:bg-indigo-900 px-3 py-1 rounded">
                Abmelden
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        {children}
      </main>
      <footer className="text-center text-xs text-gray-400 py-4">Jury System</footer>
    </div>
  )
}
