import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Nav from './components/Nav.jsx'
import Footer from './components/Footer.jsx'
import SitePreloader from './components/SitePreloader.jsx'
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

const Work = lazy(() => import('./pages/Work.jsx'))
const About = lazy(() => import('./pages/About.jsx'))
const Gallery = lazy(() => import('./pages/Gallery.jsx'))
const Book = lazy(() => import('./pages/Book.jsx'))
const Project = lazy(() => import('./pages/Project.jsx'))

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const [siteImagesReady, setSiteImagesReady] = useState(false)
  const onPreloaderComplete = useCallback(() => setSiteImagesReady(true), [])
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

  const startTransition = useCallback(
    (onCovered) => {
      if (isTransitioning) return false
      transitionTimelineRef.current?.kill()
      setIsTransitioning(true)
      createPixelGrid()

      transitionTimelineRef.current = runPageTransition({
        onCovered,
        onComplete: () => {
          setIsTransitioning(false)
          transitionTimelineRef.current = null
          requestAnimationFrame(() => {
            locoRef.current?.resize()
          })
        },
      })
      return true
    },
    [isTransitioning, locoRef]
  )

  const handlePathChange = (nextPath) => {
    if (nextPath === normalizePathname(location.pathname)) return
    startTransition(() => navigate(nextPath))
  }

  const handlePageChange = (nextPage) => {
    handlePathChange(pageToPath(nextPage))
  }

  const handleBackWithTransition = useCallback(() => {
    startTransition(() => navigate(-1))
  }, [navigate, startTransition])

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
    <div className="flex min-h-screen flex-col bg-canvas font-normal">
      {!siteImagesReady ? <SitePreloader onComplete={onPreloaderComplete} /> : null}
      {page !== 'book' ? (
        <Nav onChangePage={handlePageChange} isTransitioning={isTransitioning} />
      ) : null}

      <main
        className={
          page === 'book'
            ? 'flex-1 p-0'
            : page === 'gallery'
              ? 'flex-1 min-h-0 overflow-hidden p-0'
              : 'flex-1 pb-44 md:pb-40'
        }
      >
        <Suspense fallback={<div className="h-full w-full" aria-hidden="true" />}>
          {page === 'project' && projectSlug ? (
            <Project slug={projectSlug} onBackWithTransition={handleBackWithTransition} />
          ) : page === 'work' ? (
            <Work onNavigateWithTransition={handlePathChange} />
          ) : page === 'gallery' ? (
            <Gallery />
          ) : page === 'book' ? (
            <Book />
          ) : (
            <About />
          )}
        </Suspense>
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
