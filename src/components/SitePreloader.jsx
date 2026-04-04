import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import projects from '../data/projects.json'
import { getProjectImages } from '../utils/projects.js'

const MAX_WAIT_MS = 15000
const BG = '#7f7954'

function getAllSiteImageUrls() {
  const set = new Set()
  for (const p of projects) {
    for (const url of getProjectImages(p)) {
      if (url && typeof url === 'string') set.add(url)
    }
  }
  return [...set]
}

/** Resolve a single image URL; failures still resolve so the UI never hangs. */
function preloadOne(src) {
  if (!src || typeof src !== 'string') return Promise.resolve()
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => resolve()
    img.src = src
  })
}

/**
 * @param {string[]} urls
 * @param {{ onProgress?: (ratio: number) => void }} [options] — `ratio` in 0..1 after each URL settles
 */
function preloadImages(urls, options = {}) {
  const { onProgress } = options
  const unique = [...new Set(urls.filter(Boolean))]
  const total = unique.length
  if (total === 0) {
    onProgress?.(1)
    return Promise.resolve()
  }
  let done = 0
  const bump = () => {
    done += 1
    onProgress?.(done / total)
  }
  return Promise.all(unique.map((src) => preloadOne(src).then(bump)))
}

/* ── pixel grid helpers (same cell maths as pixelTransition.js) ── */
function getPixelCols() {
  return window.matchMedia('(max-width: 767px)').matches ? 4 : 7
}

function buildPreloaderPixels(container) {
  const cols = getPixelCols()
  const cellSize = Math.ceil(window.innerWidth / cols)
  const rows = Math.ceil(window.innerHeight / cellSize)
  container.style.cssText = `
    position:absolute;inset:0;display:grid;
    grid-template-columns:repeat(${cols},${cellSize}px);
    grid-template-rows:repeat(${rows},${cellSize}px);
    pointer-events:none;
  `
  container.innerHTML = ''
  for (let i = 0; i < rows * cols; i += 1) {
    const d = document.createElement('div')
    d.style.backgroundColor = BG
    d.style.transformOrigin = 'center'
    container.appendChild(d)
  }
  return container.querySelectorAll('div')
}

/* ── letter reveal ── */
function RevealWord({ word, startDelay = 0, charDelay = 0.04, ready }) {
  return (
    <span className="inline-flex">
      {word.split('').map((ch, i) => (
        <span
          key={i}
          style={{ overflow: 'hidden', display: 'inline-block', lineHeight: 'inherit' }}
        >
          <span
            style={{
              display: 'inline-block',
              clipPath: ready ? 'inset(0 0 0% 0)' : 'inset(0 0 110% 0)',
              transition: ready
                ? `clip-path 0.65s cubic-bezier(0.22,1,0.36,1) ${startDelay + i * charDelay}s`
                : 'none',
              willChange: 'clip-path',
            }}
          >
            {ch}
          </span>
        </span>
      ))}
    </span>
  )
}

export default function SitePreloader({ onComplete }) {
  const [percent, setPercent] = useState(0)
  const [nameReady, setNameReady] = useState(false)

  /**
   * exitPhase:
   *  'idle'      — loading / fully visible
   *  'textFade'  — text opacity → 0 (CSS, ~260ms)
   *  'pixels'    — pixel-scatter (GSAP, same as page-transition reveal)
   */
  const [exitPhase, setExitPhase] = useState('idle')

  const doneRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete
  const pixelContainerRef = useRef(null)
  const gsapTlRef = useRef(null)
  const textFadeTimerRef = useRef(null)

  const [prefersReducedMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  const targetRef = useRef(0)
  const smoothRef = useRef(0)
  const rafRef = useRef(0)

  /* Kick name reveal one rAF after mount */
  useEffect(() => {
    if (prefersReducedMotion) { setNameReady(true); return }
    const id = requestAnimationFrame(() => setNameReady(true))
    return () => cancelAnimationFrame(id)
  }, [prefersReducedMotion])

  /* ── loading logic ── */
  useEffect(() => {
    let cancelled = false
    const urls = getAllSiteImageUrls()

    const finish = () => {
      if (doneRef.current) return
      doneRef.current = true

      if (prefersReducedMotion) {
        setPercent(100)
        onCompleteRef.current()
        return
      }

      /* Phase 1 — fade text out */
      setExitPhase('textFade')

      textFadeTimerRef.current = window.setTimeout(() => {
        /* Phase 2 — pixel scatter */
        setExitPhase('pixels')

        requestAnimationFrame(() => {
          const container = pixelContainerRef.current
          if (!container) { onCompleteRef.current(); return }

          const pixels = buildPreloaderPixels(container)
          gsap.set(pixels, { scale: 1 })

          gsapTlRef.current = gsap.timeline({
            onComplete: () => onCompleteRef.current(),
          })
          gsapTlRef.current.to(pixels, {
            scale: 0,
            duration: () => 0.38 + Math.random() * 0.22,
            ease: 'power3.inOut',
            stagger: () => Math.random() * 0.55,
          })
        })
      }, 280)
    }

    const maxWait = window.setTimeout(() => {
      if (!cancelled) {
        targetRef.current = 100
        smoothRef.current = 100
        setPercent(100)
        finish()
      }
    }, MAX_WAIT_MS)

    let catchUpInterval = null
    let catchUpTimeout = null
    const clearCatchUp = () => {
      if (catchUpInterval != null) window.clearInterval(catchUpInterval)
      if (catchUpTimeout != null) window.clearTimeout(catchUpTimeout)
      catchUpInterval = catchUpTimeout = null
    }
    const maybeFinishAfterCatchUp = () => {
      clearCatchUp()
      catchUpInterval = window.setInterval(() => {
        if (cancelled || doneRef.current) { clearCatchUp(); return }
        if (smoothRef.current >= 99.5) { clearCatchUp(); finish() }
      }, 32)
      catchUpTimeout = window.setTimeout(() => {
        clearCatchUp()
        if (!cancelled && !doneRef.current) finish()
      }, 900)
    }

    const stopRaf = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }

    if (prefersReducedMotion) {
      preloadImages(urls, {
        onProgress: (r) => { if (!cancelled) setPercent(Math.min(100, Math.round(r * 100))) },
      }).then(() => {
        if (cancelled) return
        window.clearTimeout(maxWait)
        setPercent(100)
        finish()
      })
      return () => { cancelled = true; window.clearTimeout(maxWait) }
    }

    const tick = () => {
      if (cancelled) return
      const target = targetRef.current
      let s = smoothRef.current
      const diff = target - s
      s = Math.abs(diff) < 0.35 ? target : s + diff * 0.1
      smoothRef.current = s
      setPercent(s)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    preloadImages(urls, {
      onProgress: (r) => { if (!cancelled) targetRef.current = Math.min(100, r * 100) },
    }).then(() => {
      if (cancelled) return
      window.clearTimeout(maxWait)
      targetRef.current = 100
      maybeFinishAfterCatchUp()
    })

    return () => {
      cancelled = true
      window.clearTimeout(maxWait)
      clearCatchUp()
      stopRaf()
      if (textFadeTimerRef.current) window.clearTimeout(textFadeTimerRef.current)
      gsapTlRef.current?.kill()
    }
  }, [prefersReducedMotion])

  const rounded = Math.min(100, Math.max(0, Math.round(percent)))
  const displayCount = String(rounded).padStart(3, '\u2007')

  const textClass =
    'm-0 font-normal uppercase tracking-wide text-nav leading-snug tabular-nums whitespace-nowrap'
  const textStyle = { color: '#e5e5e5' }

  /* ── during pixel scatter, the root bg becomes transparent (pixels cover it) ── */
  const rootBg = exitPhase === 'pixels' ? 'transparent' : BG

  return (
    <div
      role="progressbar"
      aria-busy={exitPhase === 'idle' ? 'true' : undefined}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={rounded}
      aria-valuetext={`${rounded} percent`}
      aria-label={`Loading ${rounded} percent`}
      className="fixed inset-0 z-[250] flex items-center overflow-hidden"
      style={{ backgroundColor: rootBg, transition: 'background-color 0s' }}
    >
      {/* Pixel scatter container — populated only during exit */}
      <div ref={pixelContainerRef} aria-hidden />

      {/* Content row: name left — counter right */}
      <div
        className="relative z-10 flex w-full flex-col items-center gap-2 px-5 md:px-8"
        style={{
          opacity: exitPhase === 'textFade' || exitPhase === 'pixels' ? 0 : 1,
          transition: exitPhase === 'textFade' ? 'opacity 0.26s ease-out' : 'none',
          pointerEvents: 'none',
        }}
      >
        <p className={textClass} style={textStyle} aria-hidden="true">
          <RevealWord word="PARMANAND" startDelay={0.05} charDelay={0.038} ready={nameReady} />
          <span style={{ display: 'inline-block', width: '0.35em' }} />
          <RevealWord word="OJHA" startDelay={0.44} charDelay={0.05} ready={nameReady} />
        </p>

        <p
          className={textClass}
          style={{
            ...textStyle,
            opacity: prefersReducedMotion ? 1 : Math.min(1, percent / 8),
          }}
          aria-live="polite"
        >
          {displayCount}%
        </p>
      </div>
    </div>
  )
}
