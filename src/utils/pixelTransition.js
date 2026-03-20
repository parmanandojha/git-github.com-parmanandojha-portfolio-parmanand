import { gsap } from 'gsap'

/** Fewer columns = larger square pixels (matches Tailwind `md` breakpoint) */
function getPixelCols() {
  if (typeof window === 'undefined') return 7
  return window.matchMedia('(max-width: 767px)').matches ? 4 : 7
}

export function createPixelGrid() {
  const grid = document.getElementById('pixel-grid')
  if (!grid) return

  const cols = getPixelCols()
  const viewportW = window.innerWidth
  const viewportH = window.innerHeight
  const cellSize = Math.ceil(viewportW / cols)
  const rows = Math.ceil(viewportH / cellSize)

  grid.innerHTML = ''
  grid.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`
  grid.style.gridTemplateRows = `repeat(${rows}, ${cellSize}px)`

  for (let i = 0; i < rows * cols; i += 1) {
    const pixel = document.createElement('div')
    pixel.className = 'bg-black scale-0 origin-center'
    grid.appendChild(pixel)
  }
}

/**
 * GSAP timeline:
 * 1) Pixels scale in until the screen is fully covered
 * 2) onCovered() runs (e.g. React setState for new page)
 * 3) Short pause so the new page can paint
 * 4) Pixels scale out smoothly
 */
export function runPageTransition({ onCovered, onComplete }) {
  const pixels = document.querySelectorAll('#pixel-grid div')

  if (!pixels.length) {
    onCovered?.()
    onComplete?.()
    return null
  }

  gsap.set(pixels, { scale: 0, transformOrigin: 'center center' })

  /** Random start offset per pixel so squares appear scattered, not in order */
  const randomStaggerIn = () => Math.random() * 0.62
  const randomDurationIn = () => 0.42 + Math.random() * 0.28

  const randomStaggerOut = () => Math.random() * 0.55
  const randomDurationOut = () => 0.38 + Math.random() * 0.22

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    onComplete: onComplete,
  })

  // 1 — Cover: each block scales in at a random time until full screen is filled
  tl.to(pixels, {
    scale: 1,
    duration: randomDurationIn,
    ease: 'power2.out',
    stagger: randomStaggerIn,
  })

  // 2 — Page swap only after cover animation completes
  tl.add(() => {
    onCovered?.()
  })

  // 3 — Let React commit + paint new content behind the mask
  tl.to(
    {},
    {
      duration: 0.12,
      ease: 'none',
    }
  )

  // 4 — Reveal: random scatter out
  tl.to(pixels, {
    scale: 0,
    duration: randomDurationOut,
    ease: 'power2.inOut',
    stagger: randomStaggerOut,
  })

  return tl
}
