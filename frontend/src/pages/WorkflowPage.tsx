import { Link } from 'react-router-dom'
import { useRef, useState, useCallback, useEffect, useLayoutEffect } from 'react'

const MIN_ZOOM = 0.1
const MAX_ZOOM = 6
const WHEEL_FACTOR = 1.12
const PAN_STEP = 50
const ZOOM_STEP = 1.3
const BOTTOM_MARGIN = 56

const clamp = (v: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v))

export default function WorkflowPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  // Transform state
  const [zoom, setZoom] = useState(1)
  const [offX, setOffX] = useState(0)
  const [offY, setOffY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [containerH, setContainerH] = useState(400)
  const [imgLoaded, setImgLoaded] = useState(false)

  // Refs for non-stale access in callbacks
  const zoomRef = useRef(zoom)
  const offXRef = useRef(offX)
  const offYRef = useRef(offY)
  zoomRef.current = zoom
  offXRef.current = offX
  offYRef.current = offY

  const dragOrigin = useRef({ x: 0, y: 0, offX: 0, offY: 0 })
  const pinchRef = useRef<{ startDist: number; startZoom: number; startOffX: number; startOffY: number } | null>(null)
  const touchDragRef = useRef<{ startX: number; startY: number; startOffX: number; startOffY: number } | null>(null)

  // Natural image dimensions
  const naturalW = useRef(0)
  const naturalH = useRef(0)

  // ── Dynamic container height ────────────────────────────────────────────────
  const updateContainerHeight = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const top = el.getBoundingClientRect().top
    const h = Math.max(200, window.innerHeight - top - BOTTOM_MARGIN)
    setContainerH(h)
  }, [])

  useLayoutEffect(() => {
    updateContainerHeight()
  }, [updateContainerHeight])

  useEffect(() => {
    window.addEventListener('resize', updateContainerHeight)
    return () => window.removeEventListener('resize', updateContainerHeight)
  }, [updateContainerHeight])

  // ── Fit-to-view ─────────────────────────────────────────────────────────────
  const fitToView = useCallback(() => {
    const el = containerRef.current
    if (!el || !naturalW.current || !naturalH.current) return
    const cW = el.clientWidth
    const cH = el.clientHeight
    const nW = naturalW.current
    const nH = naturalH.current
    const fitZoom = Math.min(cW / nW, cH / nH)
    const clamped = clamp(fitZoom)
    setZoom(clamped)
    setOffX((cW - nW * clamped) / 2)
    setOffY((cH - nH * clamped) / 2)
  }, [])

  // ── Image load handler ──────────────────────────────────────────────────────
  const onImageLoad = useCallback(() => {
    const img = imgRef.current
    if (!img) return
    naturalW.current = img.naturalWidth
    naturalH.current = img.naturalHeight
    setImgLoaded(true)
    // Schedule fit after the container has its final height
    requestAnimationFrame(() => fitToView())
  }, [fitToView])

  // ── Focal-point zoom ────────────────────────────────────────────────────────
  const applyZoom = useCallback(
    (getNext: (prev: number) => number, fpX: number, fpY: number) => {
      const oldZoom = zoomRef.current
      const newZoom = clamp(getNext(oldZoom))
      if (newZoom === oldZoom) return
      const ratio = newZoom / oldZoom
      const newOffX = fpX - (fpX - offXRef.current) * ratio
      const newOffY = fpY - (fpY - offYRef.current) * ratio
      setZoom(newZoom)
      setOffX(newOffX)
      setOffY(newOffY)
    },
    []
  )

  // ── Toolbar zoom (no focal point — zoom to container center) ────────────────
  const zoomIn = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const cx = el.clientWidth / 2
    const cy = el.clientHeight / 2
    applyZoom(prev => prev * ZOOM_STEP, cx, cy)
  }, [applyZoom])

  const zoomOut = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const cx = el.clientWidth / 2
    const cy = el.clientHeight / 2
    applyZoom(prev => prev / ZOOM_STEP, cx, cy)
  }, [applyZoom])

  // ── Mouse drag (pan) ───────────────────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    setDragging(true)
    dragOrigin.current = { x: e.clientX, y: e.clientY, offX: offXRef.current, offY: offYRef.current }
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return
    e.preventDefault()
    setOffX(dragOrigin.current.offX + (e.clientX - dragOrigin.current.x))
    setOffY(dragOrigin.current.offY + (e.clientY - dragOrigin.current.y))
  }, [dragging])

  const stopDrag = useCallback(() => setDragging(false), [])

  // ── Mouse-wheel zoom (native non-passive) ─────────────────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const fpX = e.clientX - rect.left
      const fpY = e.clientY - rect.top
      const factor = e.deltaY < 0 ? WHEEL_FACTOR : 1 / WHEEL_FACTOR
      applyZoom(prev => prev * factor, fpX, fpY)
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [applyZoom])

  // ── Double-click: 2x zoom at cursor ────────────────────────────────────────
  const onDoubleClick = useCallback((e: React.MouseEvent) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const fpX = e.clientX - rect.left
    const fpY = e.clientY - rect.top
    applyZoom(prev => prev * 2, fpX, fpY)
  }, [applyZoom])

  // ── Touch: single-finger drag + pinch zoom ─────────────────────────────────
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]]
      pinchRef.current = {
        startDist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
        startZoom: zoomRef.current,
        startOffX: offXRef.current,
        startOffY: offYRef.current,
      }
      touchDragRef.current = null
    } else if (e.touches.length === 1) {
      touchDragRef.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        startOffX: offXRef.current,
        startOffY: offYRef.current,
      }
      pinchRef.current = null
    }
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const el = containerRef.current
    if (!el) return

    if (e.touches.length === 2 && pinchRef.current) {
      const [a, b] = [e.touches[0], e.touches[1]]
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
      if (pinchRef.current.startDist <= 0) return
      const rect = el.getBoundingClientRect()
      const fpX = (a.clientX + b.clientX) / 2 - rect.left
      const fpY = (a.clientY + b.clientY) / 2 - rect.top
      const pinchScale = dist / pinchRef.current.startDist
      const newZoom = clamp(pinchRef.current.startZoom * pinchScale)
      const ratio = newZoom / pinchRef.current.startZoom
      setZoom(newZoom)
      setOffX(fpX - (fpX - pinchRef.current.startOffX) * ratio)
      setOffY(fpY - (fpY - pinchRef.current.startOffY) * ratio)
    } else if (e.touches.length === 1 && touchDragRef.current) {
      const dx = e.touches[0].clientX - touchDragRef.current.startX
      const dy = e.touches[0].clientY - touchDragRef.current.startY
      setOffX(touchDragRef.current.startOffX + dx)
      setOffY(touchDragRef.current.startOffY + dy)
    }
  }, [])

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length < 2) pinchRef.current = null
    if (e.touches.length < 1) touchDragRef.current = null
  }, [])

  // Native non-passive touchmove to allow preventDefault on pinch
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handler = (e: TouchEvent) => {
      if (e.touches.length === 2) e.preventDefault()
    }
    el.addEventListener('touchmove', handler, { passive: false })
    return () => el.removeEventListener('touchmove', handler)
  }, [])

  // ── Keyboard controls ─────────────────────────────────────────────────────
  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    const el = containerRef.current
    if (!el) return
    const cx = el.clientWidth / 2
    const cy = el.clientHeight / 2

    switch (e.key) {
      case '+':
      case '=':
        e.preventDefault()
        applyZoom(prev => prev * ZOOM_STEP, cx, cy)
        break
      case '-':
        e.preventDefault()
        applyZoom(prev => prev / ZOOM_STEP, cx, cy)
        break
      case '0':
        e.preventDefault()
        fitToView()
        break
      case 'ArrowLeft':
        e.preventDefault()
        setOffX(prev => prev + PAN_STEP)
        break
      case 'ArrowRight':
        e.preventDefault()
        setOffX(prev => prev - PAN_STEP)
        break
      case 'ArrowUp':
        e.preventDefault()
        setOffY(prev => prev + PAN_STEP)
        break
      case 'ArrowDown':
        e.preventDefault()
        setOffY(prev => prev - PAN_STEP)
        break
    }
  }, [applyZoom, fitToView])

  const zoomPercent = Math.round(zoom * 100)

  return (
    <div className="space-y-2">
      {/* Header row with back link, title, and zoom toolbar */}
      <div className="flex items-center justify-between gap-3">
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

        {/* Zoom toolbar */}
        {imgLoaded && (
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1 shadow-sm">
            <button
              onClick={zoomOut}
              className="p-1 text-gray-500 hover:text-gray-800 transition-colors rounded hover:bg-gray-100"
              title="Verkleinern (–)"
              aria-label="Verkleinern"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M4 10a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H4.75A.75.75 0 0 1 4 10Z" clipRule="evenodd" />
              </svg>
            </button>
            <span className="text-xs text-gray-600 w-10 text-center select-none" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {zoomPercent}%
            </span>
            <button
              onClick={zoomIn}
              className="p-1 text-gray-500 hover:text-gray-800 transition-colors rounded hover:bg-gray-100"
              title="Vergrößern (+)"
              aria-label="Vergrößern"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
              </svg>
            </button>
            <div className="w-px h-4 bg-gray-200 mx-1" />
            <button
              onClick={fitToView}
              className="p-1 text-gray-500 hover:text-gray-800 transition-colors rounded hover:bg-gray-100"
              title="Einpassen (0)"
              aria-label="Einpassen"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 0 0 2 4.25v2a.75.75 0 0 0 1.5 0v-2a.75.75 0 0 1 .75-.75h2a.75.75 0 0 0 0-1.5h-2ZM13.75 2a.75.75 0 0 0 0 1.5h2a.75.75 0 0 1 .75.75v2a.75.75 0 0 0 1.5 0v-2A2.25 2.25 0 0 0 15.75 2h-2ZM3.5 13.75a.75.75 0 0 0-1.5 0v2A2.25 2.25 0 0 0 4.25 18h2a.75.75 0 0 0 0-1.5h-2a.75.75 0 0 1-.75-.75v-2ZM18 13.75a.75.75 0 0 0-1.5 0v2a.75.75 0 0 1-.75.75h-2a.75.75 0 0 0 0 1.5h2A2.25 2.25 0 0 0 18 15.75v-2Z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Pan/Zoom container */}
      <div
        ref={containerRef}
        tabIndex={0}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        onDoubleClick={onDoubleClick}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onKeyDown={onKeyDown}
        className={`bg-white shadow rounded-xl overflow-hidden border border-gray-100 select-none relative outline-none focus:ring-2 focus:ring-blue-300 ${
          dragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{ height: containerH, touchAction: 'none' }}
      >
        <img
          ref={imgRef}
          src={`${import.meta.env.BASE_URL}workflow.jpg`}
          alt="Workflow-Infografik: Schritt-für-Schritt-Übersicht für Admin und Jury"
          draggable={false}
          onLoad={onImageLoad}
          style={{
            position: 'absolute',
            transformOrigin: '0 0',
            transform: `translate(${offX}px, ${offY}px) scale(${zoom})`,
            maxWidth: 'none',
          }}
        />
      </div>

      <p className="text-xs text-gray-400 text-center">
        Ziehen = Verschieben &nbsp;·&nbsp;
        Mausrad = Zoom &nbsp;·&nbsp;
        Doppelklick = 2× Zoom &nbsp;·&nbsp;
        Pinch = Zoom &nbsp;·&nbsp;
        Tasten: +/−/0/Pfeile &nbsp;·&nbsp;{' '}
        <Link to="/hilfe" className="hover:underline">Zurück zur Hilfe</Link>
      </p>
    </div>
  )
}
