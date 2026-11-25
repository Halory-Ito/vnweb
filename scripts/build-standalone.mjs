import { execSync } from 'node:child_process'
import fs from 'node:fs'
import { cp, mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildCli } from './build-cli.mjs'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const standaloneDir = path.join(repoRoot, '.next', 'standalone')

const PORTABLE_LAUNCHER_BAT = `@echo off
chcp 65001 >nul
setlocal EnableExtensions
set "VNWEB_APP_DIR=%~dp0"
if "%VNWEB_APP_DIR:~-1%"=="\\" set "VNWEB_APP_DIR=%VNWEB_APP_DIR:~0,-1%"
if not defined VNWEB_DATA_DIR set "VNWEB_DATA_DIR=%VNWEB_APP_DIR%\\user-data"
if not defined PORT set "PORT=8999"
if not defined HOSTNAME set "HOSTNAME=0.0.0.0"

set "NODE_BIN=node"
if exist "%VNWEB_APP_DIR%\\runtime\\node.exe" set "NODE_BIN=%VNWEB_APP_DIR%\\runtime\\node.exe"

if "%~1"=="" (
  "%NODE_BIN%" "%VNWEB_APP_DIR%\\server.js"
) else (
  "%NODE_BIN%" "%VNWEB_APP_DIR%\\cli\\vnweb-cli.mjs" %*
)
`

async function copyIfExists(src, dest, options = {}) {
  if (!fs.existsSync(src)) return false
  await mkdir(path.dirname(dest), { recursive: true })
  await cp(src, dest, { recursive: true, force: true, ...options })
  return true
}

async function copyLibsqlNativePackages() {
  const srcLibsqlDir = path.join(repoRoot, 'node_modules', '@libsql')
  const destLibsqlDir = path.join(standaloneDir, 'node_modules', '@libsql')
  if (!fs.existsSync(srcLibsqlDir)) return

  const entries = fs.readdirSync(srcLibsqlDir, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isDirectory() && !entry.isSymbolicLink()) continue
    const destPkg = path.join(destLibsqlDir, entry.name)
    if (!fs.existsSync(destPkg)) {
      await cp(path.join(srcLibsqlDir, entry.name), destPkg, {
        recursive: true,
        force: true,
        dereference: true,
      })
    }
  }
}

const RUNTIME_KEEP_ENTRIES = new Set([
  '.next',
  'cli',
  'data',
  'drizzle',
  'node_modules',
  'package.json',
  'public',
  'server.js',
  'vnweb-portable.bat',
])

async function sanitizePrivateDataFromStandalone() {
  const topEntries = fs.readdirSync(standaloneDir, { withFileTypes: true })
  await Promise.all(
    topEntries
      .filter((entry) => !RUNTIME_KEEP_ENTRIES.has(entry.name))
      .map((entry) => rm(path.join(standaloneDir, entry.name), { recursive: true, force: true })),
  )

  const removablePaths = [
    path.join(standaloneDir, 'data', 'settings'),
    path.join(standaloneDir, 'data', 'services'),
    path.join(standaloneDir, 'public', 'assets'),
  ]

  await Promise.all(removablePaths.map((target) => rm(target, { recursive: true, force: true })))
}

async function main() {
  const skipNextBuild = process.argv.includes('--skip-next-build')
  if (!skipNextBuild) {
    console.log('[1/5] Building Next.js standalone app...')
    execSync('npm run build', { cwd: repoRoot, stdio: 'inherit' })
  }

  const serverEntry = path.join(standaloneDir, 'server.js')
  if (!fs.existsSync(serverEntry)) {
    throw new Error(`找不到 Next.js standalone 入口文件: ${serverEntry}`)
  }

  console.log('[2/5] Copying static assets, public, data/example, and drizzle migrations...')
  await copyIfExists(
    path.join(repoRoot, '.next', 'static'),
    path.join(standaloneDir, '.next', 'static'),
  )

  const legacyPublicAssetsDir = path.resolve(repoRoot, 'public', 'assets')
  await copyIfExists(path.join(repoRoot, 'public'), path.join(standaloneDir, 'public'), {
    filter: (src) => {
      const resolved = path.resolve(src)
      return (
        resolved !== legacyPublicAssetsDir && !resolved.startsWith(legacyPublicAssetsDir + path.sep)
      )
    },
  })

  await copyIfExists(
    path.join(repoRoot, 'data', 'example'),
    path.join(standaloneDir, 'data', 'example'),
  )
  await copyIfExists(path.join(repoRoot, 'drizzle'), path.join(standaloneDir, 'drizzle'))
  await copyLibsqlNativePackages()

  console.log('[3/5] Cleaning private user data from standalone output...')
  await sanitizePrivateDataFromStandalone()

  console.log('[4/5] Building standalone CLI bundle...')
  const cliOut = await buildCli(path.join(standaloneDir, 'cli', 'vnweb-cli.mjs'))
  console.log(`  Built CLI: ${cliOut}`)

  console.log('[5/5] Writing portable launcher...')
  await writeFile(path.join(standaloneDir, 'vnweb-portable.bat'), PORTABLE_LAUNCHER_BAT, 'utf8')

  console.log(`Standalone package ready: ${standaloneDir}`)
}

main().catch((error) => {
  console.error('Build standalone failed:', error)
  process.exit(1)
})
