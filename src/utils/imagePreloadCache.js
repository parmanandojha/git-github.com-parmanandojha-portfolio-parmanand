/**
 * In-memory map of decoded images from SitePreloader + any later loads.
 * Same URL → reuse HTMLImageElement for LQIP canvas + Three.js textures (no second decode).
 */

const byKey = new Map()

export function normalizeImageSrc(src) {
  if (!src || typeof src !== 'string') return ''
  if (typeof window === 'undefined') return src.trim()
  try {
    return new URL(src, window.location.origin).href
  } catch {
    return src.trim()
  }
}

export function registerPreloadedImage(src, img) {
  const key = normalizeImageSrc(src)
  if (!key || !img || !(img instanceof HTMLImageElement)) return
  if (!img.complete || img.naturalHeight <= 0) return
  byKey.set(key, img)
}

/** Returns the shared Image if already decoded (preloader or prior page). */
export function getPreloadedHtmlImage(src) {
  const key = normalizeImageSrc(src)
  if (!key) return null
  const img = byKey.get(key)
  if (img?.complete && img.naturalHeight > 0) return img
  return null
}
