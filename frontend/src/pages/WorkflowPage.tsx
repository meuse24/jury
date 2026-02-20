import { Link } from 'react-router-dom'
import { useRef, useState, useCallback, useEffect } from 'react'

const MIN_ZOOM    = 0.5
const MAX_ZOOM    = 4
const WHEEL_FACTOR = 1.12

export default function WorkflowPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const [zoom, setZoom]         = useState(1)
  // Ref mirrors state so callbacks never capture a stale zoom value
  const zoomRef    = useRef(1)
  const [baseWidth, setBaseWidth] = useState(720)
  const origin  = useRef({ x: 0, y: 0, sl: 0, st: 0 })
  const pinchRef = useRef<{ startDist: number; startZoom: number } | null>(null)

  const clamp = (v: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v))

  // Central zoom routine: receives a pure function (prev → next) + focal point
  const applyZoom = useCallback(
    (getNext: (prev: number) => number, clientX: number, clientY: number) => {
      const el = containerRef.current
      if (!el) return

      const rect     = el.getBoundingClientRect()
      const vpX      = clientX - rect.left
      const vpY      = clientY - rect.top
      const contentX = el.scrollLeft + vpX
      const contentY = el.scrollTop  + vpY

      const prev = zoomRef.current          // always fresh via ref
      const next = clamp(getNext(prev))
      if (next === prev) return

      const scale   = next / prev
      zoomRef.current = next
      setZoom(next)

      // Adjust scroll after React re-renders the wider/narrower image
      requestAnimationFrame(() => {
        const cur = containerRef.current
        if (!cur) return
        cur.scrollLeft = contentX * scale - vpX
        cur.scrollTop  = contentY * scale - vpY
      })
    },
    [] // clamp is pure; containerRef is a ref — no deps needed
  )

  // Responsive base width
  useEffect(() => {
    const el = containerRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const update = () => setBaseWidth(Math.max(el.clientWidth - 2, 720))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Non-passive native touchmove listener so preventDefault() is always honoured
  // during pinch, even when touch-action: pan-x pan-y is set on the container
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handler = (e: TouchEvent) => {
      if (e.touches.length === 2) e.preventDefault()
    }
    el.addEventListener('touchmove', handler, { passive: false })
    return () => el.removeEventListener('touchmove', handler)
  }, [])

  // ── Mouse drag ──────────────────────────────────────────────────────────────
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

  // ── Mouse-wheel zoom ────────────────────────────────────────────────────────
  const onWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault()
    const factor = e.deltaY < 0 ? WHEEL_FACTOR : 1 / WHEEL_FACTOR
    applyZoom(prev => prev * factor, e.clientX, e.clientY)
  }, [applyZoom])

  // ── Pinch zoom (touch) ──────────────────────────────────────────────────────
  const onTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 2) return
    const [a, b] = [e.touches[0], e.touches[1]]
    pinchRef.current = {
      startDist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
      startZoom: zoomRef.current,           // ref → always up-to-date
    }
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 2 || !pinchRef.current) return
    const [a, b]  = [e.touches[0], e.touches[1]]
    const dist     = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
    if (pinchRef.current.startDist <= 0) return
    const centerX  = (a.clientX + b.clientX) / 2
    const centerY  = (a.clientY + b.clientY) / 2
    const pinchScale = dist / pinchRef.current.startDist
    const { startZoom } = pinchRef.current
    applyZoom(() => startZoom * pinchScale, centerX, centerY)
  }, [applyZoom])

  const onTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length < 2) pinchRef.current = null
  }, [])

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

      {/* Pan/Zoom-Container */}
      <div
        ref={containerRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className={`bg-white shadow rounded-xl overflow-auto border border-gray-100 select-none ${
          dragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{ maxHeight: '72vh', touchAction: 'pan-x pan-y' }}
      >
        <img
          src={`${import.meta.env.BASE_URL}workflow.jpg`}
          alt="Workflow-Infografik: Schritt-für-Schritt-Übersicht für Admin und Jury"
          draggable={false}
          style={{ display: 'block', width: `${baseWidth * zoom}px`, maxWidth: 'none' }}
        />
      </div>

      <p className="text-xs text-gray-400 text-center">
        Klicken &amp; ziehen = Verschieben &nbsp;·&nbsp;
        Mausrad = Zoom &nbsp;·&nbsp;
        Zwei-Finger-Pinch = Zoom &nbsp;·&nbsp;{' '}
        <Link to="/hilfe" className="hover:underline">Zurück zur Hilfe</Link>
      </p>
    </div>
  )
}
