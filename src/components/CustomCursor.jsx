import { useEffect, useRef, useState } from 'react'

const ACCENT = '#7f7954'

/**
 * Custom cursor — desktop only.
 *
 * States
 *  • 'default' : filled dot
 *  • 'hover'   : empty ring (buttons / links)
 *  • 'view'    : empty ring + "VIEW" label (data-cursor="view" project links)
 *  • click     : squeeze animation on any expanded state
 */
export default function CustomCursor() {
  const dotRef = useRef(null)
  const ringRef = useRef(null)

  const posRef = useRef({ x: -200, y: -200 })
  const smoothRef = useRef({ x: -200, y: -200 })
  const rafRef = useRef(null)

  /** 'default' | 'hover' | 'view' */
  const [mode, setMode] = useState('default')
  const [click, setClick] = useState(false)
  const [hideForProjectCountdown, setHideForProjectCountdown] = useState(false)

  /* Project page “next” ring — hide default cursor so only the loader shows */
  useEffect(() => {
    const el = document.documentElement
    const sync = () =>
      setHideForProjectCountdown(el.getAttribute('data-project-next-countdown') === 'true')
    const mo = new MutationObserver(sync)
    mo.observe(el, { attributes: true, attributeFilter: ['data-project-next-countdown'] })
    sync()
    return () => mo.disconnect()
  }, [])

  /* ── track raw pointer + live mode detection ── */
  useEffect(() => {
    const onMove = (e) => {
      posRef.current = { x: e.clientX, y: e.clientY }

      if (e.target.closest('[data-cursor="view"]')) {
        setMode('view')
      } else if (e.target.closest('a, button')) {
        setMode('hover')
      } else {
        setMode('default')
      }
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  /* ── RAF loop: ring lags dot for magnetic feel ── */
  useEffect(() => {
    const lerp = (a, b, t) => a + (b - a) * t
    const tick = () => {
      const raw = posRef.current
      const sm = smoothRef.current
      sm.x = lerp(sm.x, raw.x, 0.14)
      sm.y = lerp(sm.y, raw.y, 0.14)
      if (dotRef.current)
        dotRef.current.style.transform = `translate(${raw.x}px,${raw.y}px) translate(-50%,-50%)`
      if (ringRef.current)
        ringRef.current.style.transform = `translate(${sm.x}px,${sm.y}px) translate(-50%,-50%)`
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  /* ── click squeeze ── */
  useEffect(() => {
    const down = () => setClick(true)
    const up = () => setClick(false)
    window.addEventListener('pointerdown', down, { passive: true })
    window.addEventListener('pointerup', up, { passive: true })
    return () => {
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
    }
  }, [])

  /* Mobile / touch: nothing rendered */
  if (typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches) return null

  if (hideForProjectCountdown) return null

  const expanded = mode === 'hover' || mode === 'view'
  const ringSize = expanded ? 58 : 13
  const dotSize = expanded ? 0 : 12

  return (
    <>
      {/* Dot — snaps to cursor exactly */}
      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9999] rounded-full"
        style={{
          width: dotSize,
          height: dotSize,
          background: ACCENT,
          opacity: dotSize === 0 ? 0 : 1,
          transition: 'width 0.15s ease-out, height 0.15s ease-out, opacity 0.15s ease-out',
          willChange: 'transform',
        }}
      />

      {/* Ring — lags behind slightly for magnetic feel */}
      <div
        ref={ringRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9999] flex items-center justify-center rounded-full"
        style={{
          width: ringSize,
          height: ringSize,
          border: expanded ? `1.5px solid ${ACCENT}` : '0px solid transparent',
          background: expanded ? 'transparent' : ACCENT,
          transform: click ? 'translate(-50%,-50%) scale(0.72)' : undefined,
          transition: click
            ? 'transform 0.08s ease-out, width 0.2s ease-out, height 0.2s ease-out, border-width 0.2s ease-out'
            : 'transform 0.22s ease-out, width 0.2s ease-out, height 0.2s ease-out, border-width 0.2s ease-out',
          willChange: 'transform',
        }}
      >
        {mode === 'view' ? (
          <span
            className="select-none font-body text-[12px] font-normal uppercase tracking-[0.18em]"
            style={{ color: ACCENT }}
          >
            View
          </span>
        ) : null}
      </div>
    </>
  )
}
