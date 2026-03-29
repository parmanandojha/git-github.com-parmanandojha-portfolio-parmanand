import projects from '../data/projects.json'

function normalizeImageItem(item, project, index) {
  if (typeof item === 'string') {
    return {
      src: item,
      alt: `${project.title} — image ${index + 1}`,
    }
  }
  return {
    src: item.src,
    alt: item.alt ?? `${project.title} — image ${index + 1}`,
  }
}

/**
 * All gallery images with alt text — `images[]` entries or `[image]` fallback.
 */
export function getProjectImageEntries(project) {
  if (!project) return []
  if (Array.isArray(project.images) && project.images.length > 0) {
    return project.images.map((item, i) => normalizeImageItem(item, project, i))
  }
  if (project.image) {
    return [
      {
        src: project.image,
        alt:
          project.imageAlt ??
          `${project.title} — cover`,
      },
    ]
  }
  return []
}

/** URL list only — preloader, etc. */
export function getProjectImages(project) {
  return getProjectImageEntries(project).map((e) => e.src)
}

export function getProjectBySlug(slug) {
  if (!slug) return null
  return projects.find((p) => p.slug === slug) ?? null
}

export function getProjectPath(project) {
  if (!project?.slug) return '/catalogued-works'
  return `/project/${project.slug}`
}

/** Next project in catalogue order, or `null` if last / unknown. */
export function getNextProjectBySlug(slug) {
  if (!slug) return null
  const i = projects.findIndex((p) => p.slug === slug)
  if (i < 0) return null
  return projects[i + 1] ?? null
}
