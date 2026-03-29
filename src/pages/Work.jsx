import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ProgressivePixelImage from '../components/ProgressivePixelImage.jsx'
import projects from '../data/projects.json'
import { getProjectImageEntries, getProjectPath } from '../utils/projects.js'

const WebGLHoverPreview = lazy(() => import('../components/WebGLHoverPreview.jsx'))

export default function Work({ onNavigateWithTransition }) {
  const navigate = useNavigate()
  const STEP = 8
  const BASE_LEN = projects.length
  const [visibleCount, setVisibleCount] = useState(Math.min(STEP, BASE_LEN))
  const [isLoading, setIsLoading] = useState(false)
  const [hoveredProject, setHoveredProject] = useState(null)
  const [hoveredKey, setHoveredKey] = useState(null)
  const [cursor, setCursor] = useState({
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
  })
  const sentinelRef = useRef(null)
  const catalogueHoverRootRef = useRef(null)
  const [canShowHoverPreview, setCanShowHoverPreview] = useState(false)

  const visibleProjects = useMemo(() => {
    return Array.from({ length: visibleCount }, (_, i) => projects[i % BASE_LEN])
  }, [visibleCount])

  useEffect(() => {
    const mqDesktop = window.matchMedia('(min-width: 768px)')
    const mqReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

    const syncCanPreview = () => {
      setCanShowHoverPreview(mqDesktop.matches && !mqReducedMotion.matches)
    }

    syncCanPreview()
    mqDesktop.addEventListener('change', syncCanPreview)
    mqReducedMotion.addEventListener('change', syncCanPreview)

    return () => {
      mqDesktop.removeEventListener('change', syncCanPreview)
      mqReducedMotion.removeEventListener('change', syncCanPreview)
    }
  }, [])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return

    const io = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (!first?.isIntersecting || isLoading) return

        setIsLoading(true)
        window.setTimeout(() => {
          setVisibleCount((c) => c + STEP)
          setIsLoading(false)
        }, 200)
      },
      { threshold: 0.1 }
    )

    io.observe(el)
    return () => io.disconnect()
  }, [isLoading])

  const clearCatalogueHover = () => {
    setHoveredKey(null)
    setHoveredProject(null)
  }

  /** WebGL preview is pointer-events-none, so hit-test still “sees” titles under it — use mouseout + relatedTarget instead of document.contains(target). */
  const onProjectTitleMouseOut = (e) => {
    const next = e.nativeEvent.relatedTarget
    if (next instanceof Node && e.currentTarget.contains(next)) return
    if (next instanceof Element) {
      const enterTitle = next.closest('[data-catalogue-project]')
      if (enterTitle && catalogueHoverRootRef.current?.contains(enterTitle)) return
    }
    clearCatalogueHover()
  }

  const sizes = [
    'text-[clamp(42px,6.5vw,96px)]',
    'text-[clamp(42px,6.5vw,96px)]',
    'text-[clamp(48px,7vw,102px)]',
    'text-[clamp(42px,6.5vw,96px)]',
    'text-[clamp(48px,7vw,102px)]',
    'text-[clamp(38px,5.8vw,92px)]',
    'text-[clamp(38px,5.8vw,92px)]',
    'text-[clamp(48px,7vw,102px)]',
    'text-[clamp(42px,6.5vw,96px)]',
    'text-[clamp(42px,6.5vw,96px)]',
  ]

  const goToProject = (project) => {
    const path = getProjectPath(project)
    if (onNavigateWithTransition) {
      onNavigateWithTransition(path)
      return
    }
    navigate(path)
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 md:max-w-[980px] md:px-6">
      {/* Mobile: single column — full-width image, centered title (reference layout) */}
      <div className="md:hidden">
        <div className="flex flex-col gap-14 pt-2 pb-4">
          {visibleProjects.map((p, i) => {
            const itemKey = `grid-${p.id}-${i}`
            const cover = getProjectImageEntries(p)[0]
            return (
              <article key={itemKey} className="w-full min-w-0">
                <button
                  type="button"
                  data-cursor="view"
                  onClick={() => goToProject(p)}
                  className="w-full text-left"
                >
                  <div className="w-full overflow-hidden rounded-none bg-[#e8e7de] shadow-none">
                    <ProgressivePixelImage
                      src={cover?.src ?? p.image}
                      alt={cover?.alt ?? `${p.title} cover`}
                      maxPixelDim={46}
                      imgClassName="h-full w-full object-cover"
                      loading={i < 2 ? 'eager' : 'lazy'}
                      fetchPriority={i === 0 ? 'high' : i === 1 ? 'low' : undefined}
                    />
                  </div>
                  <p className="mt-4 text-center font-body text-[15px] font-normal uppercase leading-snug tracking-[0.06em] text-[#8b864e] line-clamp-3">
                    {p.title}
                  </p>
                </button>
              </article>
            )
          })}
        </div>
      </div>

      {/* Desktop (md+): stacked list — hover/blur zone is shrink-wrapped to titles only */}
      <div className="hidden md:block">
        <div ref={catalogueHoverRootRef} className="mx-auto w-fit max-w-full">
          <div className="flex flex-col items-center select-none">
            {visibleProjects.map((p, i) => {
              const itemKey = `${p.id}-${i}`
              const isHoverTarget = hoveredKey === itemKey
              const blurNonTarget = hoveredKey != null && !isHoverTarget

              return (
                <button
                  key={itemKey}
                  type="button"
                  data-cursor="view"
                  data-catalogue-project
                  className={[
                    'm-0 border-0 bg-transparent p-0',
                    sizes[i] ?? sizes[sizes.length - 1],
                    'relative text-center uppercase text-[#7f7954] leading-[0.9] tracking-[-0.02em] whitespace-nowrap transition-[filter] duration-300 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7f7954]',
                    blurNonTarget ? 'blur-[5px] motion-reduce:blur-none' : 'blur-none',
                    isHoverTarget ? 'z-30' : 'z-0',
                  ].join(' ')}
                  onMouseEnter={() => {
                    setHoveredKey(itemKey)
                    setHoveredProject(p)
                  }}
                  onMouseOut={onProjectTitleMouseOut}
                  onMouseMove={(e) => setCursor({ x: e.clientX, y: e.clientY })}
                  onClick={() => goToProject(p)}
                >
                  {p.title}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div ref={sentinelRef} className="h-10 w-full" aria-hidden="true" />

      {canShowHoverPreview ? (
        <Suspense fallback={null}>
          <WebGLHoverPreview
            imageUrl={hoveredProject?.image}
            visible={Boolean(hoveredProject?.image)}
            cursor={cursor}
          />
        </Suspense>
      ) : null}
    </div>
  )
}
