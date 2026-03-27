import { useEffect, useRef } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { getLenis } from '../utils/locomotiveBridge.js'
import {
  getNextProjectBySlug,
  getProjectBySlug,
  getProjectImages,
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
  const images = project ? getProjectImages(project) : []
  const nextProject = slug ? getNextProjectBySlug(slug) : null
  const nextFooterRef = useRef(null)
  const navigatedToNextRef = useRef(false)
  const lastFooterTopRef = useRef(null)
  const lastScrollRef = useRef(0)
  const navigateToPath = (path) => {
    if (!path) return
    if (onNavigateWithTransition) {
      onNavigateWithTransition(path)
      return
    }
    navigate(path)
  }

  useEffect(() => {
    if (!project) return
    const lenis = getLenis()
    lenis?.scrollTo(0, { immediate: true })
  }, [slug, project])

  useEffect(() => {
    if (!project || !nextProject) return

    navigatedToNextRef.current = false
    lastFooterTopRef.current = null
    lastScrollRef.current = 0

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
          navigatedToNextRef.current = true
          navigateToPath(getProjectPath(nextProject))
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
  }, [slug, project, nextProject, navigate, onNavigateWithTransition])

  if (!slug || !project) {
    return <Navigate to="/catalogued-works" replace />
  }

  return (
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

      <div className="flex flex-col gap-6 md:gap-8 lg:gap-10">
        {images.map((src, i) => (
          <figure
            key={`${project.id}-${i}`}
            className="w-full overflow-hidden bg-[#e8e7de]"
          >
            <img
              src={src}
              alt={`${project.title} — ${i + 1}`}
              className="h-auto w-full object-cover"
              loading={i < 2 ? 'eager' : 'lazy'}
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
            onClick={() => navigateToPath(getProjectPath(nextProject))}
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
            onClick={() => navigateToPath('/catalogued-works')}
            className="link-underline-ltr mt-3 text-nav font-normal uppercase text-gray-900"
          >
            Back to catalogued works
          </button>
        </footer>
      )}
    </article>
  )
}
