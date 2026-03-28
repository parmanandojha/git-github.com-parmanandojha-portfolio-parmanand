import { useEffect, useRef } from 'react'
import Lenis from 'lenis'
import { registerLenis, unregisterLenis } from '../utils/lenisBridge.js'

/**
 * Lenis smooth scroll — instantiated once in App, resize() called on route/layout changes.
 */
export function useLenis(resizeDeps = []) {
  const instanceRef = useRef(null)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const lenis = new Lenis({
      lerp: reducedMotion ? 1 : 0.08,
      smoothWheel: !reducedMotion,
      wheelMultiplier: 1,
      touchMultiplier: 1.65,
      allowNestedScroll: true,
    })

    instanceRef.current = lenis
    registerLenis(lenis)

    /* Drive Lenis with its own RAF loop */
    let rafId
    const raf = (time) => {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      unregisterLenis()
      lenis.destroy()
      instanceRef.current = null
    }
  }, [])

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      instanceRef.current?.resize()
    })
    return () => cancelAnimationFrame(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resizeDeps)

  return instanceRef
}
