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
    const loco = new LocomotiveScroll({
      lenisOptions: {
        lerp: 0.08,
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.5,
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
