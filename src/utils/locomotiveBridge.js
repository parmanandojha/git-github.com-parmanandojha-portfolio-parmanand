/**
 * Single LocomotiveScroll instance from App — used to read Lenis scroll state
 * (e.g. bottom overscroll → next project) without prop-drilling.
 */
let locomotiveInstance = null

export function registerLocomotiveScroll(instance) {
  locomotiveInstance = instance
}

export function unregisterLocomotiveScroll() {
  locomotiveInstance = null
}

/** Lenis instance used by Locomotive Scroll (smooth page scroll). */
export function getLenis() {
  return locomotiveInstance?.lenisInstance ?? null
}
