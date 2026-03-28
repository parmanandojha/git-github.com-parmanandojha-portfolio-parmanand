import { useEffect, useRef } from 'react'
import LocomotiveScroll from 'locomotive-scroll'
import {
  registerLocomotiveScroll,
  unregisterLocomotiveScroll,
} from '../utils/locomotiveBridge.js'

/**
 * Locomotive Scroll v5 (Lenis-based) — smooth scrolling for the page.
 * Call resize() when content height changes (route change, async layout).
 */
export function useLocomotiveScroll(resizeDeps = []) {
  const instanceRef = useRef(null)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const loco = new LocomotiveScroll({
      lenisOptions: {
        lerp: reducedMotion ? 1 : 0.08,
        smoothWheel: !reducedMotion,
        wheelMultiplier: 1,
        touchMultiplier: 1.65,
        /** Wheel/trackpad over `overflow: auto` regions (e.g. Book, gallery thumbs) scrolls them instead of only the page. */
        allowNestedScroll: true,
      },
    })

    instanceRef.current = loco
    registerLocomotiveScroll(loco)

    return () => {
      unregisterLocomotiveScroll()
      loco.destroy()
      instanceRef.current = null
    }
  }, [])

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      instanceRef.current?.resize()
    })
    return () => cancelAnimationFrame(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: resize when deps change
  }, resizeDeps)

  return instanceRef
}
