import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Nav from './components/Nav.jsx'
import Footer from './components/Footer.jsx'
import Work from './pages/Work.jsx'
import About from './pages/About.jsx'
import Gallery from './pages/Gallery.jsx'
import Book from './pages/Book.jsx'
import { createPixelGrid, runPageTransition } from './utils/pixelTransition.js'
import { useLocomotiveScroll } from './hooks/useLocomotiveScroll.js'
import {
  isKnownPath,
  normalizePathname,
  pageToPath,
  pathToPage,
} from './utils/routes.js'
import { applyDocumentMeta } from './utils/seo.js'

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const page = pathToPage(location.pathname)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const transitionTimelineRef = useRef(null)
  const locoRef = useLocomotiveScroll([page, isTransitioning])

  useEffect(() => {
    const path = normalizePathname(location.pathname)
    if (path === '/') {
      navigate('/work', { replace: true })
      return
    }
    if (!isKnownPath(location.pathname)) {
      navigate('/work', { replace: true })
    }
  }, [location.pathname, navigate])

  useEffect(() => {
    applyDocumentMeta({ pathname: location.pathname })
  }, [location.pathname])

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
        {page === 'work' ? (
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
