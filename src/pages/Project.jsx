import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import ClothImage from '../components/ClothImage.jsx'
import ProjectNextCountdown from '../components/ProjectNextCountdown.jsx'
import { getLenis } from '../utils/lenisBridge.js'
import {
  getNextProjectBySlug,
  getProjectBySlug,
  getProjectImageEntries,
  getProjectPath,
} from '../utils/projects.js'

/**
 * Horizontal threshold line: this many viewport-heights up from the bottom edge.
 * When the Next Project block’s top crosses this line while scrolling down → next route.
 */
const NEXT_TRIGGER_FROM_BOTTOM_RATIO = 0.6

export default function Project({ slug, onBackWithTransition, onNavigateWithTransition }) {
  const navigate = useNavigate()
  const project = slug ? getProjectBySlug(slug) : null
  const imageEntries = project ? getProjectImageEntries(project) : []
  const nextProject = slug ? getNextProjectBySlug(slug) : null
  const nextFooterRef = useRef(null)
  const figuresWrapRef = useRef(null)
  const navigatedToNextRef = useRef(false)
  const lastFooterTopRef = useRef(null)
  const lastScrollRef = useRef(0)
  const countdownStartRef = useRef(null)
  const pointerRef = useRef({
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
  })
  const nextProjectRef = useRef(nextProject)
  const navigateToPathRef = useRef(null)

  const [countdownStart, setCountdownStartState] = useState(null)
  const [countdownProgress, setCountdownProgress] = useState(0)
  const [countdownPos, setCountdownPos] = useState({ x: 0, y: 0 })

  nextProjectRef.current = nextProject

  const navigateToPath = useCallback(
    (path) => {
      if (!path) return
      if (onNavigateWithTransition) {
        onNavigateWithTransition(path)
        return
      }
      navigate(path)
    },
    [navigate, onNavigateWithTransition]
  )

  navigateToPathRef.current = navigateToPath

  const setCountdownStart = useCallback((ts) => {
    countdownStartRef.current = ts
    setCountdownStartState(ts)
  }, [])

  const cancelNextCountdown = useCallback(() => {
    setCountdownStart(null)
    setCountdownProgress(0)
  }, [setCountdownStart])

  useEffect(() => {
    if (!project) return
    const lenis = getLenis()
    lenis?.scrollTo(0, { immediate: true })
  }, [slug, project])

  useEffect(() => {
    const onMove = (e) => {
      pointerRef.current = { x: e.clientX, y: e.clientY }
      if (countdownStartRef.current != null) {
        setCountdownPos({ x: e.clientX, y: e.clientY })
      }
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  useEffect(() => {
    if (countdownStart == null) {
      setCountdownProgress(0)
      return
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const durationMs = reduced ? 900 : 2800
    const start = countdownStart
    let rafId = 0

    const tick = (now) => {
      const t = Math.min(1, (now - start) / durationMs)
      setCountdownProgress(t)
      if (t >= 1) {
        const np = nextProjectRef.current
        if (np) {
          navigatedToNextRef.current = true
          navigateToPathRef.current?.(getProjectPath(np))
        }
        setCountdownStart(null)
        return
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [countdownStart, setCountdownStart])

  useEffect(() => {
    const root = document.documentElement
    if (countdownStart != null) {
      root.setAttribute('data-project-next-countdown', 'true')
    } else {
      root.removeAttribute('data-project-next-countdown')
    }
    return () => root.removeAttribute('data-project-next-countdown')
  }, [countdownStart])

  /* Scroll reveal — CSS transition + IO (double rAF so first paint keeps opacity:0 → transition runs) */
  useEffect(() => {
    if (!project) return
    const wrap = figuresWrapRef.current
    if (!wrap) return
    const figs = wrap.querySelectorAll('figure[data-project-scroll-reveal]')
    if (!figs.length) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      figs.forEach((f) => f.classList.add('is-revealed'))
      return
    }

    const reveal = (el) => {
      if (el.classList.contains('is-revealed')) return
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.classList.add('is-revealed')
        })
      })
    }

    let io = null
    const raf = requestAnimationFrame(() => {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return
            const t = entry.target
            io.unobserve(t)
            reveal(t)
          })
        },
        {
          root: null,
          rootMargin: '12% 0px -5% 0px',
          threshold: [0, 0.02, 0.06, 0.12],
        }
      )

      figs.forEach((f) => io.observe(f))
    })

    return () => {
      cancelAnimationFrame(raf)
      io?.disconnect()
    }
  }, [slug, project?.id, imageEntries.length])

  useEffect(() => {
    if (!project || !nextProject) return

    navigatedToNextRef.current = false
    lastFooterTopRef.current = null
    lastScrollRef.current = 0
    setCountdownStart(null)
    setCountdownProgress(0)

    let cancelled = false
    let unsubscribe = null
    let rafId = 0

    const thresholdY = () =>
      window.innerHeight * (1 - NEXT_TRIGGER_FROM_BOTTOM_RATIO)

    const attach = (attempt = 0) => {
      const lenis = getLenis()
      if (cancelled) return
      if (!lenis) {
        if (attempt < 95) {
          rafId = requestAnimationFrame(() => attach(attempt + 1))
        }
        return
      }

      lastScrollRef.current = lenis.scroll
      if (nextFooterRef.current) {
        lastFooterTopRef.current = nextFooterRef.current.getBoundingClientRect().top
      }

      unsubscribe = lenis.on('scroll', (l) => {
        if (cancelled || navigatedToNextRef.current) return
        const el = nextFooterRef.current
        if (!el) return

        const yLine = thresholdY()
        const top = el.getBoundingClientRect().top
        const prevTop = lastFooterTopRef.current
        const scrollDown = l.scroll > lastScrollRef.current + 0.25
        lastScrollRef.current = l.scroll

        if (countdownStartRef.current != null) {
          if (top > yLine + 50) {
            setCountdownStart(null)
          }
          lastFooterTopRef.current = top
          return
        }

        const crossedDown =
          scrollDown &&
          prevTop != null &&
          prevTop > yLine &&
          top <= yLine

        const nearBottom =
          scrollDown &&
          Number.isFinite(l.limit) &&
          l.scroll >= Math.max(0, l.limit - 6)

        if (crossedDown || nearBottom) {
          setCountdownPos({ ...pointerRef.current })
          setCountdownStart(performance.now())
          lastFooterTopRef.current = top
          return
        }

        lastFooterTopRef.current = top
      })
    }

    rafId = requestAnimationFrame(() => attach(0))

    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
      unsubscribe?.()
    }
  }, [slug, project, nextProject, setCountdownStart])

  if (!slug || !project) {
    return <Navigate to="/catalogued-works" replace />
  }

  return (
    <>
    <article className="mx-auto w-full max-w-[1800px] px-5 pb-24 pt-8 md:px-8 md:pb-32 md:pt-12">
      <header className="mb-10 max-w-3xl md:mb-14">
        <button
          type="button"
          onClick={() => {
            if (onBackWithTransition) {
              onBackWithTransition()
              return
            }
            navigate(-1)
          }}
          className="link-underline-ltr mb-6 text-nav font-normal uppercase text-gray-900"
        >
          Back
        </button>
        <p className="text-caption font-normal uppercase tracking-[0.2em] text-neutral-500 md:text-caption-md">
          {project.year}
        </p>
        <h1 className="mt-2 display-condensed text-[clamp(2.5rem,8vw,4.5rem)] font-medium uppercase leading-none tracking-tight text-gray-900">
          {project.title}
        </h1>
        {project.description ? (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-neutral-600 md:text-base">
            {project.description}
          </p>
        ) : null}
        {project.tags?.length ? (
          <ul className="mt-4 flex flex-wrap gap-2 text-caption uppercase tracking-wide text-neutral-500 md:text-caption-md">
            {project.tags.map((t) => (
              <li
                key={t}
                className="after:pl-2 after:text-neutral-300 after:content-['/'] last:after:hidden"
              >
                {t}
              </li>
            ))}
          </ul>
        ) : null}
      </header>

      <div
        ref={figuresWrapRef}
        className="flex flex-col gap-6 md:gap-8 lg:gap-10"
      >
        {imageEntries.map((entry, i) => (
          <figure
            key={`${project.id}-${i}`}
            data-project-scroll-reveal
            className="project-figure-reveal w-full overflow-hidden bg-[#e8e7de]"
          >
            <ClothImage
              src={entry.src}
              alt={entry.alt}
              variant="intrinsic"
              maxPixelDim={66}
              imgClassName="h-auto w-full object-cover"
              loading={i < 2 ? 'eager' : 'lazy'}
              fetchPriority={i === 0 ? 'high' : i === 1 ? 'low' : undefined}
              decoding="async"
            />
          </figure>
        ))}
      </div>

      {nextProject ? (
        <footer
          ref={nextFooterRef}
          className="mt-20 border-t border-neutral-200 pt-12 pb-8 text-center md:mt-24 md:pt-16"
        >
          <p className="text-caption font-normal uppercase tracking-[0.2em] text-neutral-400 md:text-caption-md">
            Next project
          </p>
          <button
            type="button"
            data-cursor="view"
            onClick={() => {
              cancelNextCountdown()
              navigatedToNextRef.current = true
              navigateToPath(getProjectPath(nextProject))
            }}
            className="link-underline-ltr mt-3 text-nav font-normal uppercase text-gray-900"
          >
            {nextProject.title}
          </button>
        </footer>
      ) : (
        <footer className="mt-20 border-t border-neutral-200 pt-12 pb-8 text-center md:mt-24 md:pt-16">
          <p className="text-caption uppercase tracking-[0.2em] text-neutral-400 md:text-caption-md">
            End of catalogue
          </p>
          <button
            type="button"
            data-cursor="view"
            onClick={() => navigateToPath('/catalogued-works')}
            className="link-underline-ltr mt-3 text-nav font-normal uppercase text-gray-900"
          >
            Back to catalogued works
          </button>
        </footer>
      )}
    </article>
    {nextProject ? (
      <ProjectNextCountdown
        open={countdownStart != null}
        progress={countdownProgress}
        x={countdownPos.x}
        y={countdownPos.y}
        onCancel={cancelNextCountdown}
        nextTitle={nextProject.title}
      />
    ) : null}
    </>
  )
}
