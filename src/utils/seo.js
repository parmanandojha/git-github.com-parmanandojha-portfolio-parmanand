import { canonicalizePathname, normalizePathname, pathToPage } from './routes.js'
import { getProjectBySlug } from './projects.js'

const DEFAULT_DESC =
  'Parmanand Ojha — visual designer & developer. Catalogue of works, selected projects, and book.'

function sectionTitleForPage(page) {
  const y = String(new Date().getFullYear()).slice(-2)
  switch (page) {
    case 'work':
      return 'Catalogued works'
    case 'gallery':
      return 'Selected'
    case 'book':
      return `Book ${y}`
    case 'about':
      return 'Overview'
    case 'notfound':
      return '404'
    default:
      return 'Catalogued works'
  }
}

export function applyDocumentMeta({ pathname }) {
  if (typeof document === 'undefined') return

  const page = pathToPage(pathname)
  const projectMatch = pathname.match(/^\/project\/([^/]+)\/?$/)
  const project = projectMatch?.[1] ? getProjectBySlug(projectMatch[1]) : null

  const section =
    project != null
      ? project.title
      : sectionTitleForPage(page)
  document.title = `${section} — Parmanand Ojha · Visual design & development`

  const origin = window.location.origin
  const canonicalPath =
    projectMatch?.[1] != null
      ? normalizePathname(pathname)
      : canonicalizePathname(pathname)
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
