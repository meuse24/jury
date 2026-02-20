import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const nav      = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    try { await logout() } catch { /* ignore */ }
    nav('/login')
  }

  const close = () => setMenuOpen(false)

  // Active-state helper: exact match for '/', prefix match otherwise
  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  const linkCls = (path: string) =>
    `text-sm transition-colors hover:underline ${isActive(path) ? 'font-bold opacity-100' : 'opacity-80'}`

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="bg-indigo-700 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" className="text-xl font-bold tracking-tight shrink-0 flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">⚖</span>
            <span>Jury System</span>
          </Link>

          {/* ── Desktop Navigation (≥ sm) ── */}
          <nav className="hidden sm:flex items-center gap-3 flex-wrap">
            {user && (
              <>
                <span className="text-sm opacity-75 flex items-center gap-1.5">
                  {user.name}
                  <span className="text-xs bg-indigo-900 px-1.5 py-0.5 rounded font-medium">{user.role}</span>
                </span>
                <span className="opacity-30 select-none">|</span>
                {user.role === 'admin' && (
                  <>
                    <Link to="/admin/users"       className={linkCls('/admin/users')}>Benutzer</Link>
                    <Link to="/admin/evaluations" className={linkCls('/admin/evaluations')}>Wertungen</Link>
                  </>
                )}
                {user.role === 'jury' && (
                  <Link to="/jury" className={linkCls('/jury')}>Meine Wertungen</Link>
                )}
              </>
            )}
            <Link to="/hilfe" className={linkCls('/hilfe')}>Hilfe</Link>
            {user && (
              <>
                <span className="opacity-30 select-none">|</span>
                <button
                  onClick={handleLogout}
                  className="text-sm bg-indigo-800 hover:bg-indigo-900 px-3 py-1 rounded transition-colors"
                >
                  Abmelden
                </button>
              </>
            )}
          </nav>

          {/* ── Mobile Hamburger Button (< sm) ── */}
          <button
            className="sm:hidden p-2 rounded hover:bg-indigo-600 transition-colors"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Menü schließen' : 'Menü öffnen'}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-menu"
          >
            {menuOpen ? (
              /* ✕ close icon */
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              /* ☰ hamburger icon */
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* ── Mobile Dropdown (< sm) ── */}
        {menuOpen && (
          <div id="mobile-nav-menu" className="sm:hidden border-t border-indigo-600 bg-indigo-800">
            <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col gap-0.5">

              {user && (
                <div className="flex items-center gap-2 pb-3 mb-2 border-b border-indigo-600">
                  <span className="text-sm">{user.name}</span>
                  <span className="text-xs bg-indigo-900 px-1.5 py-0.5 rounded font-medium">{user.role}</span>
                </div>
              )}

              {user?.role === 'admin' && (
                <>
                  <Link
                    to="/admin/users"
                    onClick={close}
                    className={`text-sm px-2 py-2 rounded hover:bg-indigo-700 transition-colors ${isActive('/admin/users') ? 'font-bold bg-indigo-700' : ''}`}
                  >
                    Benutzer
                  </Link>
                  <Link
                    to="/admin/evaluations"
                    onClick={close}
                    className={`text-sm px-2 py-2 rounded hover:bg-indigo-700 transition-colors ${isActive('/admin/evaluations') ? 'font-bold bg-indigo-700' : ''}`}
                  >
                    Wertungen
                  </Link>
                </>
              )}

              {user?.role === 'jury' && (
                <Link
                  to="/jury"
                  onClick={close}
                  className={`text-sm px-2 py-2 rounded hover:bg-indigo-700 transition-colors ${isActive('/jury') ? 'font-bold bg-indigo-700' : ''}`}
                >
                  Meine Wertungen
                </Link>
              )}

              <Link
                to="/hilfe"
                onClick={close}
                className={`text-sm px-2 py-2 rounded hover:bg-indigo-700 transition-colors opacity-80 ${isActive('/hilfe') ? 'font-bold bg-indigo-700 opacity-100' : ''}`}
              >
                Hilfe
              </Link>

              {user && (
                <button
                  onClick={() => { close(); handleLogout() }}
                  className="text-sm text-left px-2 py-2 mt-2 text-indigo-300 hover:text-white transition-colors border-t border-indigo-600 pt-3"
                >
                  Abmelden
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ── Page Content ─────────────────────────────────────── */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="text-center text-xs text-gray-400 py-4 border-t border-gray-100 bg-white">
        Jury System &nbsp;·&nbsp; <Link to="/hilfe" className="hover:underline">Hilfe</Link>
      </footer>
    </div>
  )
}
