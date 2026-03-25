import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import WebGLHoverPreview from '../components/WebGLHoverPreview.jsx'
import projects from '../data/projects.json'
import { getProjectPath } from '../utils/projects.js'

export default function Work() {
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

  const visibleProjects = useMemo(() => {
    return Array.from({ length: visibleCount }, (_, i) => projects[i % BASE_LEN])
  }, [visibleCount])

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

  return (
    <div className="w-full max-w-[1600px] px-4 py-6 mx-auto md:max-w-[980px] md:px-6">
      {/* Mobile: grid of project cards */}
      <div className="md:hidden">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {visibleProjects.map((p, i) => {
            const itemKey = `grid-${p.id}-${i}`
            return (
              <article key={itemKey} className="min-w-0">
                <button
                  type="button"
                  onClick={() => navigate(getProjectPath(p))}
                  className="w-full text-left"
                >
                  <div className="w-full aspect-[4/5] overflow-hidden bg-[#e8e7de]">
                    <img
                      src={p.image}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <p className="catalogue-project-title mt-2 text-center text-[13px] sm:text-[14px] uppercase leading-tight text-[#7f7954] line-clamp-2">
                    {p.title}
                  </p>
                </button>
              </article>
            )
          })}
        </div>
      </div>

      {/* Desktop (md+): stacked list + WebGL hover */}
      <div className="hidden md:block">
        <div className="flex flex-col items-center select-none">
          {visibleProjects.map((p, i) => {
            const itemKey = `${p.id}-${i}`

            return (
              <button
                key={itemKey}
                type="button"
                className={[
                  'catalogue-project-title m-0 cursor-pointer border-0 bg-transparent p-0',
                  sizes[i] ?? sizes[sizes.length - 1],
                  'relative text-center uppercase text-[#7f7954] leading-[0.9] tracking-[-0.02em] whitespace-nowrap',
                  hoveredKey === itemKey ? 'z-30' : 'z-0',
                ].join(' ')}
                onMouseEnter={() => {
                  setHoveredKey(itemKey)
                  setHoveredProject(p)
                }}
                onMouseLeave={() => {
                  setHoveredKey(null)
                  setHoveredProject(null)
                }}
                onMouseMove={(e) => setCursor({ x: e.clientX, y: e.clientY })}
                onClick={() => navigate(getProjectPath(p))}
              >
                {p.title}
              </button>
            )
          })}
        </div>
      </div>

      <div ref={sentinelRef} className="h-10 w-full" aria-hidden="true" />

      <WebGLHoverPreview
        imageUrl={hoveredProject?.image}
        visible={Boolean(hoveredProject?.image)}
        cursor={cursor}
      />
    </div>
  )
}
