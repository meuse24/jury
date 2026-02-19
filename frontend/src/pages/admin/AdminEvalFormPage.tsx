import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { adminEvals, Category, EvalPayload, ApiError } from '../../api/client'
import Alert from '../../components/Alert'
import Spinner from '../../components/Spinner'

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

export default function AdminEvalFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit  = id !== undefined && id !== 'new'
  const nav     = useNavigate()

  const [loading, setLoading] = useState(isEdit)
  const [error, setError]     = useState('')
  const [title, setTitle]     = useState('')
  const [desc, setDesc]       = useState('')
  const [openAt, setOpenAt]   = useState('')
  const [closeAt, setCloseAt] = useState('')
  const [pubAt, setPubAt]     = useState('')
  const [categories, setCategories] = useState<(Omit<Category,'id'> & {id?:string})[]>([emptyCategory()])
  const [submitting, setSub]  = useState(false)

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
    }).catch(() => setError('Wertung nicht gefunden.'))
    .finally(() => setLoading(false))
  }, [id])

  const addCategory = () => setCategories(c => [...c, emptyCategory()])
  const removeCategory = (i: number) => setCategories(c => c.filter((_, j) => j !== i))
  const updateCategory = (i: number, field: string, value: string | number) =>
    setCategories(c => c.map((cat, j) => j === i ? { ...cat, [field]: value } : cat))

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
      }
      if (isEdit) {
        await adminEvals.update(id!, payload)
      } else {
        await adminEvals.create(payload)
      }
      nav('/admin/evaluations')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Fehler beim Speichern.')
    } finally {
      setSub(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">{isEdit ? 'Wertung bearbeiten' : 'Neue Wertung'}</h1>
      {error && <Alert type="error">{error}</Alert>}

      <form onSubmit={submit} className="bg-white shadow rounded-lg p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Titel *</label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Beschreibung</label>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3}
            className="w-full border rounded px-3 py-2 text-sm" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Einreichung ab *</label>
            <input type="datetime-local" value={openAt} onChange={e => setOpenAt(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Einreichung bis *</label>
            <input type="datetime-local" value={closeAt} onChange={e => setCloseAt(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ergebnisse ab *</label>
            <input type="datetime-local" value={pubAt} onChange={e => setPubAt(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm" required />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Kategorien *</label>
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

        <div className="flex gap-3">
          <button type="submit" disabled={submitting}
            className="bg-indigo-700 hover:bg-indigo-800 text-white px-6 py-2 rounded text-sm disabled:opacity-50">
            {submitting ? 'Speichern…' : isEdit ? 'Aktualisieren' : 'Erstellen'}
          </button>
          <button type="button" onClick={() => nav('/admin/evaluations')}
            className="border rounded px-4 py-2 text-sm hover:bg-gray-50">Abbrechen</button>
        </div>
      </form>
    </div>
  )
}
