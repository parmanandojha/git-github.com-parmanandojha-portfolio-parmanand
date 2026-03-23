import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Nav from './components/Nav.jsx'
import Footer from './components/Footer.jsx'
import Work from './pages/Work.jsx'
import About from './pages/About.jsx'
import Gallery from './pages/Gallery.jsx'
import Book from './pages/Book.jsx'
import Project from './pages/Project.jsx'
import { createPixelGrid, runPageTransition } from './utils/pixelTransition.js'
import { useLocomotiveScroll } from './hooks/useLocomotiveScroll.js'
import {
  isKnownPath,
  LEGACY_TO_CANONICAL,
  normalizePathname,
  pageToPath,
  pathToPage,
} from './utils/routes.js'
import { applyDocumentMeta } from './utils/seo.js'

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const page = pathToPage(location.pathname)
  const projectSlugMatch = location.pathname.match(/^\/project\/([^/]+)\/?$/)
  const projectSlug = projectSlugMatch?.[1] ?? null
  const [isTransitioning, setIsTransitioning] = useState(false)
  const transitionTimelineRef = useRef(null)
  const pathnameRef = useRef(location.pathname)
  pathnameRef.current = location.pathname
  const locoRef = useLocomotiveScroll([page, isTransitioning])

  useEffect(() => {
    const path = normalizePathname(location.pathname)
    const upgraded = LEGACY_TO_CANONICAL[path]
    if (upgraded) {
      navigate(upgraded, { replace: true })
      return
    }
    if (path === '/') {
      navigate('/catalogued-works', { replace: true })
      return
    }
    if (!isKnownPath(location.pathname)) {
      navigate('/catalogued-works', { replace: true })
    }
  }, [location.pathname, navigate])

  useEffect(() => {
    applyDocumentMeta({ pathname: location.pathname })
  }, [location.pathname])

  useEffect(() => {
    const TAB_AWAY_TITLE = 'It was good to see you!'

    const onVisibility = () => {
      if (document.hidden) {
        document.title = TAB_AWAY_TITLE
      } else {
        applyDocumentMeta({ pathname: pathnameRef.current })
      }
    }

    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  const handlePageChange = (nextPage) => {
    const nextPath = pageToPath(nextPage)
    if (nextPath === normalizePathname(location.pathname) || isTransitioning) return

    transitionTimelineRef.current?.kill()
    setIsTransitioning(true)
    createPixelGrid()

    transitionTimelineRef.current = runPageTransition({
      onCovered: () => {
        navigate(nextPath)
      },
      onComplete: () => {
        setIsTransitioning(false)
        transitionTimelineRef.current = null
        requestAnimationFrame(() => {
          locoRef.current?.resize()
        })
      },
    })
  }

  useEffect(() => {
    createPixelGrid()
    return () => {
      transitionTimelineRef.current?.kill()
    }
  }, [])

  useEffect(() => {
    const loco = locoRef.current
    if (!loco) return
    if (page === 'gallery') {
      loco.stop()
    } else {
      loco.start()
    }
  }, [page])

  return (
    <div className="flex min-h-screen flex-col bg-white font-normal">
      {page !== 'book' ? <Nav /> : null}

      <main
        className={
          page === 'book'
            ? 'flex-1 p-0'
            : page === 'gallery'
              ? 'flex-1 min-h-0 overflow-hidden p-0'
              : 'flex-1 pb-44 md:pb-40'
        }
      >
        {page === 'project' && projectSlug ? (
          <Project slug={projectSlug} />
        ) : page === 'work' ? (
          <Work />
        ) : page === 'gallery' ? (
          <Gallery />
        ) : page === 'book' ? (
          <Book />
        ) : (
          <About />
        )}
      </main>

      <Footer
        page={page}
        onChangePage={handlePageChange}
        isTransitioning={isTransitioning}
      />
      <div
        className={[
          'fixed inset-0 z-[200] pointer-events-none',
          isTransitioning ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
      >
        <div id="pixel-grid" className="h-full w-full grid bg-transparent" />
      </div>
    </div>
  )
}
