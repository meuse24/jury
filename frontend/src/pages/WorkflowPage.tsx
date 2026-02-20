import { Link } from 'react-router-dom'
import { useRef, useState, useCallback } from 'react'

export default function WorkflowPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const origin = useRef({ x: 0, y: 0, sl: 0, st: 0 })

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const el = containerRef.current
    if (!el) return
    setDragging(true)
    origin.current = { x: e.clientX, y: e.clientY, sl: el.scrollLeft, st: el.scrollTop }
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return
    const el = containerRef.current
    if (!el) return
    e.preventDefault()
    el.scrollLeft = origin.current.sl - (e.clientX - origin.current.x)
    el.scrollTop  = origin.current.st - (e.clientY - origin.current.y)
  }, [dragging])

  const stopDrag = useCallback(() => setDragging(false), [])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/hilfe"
          className="text-gray-400 hover:text-gray-600 text-xl transition-colors"
          aria-label="Zurück zur Hilfe"
        >
          ←
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Workflow-Infografik</h1>
          <p className="text-sm text-gray-500">Schritt-für-Schritt-Übersicht für Admin und Jury</p>
        </div>
      </div>

      {/* Pan-Container */}
      <div
        ref={containerRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        className={`bg-white shadow rounded-xl overflow-auto border border-gray-100 select-none ${
          dragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{ maxHeight: '72vh' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}workflow.jpg`}
          alt="Workflow-Infografik: Schritt-für-Schritt-Übersicht für Admin und Jury"
          draggable={false}
          style={{ display: 'block', width: '65%', minWidth: '720px' }}
        />
      </div>

      <p className="text-xs text-gray-400 text-center">
        Klicken &amp; ziehen zum Verschieben &nbsp;·&nbsp; Touch-Geste zum Scrollen &nbsp;·&nbsp;{' '}
        <Link to="/hilfe" className="hover:underline">Zurück zur Hilfe</Link>
      </p>
    </div>
  )
}
