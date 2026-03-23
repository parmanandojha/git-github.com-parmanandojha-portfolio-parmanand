import projects from '../data/projects.json'

/**
 * All gallery images for a project — uses `images[]` when set, otherwise `[image]`.
 */
export function getProjectImages(project) {
  if (!project) return []
  if (Array.isArray(project.images) && project.images.length > 0) {
    return project.images
  }
  if (project.image) return [project.image]
  return []
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
