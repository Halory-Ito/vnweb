import { REPOSITORY } from '@/features/settings/lib/project-info'
import { getProjectUpdate, githubReleaseSchema } from '@/features/settings/lib/project-update'

export async function GET() {
  try {
    const response = await fetch(`https://api.github.com/repos/${REPOSITORY}/releases/latest`, {
      cache: 'no-store',
      headers: { Accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(8000),
    })

    if (response.status === 404) return Response.json({ status: 'unpublished' })
    if (response.ok) {
      const release = githubReleaseSchema.parse(await response.json())
      return Response.json(getProjectUpdate(release))
    }
  } catch (error) {
    console.error('Check vnweb update failed:', error)
  }

  return Response.json({ error: '暂时无法读取 GitHub 发布信息' }, { status: 502 })
}
