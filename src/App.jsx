import { useEffect, useRef, useState } from 'react'
import Nav from './components/Nav.jsx'
import Footer from './components/Footer.jsx'
import Work from './pages/Work.jsx'
import About from './pages/About.jsx'
import Gallery from './pages/Gallery.jsx'
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
    <div className="min-h-screen flex flex-col bg-white">
      <Nav page={page} onChangePage={handlePageChange} isTransitioning={isTransitioning} />

      <main className="flex-1 pb-24">
        {page === 'work' ? (
          <Work />
        ) : page === 'gallery' ? (
          <Gallery />
        ) : (
          <About />
        )}
      </main>

      <Footer />
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
