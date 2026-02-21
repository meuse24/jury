import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Spinner from '../components/Spinner'

export default function HomePage() {
  const { user, loading } = useAuth()
  const nav = useNavigate()

  useEffect(() => {
    if (loading) return
    if (!user) { nav('/login', { replace: true }); return }
    if (user.role === 'admin') { nav('/admin/evaluations', { replace: true }); return }
    nav('/jury', { replace: true })
  }, [user, loading, nav])

  return <Spinner />
}
