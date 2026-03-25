import projects from '../data/projects.json'

/** Resolve a single image URL; failures still resolve so the UI never hangs. */
function preloadOne(src) {
  if (!src || typeof src !== 'string') return Promise.resolve()
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => resolve()
    img.src = src
  })
}

/**
 * @param {string[]} urls
 * @param {{ onProgress?: (ratio: number) => void }} [options] — `ratio` in 0..1 after each URL settles
 */
export function preloadImages(urls, options = {}) {
  const { onProgress } = options
  const unique = [...new Set(urls.filter(Boolean))]
  const total = unique.length
  if (total === 0) {
    onProgress?.(1)
    return Promise.resolve()
  }
  let done = 0
  const bump = () => {
    done += 1
    onProgress?.(done / total)
  }
  return Promise.all(unique.map((src) => preloadOne(src).then(bump)))
}

/** Cover thumbnails used on Work / Gallery — safe first-load set. */
export function getProjectCoverImageUrls() {
  return projects.map((p) => p.image).filter(Boolean)
}
