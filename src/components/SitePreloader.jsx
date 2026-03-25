import { useEffect, useRef, useState } from 'react'
import { getProjectCoverImageUrls, preloadImages } from '../utils/preloadImages.js'

const MAX_WAIT_MS = 15000
/** Match desktop catalogue project title (`Work.jsx` sizes[0]) */
const COUNTER_TEXT =
  'catalogue-project-title m-0 w-full text-center uppercase text-[#7f7954] leading-[0.9] tracking-[-0.02em] tabular-nums text-[clamp(42px,6.5vw,96px)]'
/** Counter starts lower and moves up toward center as progress → 100 */
const RISE_PX = 72

export default function SitePreloader({ onComplete }) {
  const [fadeOut, setFadeOut] = useState(false)
  const doneRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const [percent, setPercent] = useState(0)
  const [prefersReducedMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  const targetRef = useRef(0)
  const smoothRef = useRef(0)
  const rafRef = useRef(0)

  useEffect(() => {
    let cancelled = false
    const urls = getProjectCoverImageUrls()

    const finish = () => {
      if (doneRef.current) return
      doneRef.current = true
      if (prefersReducedMotion) {
        setPercent(100)
        onCompleteRef.current()
        return
      }
      setFadeOut(true)
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
      catchUpInterval = null
      catchUpTimeout = null
    }

    const maybeFinishAfterCatchUp = () => {
      clearCatchUp()
      catchUpInterval = window.setInterval(() => {
        if (cancelled || doneRef.current) {
          clearCatchUp()
          return
        }
        if (smoothRef.current >= 99.5) {
          clearCatchUp()
          finish()
        }
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
        onProgress: (r) => {
          if (cancelled) return
          setPercent(Math.min(100, Math.round(r * 100)))
        },
      }).then(() => {
        if (cancelled) return
        window.clearTimeout(maxWait)
        setPercent(100)
        finish()
      })
      return () => {
        cancelled = true
        window.clearTimeout(maxWait)
      }
    }

    const tick = () => {
      if (cancelled) return
      const target = targetRef.current
      let s = smoothRef.current
      const diff = target - s
      if (Math.abs(diff) < 0.35) s = target
      else s += diff * 0.12
      smoothRef.current = s
      setPercent(s)
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    preloadImages(urls, {
      onProgress: (r) => {
        if (cancelled) return
        targetRef.current = Math.min(100, r * 100)
      },
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
    }
  }, [prefersReducedMotion])

  const onTransitionEnd = (e) => {
    if (e.target !== e.currentTarget) return
    if (e.propertyName !== 'opacity') return
    if (fadeOut) onCompleteRef.current()
  }

  const rounded = Math.min(100, Math.max(0, Math.round(percent)))
  const rise = prefersReducedMotion ? 0 : (1 - Math.min(100, percent) / 100) * RISE_PX

  return (
    <div
      role="progressbar"
      className={[
        'fixed inset-0 z-[250] flex flex-col items-center justify-center bg-canvas',
        'transition-opacity duration-500 ease-out',
        fadeOut ? 'pointer-events-none opacity-0' : 'opacity-100',
      ].join(' ')}
      aria-busy={fadeOut ? undefined : 'true'}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={rounded}
      aria-valuetext={`${rounded} percent`}
      aria-label={`Loading ${rounded} percent`}
      onTransitionEnd={onTransitionEnd}
    >
      <div className="flex w-full max-w-[min(100vw,1600px)] flex-col items-center justify-center px-4">
        <p
          className={COUNTER_TEXT}
          style={
            prefersReducedMotion
              ? undefined
              : { transform: `translateY(${rise}px)`, willChange: 'transform' }
          }
        >
          {rounded}
        </p>
      </div>
    </div>
  )
}
