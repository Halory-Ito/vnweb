import { z } from 'zod'

import { projectInfo } from './project-info'

export const githubReleaseSchema = z.object({
  tag_name: z.string().min(1),
  assets: z.array(z.object({ name: z.string() })),
})

type UpdateStatus = 'available' | 'current' | 'unknown'

export type ProjectUpdate =
  | { status: 'unpublished' }
  | { status: UpdateStatus; tag: string; url: string }

function compareVersions(latest: string | undefined, current: string): number | undefined {
  const versionPattern = /^\d+\.\d+\.\d+$/
  if (!latest || !versionPattern.test(latest) || !versionPattern.test(current)) return undefined

  const latestParts = latest.split('.').map(Number)
  const currentParts = current.split('.').map(Number)
  for (let i = 0; i < latestParts.length; i += 1) {
    const difference = latestParts[i] - currentParts[i]
    if (difference !== 0) return difference
  }
  return 0
}

export function getProjectUpdate(release: z.infer<typeof githubReleaseSchema>): ProjectUpdate {
  const tag = release.tag_name
  const releaseBuild = /^desktop-build-(\d+)$/.exec(tag)?.[1]
  const installedBuild = projectInfo.build
  const tagVersion = /^v?(\d+\.\d+\.\d+)$/.exec(tag)?.[1]
  const installer = release.assets.find(({ name }) => name.endsWith('_x64-setup.exe'))
  const installerVersion = /^vnweb_(\d+\.\d+\.\d+)_x64-setup\.exe$/.exec(installer?.name ?? '')?.[1]
  const versionDifference = compareVersions(tagVersion ?? installerVersion, projectInfo.version)

  let status: UpdateStatus = 'unknown'
  if (releaseBuild && installedBuild && /^\d+$/.test(installedBuild)) {
    status = Number(releaseBuild) > Number(installedBuild) ? 'available' : 'current'
  } else if (versionDifference !== undefined && versionDifference !== 0) {
    status = versionDifference > 0 ? 'available' : 'current'
  } else if (tagVersion && versionDifference === 0) {
    status = 'current'
  }

  return { status, tag, url: `${projectInfo.releasesUrl}/tag/${encodeURIComponent(tag)}` }
}
