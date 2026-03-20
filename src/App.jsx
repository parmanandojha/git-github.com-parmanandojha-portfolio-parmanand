import { useEffect, useRef, useState } from 'react'
import Nav from './components/Nav.jsx'
import Footer from './components/Footer.jsx'
import Work from './pages/Work.jsx'
import About from './pages/About.jsx'
import Gallery from './pages/Gallery.jsx'
import Book from './pages/Book.jsx'
import { createPixelGrid, runPageTransition } from './utils/pixelTransition.js'
import { useLocomotiveScroll } from './hooks/useLocomotiveScroll.js'

export default function App() {
  const [page, setPage] = useState('work')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const transitionTimelineRef = useRef(null)
  const locoRef = useLocomotiveScroll([page, isTransitioning])

  const handlePageChange = (nextPage) => {
    if (nextPage === page || isTransitioning) return

    transitionTimelineRef.current?.kill()
    setIsTransitioning(true)
    createPixelGrid()

    transitionTimelineRef.current = runPageTransition({
      onCovered: () => {
        setPage(nextPage)
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

  // Gallery uses its own scroll column; pause Lenis so wheel/touch isn’t captured globally
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
      <Nav />

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
