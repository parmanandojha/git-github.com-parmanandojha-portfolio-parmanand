/** Canonical paths — match footer / nav labels (slug form). */
export const PAGE_PATHS = {
  work: '/catalogued-works',
  gallery: '/selected',
  book: '/book',
  about: '/overview',
}

/** Old URLs → new (bookmark / external links). */
export const LEGACY_TO_CANONICAL = {
  '/work': '/catalogued-works',
  '/gallery': '/selected',
  '/about': '/overview',
}


export function normalizePathname(pathname) {
  const p = (pathname || '/').replace(/\/+$/, '') || '/'
  return p === '/' ? '/' : p
}

export function canonicalizePathname(pathname) {
  const p = normalizePathname(pathname)
  if (p === '/') return '/catalogued-works'
  return LEGACY_TO_CANONICAL[p] ?? p
}

export function pathToPage(pathname) {
  const p = normalizePathname(pathname)
  if (p.startsWith('/project/') && p.length > '/project/'.length) return 'project'
  if (p === '/selected' || p === '/gallery') return 'gallery'
  if (p === '/book') return 'book'
  if (p === '/overview' || p === '/about') return 'about'
  if (p === '/catalogued-works' || p === '/work') return 'work'
  return 'notfound'
}

export function pageToPath(page) {
  return PAGE_PATHS[page] ?? '/catalogued-works'
}
