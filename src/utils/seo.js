import { normalizePathname, pathToPage } from './routes.js'

const SECTION_TITLES = {
  work: 'Work',
  gallery: 'Selected',
  book: 'Book',
  about: 'Overview',
}

const DEFAULT_DESC =
  'Parmanand Ojha — visual designer & developer. Catalogue of works, selected projects, and book.'

export function applyDocumentMeta({ pathname }) {
  if (typeof document === 'undefined') return

  const page = pathToPage(pathname)
  const section = SECTION_TITLES[page] ?? 'Work'
  document.title = `${section} — Parmanand Ojha · Visual design & development`

  const origin = window.location.origin
  const path = normalizePathname(pathname)
  const canonicalPath = path === '/' ? '/work' : path
  const url = `${origin}${canonicalPath}`

  const setMeta = (attr, key, value) => {
    let el = document.querySelector(`meta[${attr}="${key}"]`)
    if (!el) {
      el = document.createElement('meta')
      el.setAttribute(attr, key)
      document.head.appendChild(el)
    }
    el.setAttribute('content', value)
  }

  setMeta('name', 'description', DEFAULT_DESC)
  setMeta('property', 'og:title', document.title)
  setMeta('property', 'og:description', DEFAULT_DESC)
  setMeta('property', 'og:type', 'website')
  setMeta('property', 'og:url', url)
  setMeta('property', 'og:image', `${origin}/og-image.svg`)
  setMeta('property', 'og:locale', 'en_US')
  setMeta('name', 'twitter:card', 'summary_large_image')
  setMeta('name', 'twitter:title', document.title)
  setMeta('name', 'twitter:description', DEFAULT_DESC)
  setMeta('name', 'twitter:image', `${origin}/og-image.svg`)

  let canonical = document.querySelector('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    document.head.appendChild(canonical)
  }
  canonical.href = url
}
