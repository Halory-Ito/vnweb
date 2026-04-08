import { readdir, readFile } from 'fs/promises'
import { NextResponse } from 'next/server'
import { join } from 'path'

const ADDONS_DIR = join(process.cwd(), 'app', 'addOns')

function toPluginAssetUrl(pluginDir: string, iconPath: string) {
  const trimmed = iconPath.trim()

  if (!trimmed) {
    return ''
  }

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed
  }

  let normalized = trimmed.replace(/^\.\//, '').replace(/^\//, '')

  if (normalized.startsWith('addOns/')) {
    normalized = normalized.slice('addOns/'.length)
  }

  if (!normalized.startsWith(`${pluginDir}/`)) {
    normalized = `${pluginDir}/${normalized}`
  }

  const encodedPath = normalized.split('/').map(encodeURIComponent).join('/')

  return `/api/market/plugins/assets/${encodedPath}`
}

async function getPlugins() {
  try {
    const entries = await readdir(ADDONS_DIR, { withFileTypes: true })
    const plugins: Array<{
      id: string
      name: string
      description: string
      version: string
      icon: string
      authors: string[]
      installed: boolean
    }> = []

    for (const entry of entries) {
      if (entry.isDirectory()) {
        try {
          const manifestPath = join(ADDONS_DIR, entry.name, 'manifest.ts')
          const manifestContent = await readFile(manifestPath, 'utf-8')

          // Extract properties using regex
          const idMatch = manifestContent.match(/id:\s*["']([^"']+)["']/)
          const nameMatch = manifestContent.match(/name:\s*["']([^"']+)["']/)
          const descMatch = manifestContent.match(
            /description:\s*["']([^"']+)["']/,
          )
          const versionMatch = manifestContent.match(
            /version:\s*["']([^"']+)["']/,
          )
          const iconMatch = manifestContent.match(/icon:\s*["']([^"']+)["']/)
          const authorsBlockMatch = manifestContent.match(
            /authors:\s*\[([^\]]*)\]/,
          )
          const installedMatch = manifestContent.match(
            /installed:\s*(true|false)/,
          )

          if (idMatch && nameMatch) {
            const iconValue = iconMatch ? iconMatch[1] : ''
            const authorsValue = authorsBlockMatch ? authorsBlockMatch[1] : ''
            const authors = authorsValue
              ? [...authorsValue.matchAll(/["']([^"']+)["']/g)].map(
                  (match) => match[1],
                )
              : []

            plugins.push({
              id: idMatch[1],
              name: nameMatch[1],
              description: descMatch ? descMatch[1] : '',
              version: versionMatch ? versionMatch[1] : '0.0.0',
              icon: toPluginAssetUrl(entry.name, iconValue),
              authors,
              installed: installedMatch ? installedMatch[1] === 'true' : false,
            })
          }
        } catch {
          // Skip plugins with invalid manifest
          console.warn(`Failed to load plugin: ${entry.name}`)
        }
      }
    }

    return plugins
  } catch {
    return []
  }
}

export async function GET() {
  const plugins = await getPlugins()
  return NextResponse.json(plugins)
}
