import { useEffect, useRef, useState } from 'react'

const ACCENT = '#7f7954'

/**
 * Custom cursor — desktop only.
 *
 * States
 *  • default : filled dot, ACCENT colour
 *  • hover   : ring + "VIEW" label (data-cursor="view" elements)
 *  • click   : quick squeeze animation
 */
export default function CustomCursor() {
  const dotRef = useRef(null)
  const ringRef = useRef(null)

  const posRef = useRef({ x: -200, y: -200 })
  const smoothRef = useRef({ x: -200, y: -200 })
  const rafRef = useRef(null)

  const [hover, setHover] = useState(false)
  const [click, setClick] = useState(false)

  /* ── track raw pointer + live hover detection ── */
  useEffect(() => {
    const onMove = (e) => {
      posRef.current = { x: e.clientX, y: e.clientY }
      // Re-check on every move so stale hover (e.g. after navigation) resets instantly
      setHover(Boolean(e.target.closest('[data-cursor="view"]')))
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  /* ── RAF loop: lag the ring slightly behind the dot ── */
  useEffect(() => {
    const lerp = (a, b, t) => a + (b - a) * t

    const tick = () => {
      const raw = posRef.current
      const sm = smoothRef.current

      sm.x = lerp(sm.x, raw.x, 0.14)
      sm.y = lerp(sm.y, raw.y, 0.14)

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${raw.x}px, ${raw.y}px) translate(-50%,-50%)`
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${sm.x}px, ${sm.y}px) translate(-50%,-50%)`
      }

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

  const ringSize = hover ? 84 : 13
  const dotSize = hover ? 0 : 12

  return (
    <>
      {/* Dot — snaps to cursor exactly */}
      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9999] rounded-full transition-[width,height,opacity] duration-150 ease-out"
        style={{
          width: dotSize,
          height: dotSize,
          background: ACCENT,
          opacity: dotSize === 0 ? 0 : 1,
          willChange: 'transform',
        }}
      />

      {/* Ring — lags behind slightly for "magnetic" feel */}
      <div
        ref={ringRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9999] flex items-center justify-center rounded-full transition-[width,height,border-width,opacity] duration-200 ease-out"
        style={{
          width: ringSize,
          height: ringSize,
          border: hover ? `1.5px solid ${ACCENT}` : '0px solid transparent',
          background: hover ? 'transparent' : ACCENT,
          opacity: 1,
          transform: click ? 'translate(-50%,-50%) scale(0.72)' : undefined,
          transition: click
            ? 'transform 0.08s ease-out, width 0.2s ease-out, height 0.2s ease-out, border-width 0.2s ease-out'
            : 'transform 0.22s ease-out, width 0.2s ease-out, height 0.2s ease-out, border-width 0.2s ease-out',
          willChange: 'transform',
        }}
      >
        {hover ? (
          <span
            className="select-none text-[6.5px] font-normal uppercase tracking-[0.18em]"
            style={{ color: ACCENT }}
          >
            View
          </span>
        ) : null}
      </div>
    </>
  )
}
