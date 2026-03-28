/**
 * Global Lenis instance — shared without prop-drilling.
 * Used by pages that need to read scroll state (e.g. Project page overscroll detection).
 */
let lenisInstance = null

export function registerLenis(instance) {
  lenisInstance = instance
}

export function unregisterLenis() {
  lenisInstance = null
}

/** Direct Lenis instance for smooth page scroll. */
export function getLenis() {
  return lenisInstance
}
