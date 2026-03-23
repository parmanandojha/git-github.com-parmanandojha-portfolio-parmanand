import { useEffect, useRef } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { getLenis } from '../utils/locomotiveBridge.js'
import {
  getNextProjectBySlug,
  getProjectBySlug,
  getProjectImages,
  getProjectPath,
} from '../utils/projects.js'

/** Wheel / touch delta needed past page bottom before going to next project */
const OVERSCROLL_DELTA_TO_NEXT = 140
const BOTTOM_TOLERANCE_PX = 16

export default function Project({ slug }) {
  const navigate = useNavigate()
  const project = slug ? getProjectBySlug(slug) : null
  const images = project ? getProjectImages(project) : []
  const nextProject = slug ? getNextProjectBySlug(slug) : null
  const overscrollRef = useRef(0)

  useEffect(() => {
    if (!project) return
    const lenis = getLenis()
    lenis?.scrollTo(0, { immediate: true })
  }, [slug, project])

  useEffect(() => {
    if (!project || !nextProject) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let cancelled = false
    let unsubscribe = null
    let rafId = 0

    const attach = (attempt = 0) => {
      const lenis = getLenis()
      if (cancelled) return
      if (!lenis) {
        if (attempt < 90) {
          rafId = requestAnimationFrame(() => attach(attempt + 1))
        }
        return
      }

      unsubscribe = lenis.on('virtual-scroll', ({ deltaY }) => {
        const limit = lenis.limit
        if (limit <= 0) return

        const pos = lenis.targetScroll
        const atBottom = pos >= limit - BOTTOM_TOLERANCE_PX

        if (deltaY < 0) {
          overscrollRef.current = 0
          return
        }
        if (!atBottom) {
          overscrollRef.current = 0
          return
        }

        overscrollRef.current += deltaY
        if (overscrollRef.current >= OVERSCROLL_DELTA_TO_NEXT) {
          overscrollRef.current = 0
          navigate(getProjectPath(nextProject))
        }
      })
    }

    rafId = requestAnimationFrame(() => attach(0))

    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
      overscrollRef.current = 0
      unsubscribe?.()
    }
  }, [slug, project, nextProject, navigate])

  if (!slug || !project) {
    return <Navigate to="/catalogued-works" replace />
  }

  return (
    <article className="mx-auto w-full max-w-[1400px] px-5 pb-24 pt-8 md:px-8 md:pb-32 md:pt-12">
      <header className="mb-10 max-w-3xl md:mb-14">
        <button
          type="button"
          onClick={() => navigate(-1)}
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
            className="w-full overflow-hidden bg-neutral-100"
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
        <footer className="mt-20 border-t border-neutral-200 pt-12 pb-8 text-center md:mt-24 md:pt-16">
          <p className="text-caption font-normal uppercase tracking-[0.2em] text-neutral-400 md:text-caption-md">
            Next project
          </p>
          <button
            type="button"
            onClick={() => navigate(getProjectPath(nextProject))}
            className="link-underline-ltr mt-3 text-nav font-normal uppercase text-gray-900"
          >
            {nextProject.title}
          </button>
          <p className="mx-auto mt-4 max-w-sm text-caption leading-relaxed text-neutral-500 md:text-caption-md">
            Keep scrolling past the end of this page to open the next project.
          </p>
        </footer>
      ) : (
        <footer className="mt-20 border-t border-neutral-200 pt-12 pb-8 text-center md:mt-24 md:pt-16">
          <p className="text-caption uppercase tracking-[0.2em] text-neutral-400 md:text-caption-md">
            End of catalogue
          </p>
          <button
            type="button"
            onClick={() => navigate('/catalogued-works')}
            className="link-underline-ltr mt-3 text-nav font-normal uppercase text-gray-900"
          >
            Back to catalogued works
          </button>
        </footer>
      )}
    </article>
  )
}
