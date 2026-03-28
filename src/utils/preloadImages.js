import projects from '../data/projects.json'
import { registerPreloadedImage } from './imagePreloadCache.js'
import { getProjectImages } from './projects.js'

/** Resolve a single image URL; failures still resolve so the UI never hangs. */
function preloadOne(src) {
  if (!src || typeof src !== 'string') return Promise.resolve()
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      registerPreloadedImage(src, img)
      resolve()
    }
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

/** Cover thumbnails only (legacy / small sets). */
export function getProjectCoverImageUrls() {
  return projects.map((p) => p.image).filter(Boolean)
}

/** Every unique project asset — cover + all `images[]` per project (preloader background load). */
export function getAllSiteImageUrls() {
  const set = new Set()
  for (const p of projects) {
    for (const url of getProjectImages(p)) {
      if (url && typeof url === 'string') set.add(url)
    }
  }
  return [...set]
}
