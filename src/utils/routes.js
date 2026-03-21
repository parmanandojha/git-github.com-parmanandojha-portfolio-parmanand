/** Canonical paths for each app section (shareable URLs). */
export const PAGE_PATHS = {
  work: '/work',
  gallery: '/gallery',
  book: '/book',
  about: '/about',
}

const KNOWN = new Set(['/', '/work', '/gallery', '/book', '/about'])

export function normalizePathname(pathname) {
  const p = (pathname || '/').replace(/\/+$/, '') || '/'
  return p === '/' ? '/' : p
}

export function pathToPage(pathname) {
  const p = normalizePathname(pathname)
  if (p === '/gallery') return 'gallery'
  if (p === '/book') return 'book'
  if (p === '/about') return 'about'
  return 'work'
}

export function pageToPath(page) {
  return PAGE_PATHS[page] ?? '/work'
}

export function isKnownPath(pathname) {
  return KNOWN.has(normalizePathname(pathname))
}
