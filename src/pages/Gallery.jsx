import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import projects from '../data/projects.json'

const THUMB_HEIGHT = 96
const MOBILE_THUMB_W = 88

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : false
  )

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const onChange = () => setIsDesktop(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return isDesktop
}

function GalleryLayer() {
  const isDesktop = useIsDesktop()
  const scrollRef = useRef(null)
  const trackRef = useRef(null)
  const itemRefs = useRef([])
  const scrubbingRef = useRef(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [edgePad, setEdgePad] = useState(48)
  const [scrollProgress, setScrollProgress] = useState(0)

  const active = projects[activeIndex] ?? projects[0]

  /** Use the thumb strip’s own midline — not full viewport — so top items can be “active” */
  const getStripCenterY = () => {
    const el = scrollRef.current
    if (!el) return window.innerHeight / 2
    const r = el.getBoundingClientRect()
    return r.top + r.height / 2
  }

  const getStripCenterX = () => {
    const el = scrollRef.current
    if (!el) return window.innerWidth / 2
    const r = el.getBoundingClientRect()
    return r.left + r.width / 2
  }

  const updateActiveFromScroll = useCallback(() => {
    let best = 0
    let bestDist = Infinity
    if (isDesktop) {
      const my = getStripCenterY()
      itemRefs.current.forEach((el, i) => {
        if (!el) return
        const r = el.getBoundingClientRect()
        const cy = r.top + r.height / 2
        const d = Math.abs(cy - my)
        if (d < bestDist) {
          bestDist = d
          best = i
        }
      })
    } else {
      const mx = getStripCenterX()
      itemRefs.current.forEach((el, i) => {
        if (!el) return
        const r = el.getBoundingClientRect()
        const cx = r.left + r.width / 2
        const d = Math.abs(cx - mx)
        if (d < bestDist) {
          bestDist = d
          best = i
        }
      })
    }
    setActiveIndex(best)
  }, [isDesktop])

  const syncScrollProgress = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    if (isDesktop) {
      const max = el.scrollHeight - el.clientHeight
      setScrollProgress(max <= 0 ? 0 : el.scrollTop / max)
    } else {
      const max = el.scrollWidth - el.clientWidth
      setScrollProgress(max <= 0 ? 0 : el.scrollLeft / max)
    }
  }, [isDesktop])

  const applyScrubFromClientX = useCallback(
    (clientX) => {
      const track = trackRef.current
      const container = scrollRef.current
      if (!track || !container) return
      const rect = track.getBoundingClientRect()
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
      if (isDesktop) {
        const max = container.scrollHeight - container.clientHeight
        container.scrollTop = max * ratio
      } else {
        const max = container.scrollWidth - container.clientWidth
        container.scrollLeft = max * ratio
      }
    },
    [isDesktop]
  )

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    const measurePad = () => {
      if (isDesktop) {
        const h = container.clientHeight
        if (h <= 0) return
        setEdgePad(Math.max(0, h / 2 - THUMB_HEIGHT / 2))
      } else {
        const w = container.clientWidth
        if (w <= 0) return
        setEdgePad(Math.max(0, w / 2 - MOBILE_THUMB_W / 2))
      }
    }

    const onScroll = () => {
      updateActiveFromScroll()
      syncScrollProgress()
    }

    measurePad()
    const ro = new ResizeObserver(() => {
      measurePad()
      requestAnimationFrame(() => {
        updateActiveFromScroll()
        syncScrollProgress()
      })
    })
    ro.observe(container)

    const onResize = () => {
      measurePad()
      requestAnimationFrame(() => {
        updateActiveFromScroll()
        syncScrollProgress()
      })
    }

    container.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)

    requestAnimationFrame(() => {
      measurePad()
      updateActiveFromScroll()
      syncScrollProgress()
    })

    return () => {
      ro.disconnect()
      container.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [isDesktop, updateActiveFromScroll, syncScrollProgress])

  useEffect(() => {
    const onWheelCapture = (e) => {
      const container = scrollRef.current
      if (!container) return
      if (container.contains(e.target)) return
      if (e.target.closest?.('[data-gallery-scrubber]')) return

      e.preventDefault()
      if (isDesktop) {
        container.scrollTop += e.deltaY
      } else {
        container.scrollLeft += e.deltaY
      }
    }

    let forwardTouch = false
    let lastTouchY = null

    const onTouchStartCapture = (e) => {
      forwardTouch = false
      lastTouchY = null
      if (e.touches.length !== 1) return
      const container = scrollRef.current
      if (!container || container.contains(e.target)) return
      if (e.target.closest?.('[data-gallery-scrubber]')) return
      forwardTouch = true
      lastTouchY = e.touches[0].clientY
    }

    const onTouchMoveCapture = (e) => {
      if (!forwardTouch || lastTouchY == null || e.touches.length !== 1) return
      const container = scrollRef.current
      if (!container) return
      e.preventDefault()
      const y = e.touches[0].clientY
      const dy = lastTouchY - y
      lastTouchY = y
      if (isDesktop) {
        container.scrollTop += dy
      } else {
        container.scrollLeft += dy
      }
    }

    const endTouchForward = () => {
      forwardTouch = false
      lastTouchY = null
    }

    window.addEventListener('wheel', onWheelCapture, { passive: false, capture: true })
    window.addEventListener('touchstart', onTouchStartCapture, { passive: true, capture: true })
    window.addEventListener('touchmove', onTouchMoveCapture, { passive: false, capture: true })
    window.addEventListener('touchend', endTouchForward, { capture: true })
    window.addEventListener('touchcancel', endTouchForward, { capture: true })

    return () => {
      window.removeEventListener('wheel', onWheelCapture, { capture: true })
      window.removeEventListener('touchstart', onTouchStartCapture, { capture: true })
      window.removeEventListener('touchmove', onTouchMoveCapture, { capture: true })
      window.removeEventListener('touchend', endTouchForward, { capture: true })
      window.removeEventListener('touchcancel', endTouchForward, { capture: true })
    }
  }, [isDesktop])

  const scrollThumbIndexToCenter = (index) => {
    const el = itemRefs.current[index]
    const container = scrollRef.current
    if (!el || !container) return
    if (isDesktop) {
      const elRect = el.getBoundingClientRect()
      const cy = elRect.top + elRect.height / 2
      const delta = cy - getStripCenterY()
      container.scrollBy({ top: delta, behavior: 'smooth' })
    } else {
      const elRect = el.getBoundingClientRect()
      const cx = elRect.left + elRect.width / 2
      const delta = cx - getStripCenterX()
      container.scrollBy({ left: delta, behavior: 'smooth' })
    }
  }

  const onScrubPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    scrubbingRef.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    applyScrubFromClientX(e.clientX)
  }

  const onScrubPointerMove = (e) => {
    if (!scrubbingRef.current) return
    applyScrubFromClientX(e.clientX)
  }

  const onScrubPointerUp = (e) => {
    scrubbingRef.current = false
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }

  const onScrubKeyDown = (e) => {
    const container = scrollRef.current
    if (!container) return
    if (isDesktop) {
      const max = container.scrollHeight - container.clientHeight
      if (max <= 0) return
      const step = max / Math.max(1, projects.length - 1)
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        container.scrollTop = Math.max(0, container.scrollTop - step)
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        container.scrollTop = Math.min(max, container.scrollTop + step)
      }
    } else {
      const max = container.scrollWidth - container.clientWidth
      if (max <= 0) return
      const step = max / Math.max(1, projects.length - 1)
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        container.scrollLeft = Math.max(0, container.scrollLeft - step)
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        container.scrollLeft = Math.min(max, container.scrollLeft + step)
      }
    }
  }

  const thumbButton = (p, i, mobile) => (
    <button
      key={p.id}
      type="button"
      ref={(el) => {
        itemRefs.current[i] = el
      }}
      onClick={() => scrollThumbIndexToCenter(i)}
      className={[
        mobile
          ? 'relative h-14 w-[5.5rem] shrink-0 overflow-hidden rounded-md bg-neutral-200 transition-[opacity,filter,ring]'
          : 'relative h-24 w-full shrink-0 overflow-hidden rounded-sm bg-neutral-200 transition-[opacity,filter,ring]',
        mobile
          ? i === activeIndex
            ? 'opacity-100 grayscale ring-1 ring-neutral-400 ring-offset-2 ring-offset-white'
            : 'grayscale opacity-[0.85]'
          : i === activeIndex
            ? 'opacity-100 grayscale-0 ring-2 ring-neutral-900 ring-offset-2 ring-offset-white'
            : 'grayscale opacity-[0.72] hover:opacity-90 hover:grayscale-0',
      ].join(' ')}
      aria-label={`View ${p.title}`}
      aria-current={i === activeIndex ? 'true' : undefined}
    >
      <img
        src={p.image}
        alt=""
        className="h-full w-full object-cover"
        loading="lazy"
        draggable={false}
      />
    </button>
  )

  const scrubber = (
    <div
      data-gallery-scrubber
      className={[
        'z-[125] flex h-11 cursor-pointer touch-none items-center justify-center select-none rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400',
        isDesktop
          ? 'fixed bottom-[5.25rem] left-6 right-6'
          : 'fixed left-6 right-6 top-[10.25rem]',
      ].join(' ')}
      onPointerDown={onScrubPointerDown}
      onPointerMove={onScrubPointerMove}
      onPointerUp={onScrubPointerUp}
      onPointerCancel={onScrubPointerUp}
      onKeyDown={onScrubKeyDown}
      tabIndex={0}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(scrollProgress * 100)}
      aria-label="Scroll gallery images"
    >
      <div ref={trackRef} className="relative h-px w-full max-w-none bg-neutral-300 md:max-w-lg">
        <div
          className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-400"
          style={{ left: `${scrollProgress * 100}%` }}
          aria-hidden
        />
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile: full-bleed background behind gallery content */}
      <div
        className="fixed inset-x-0 top-20 bottom-24 z-[107] bg-white md:hidden"
        aria-hidden
      />

      {/* Desktop: fixed center main image */}
      <div className="pointer-events-none fixed inset-0 z-[110] hidden flex-col items-center justify-center px-6 pt-20 pb-28 md:flex">
        <div className="w-full max-w-[min(42vw,340px)] overflow-hidden rounded-sm bg-neutral-200 shadow-sm aspect-[3/4] max-h-[min(68vh,720px)]">
          <img
            key={active.id}
            src={active.image}
            alt={active.title}
            className="h-full w-full object-cover"
          />
        </div>
        <p className="pointer-events-none mt-4 max-w-[90vw] text-center text-[11px] font-medium uppercase tracking-wide text-neutral-600">
          {active.title}
          <span className="mx-2 text-neutral-400">/</span>
          {active.year}
        </p>
      </div>

      {/* Mobile: main image below scrubber */}
      <div className="fixed inset-x-0 top-[13.5rem] bottom-24 z-[108] flex flex-col items-center justify-center px-6 pb-4 pt-2 md:hidden">
        <div className="w-full max-w-[min(88vw,320px)] overflow-hidden rounded-md bg-neutral-200 aspect-[3/4] max-h-[min(52vh,480px)] shadow-sm">
          <img
            key={`mob-${active.id}`}
            src={active.image}
            alt={active.title}
            className="h-full w-full object-cover"
          />
        </div>
        <p className="mt-3 max-w-[90vw] text-center text-[11px] font-medium uppercase tracking-wide text-neutral-600">
          {active.title}
          <span className="mx-2 text-neutral-400">/</span>
          {active.year}
        </p>
      </div>

      {/* Thumbnail strip: horizontal (mobile) / vertical (desktop) */}
      {isDesktop ? (
        <div
          id="gallery-thumb-scroll"
          ref={scrollRef}
          data-lenis-prevent
          data-lenis-prevent-wheel
          data-lenis-prevent-touch
          className="gallery-thumb-scroll fixed left-6 top-20 z-[90] w-[120px] overflow-y-auto overflow-x-hidden overscroll-y-contain sm:w-[140px] md:w-[152px]"
          style={{
            bottom: '7rem',
            paddingTop: edgePad,
            paddingBottom: edgePad,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div className="flex flex-col gap-2.5">{projects.map((p, i) => thumbButton(p, i, false))}</div>
        </div>
      ) : (
        <div
          id="gallery-thumb-scroll"
          ref={scrollRef}
          data-lenis-prevent
          data-lenis-prevent-wheel
          data-lenis-prevent-touch
          className="gallery-thumb-scroll fixed left-0 right-0 top-20 z-[120] overflow-x-auto overflow-y-hidden overscroll-x-contain"
          style={{
            paddingLeft: edgePad,
            paddingRight: edgePad,
            paddingTop: '0.75rem',
            paddingBottom: '0.75rem',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div className="flex w-max flex-row gap-2.5">{projects.map((p, i) => thumbButton(p, i, true))}</div>
        </div>
      )}

      {scrubber}
    </>
  )
}

export default function Gallery() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  return (
    <>
      <div
        className="min-h-[calc(100dvh-10rem)] w-full bg-white"
        aria-hidden="true"
      />
      {mounted ? createPortal(<GalleryLayer />, document.body) : null}
    </>
  )
}
