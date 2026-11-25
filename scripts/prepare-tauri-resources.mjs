import { execFileSync, execSync } from 'node:child_process'
import fs from 'node:fs'
import { copyFile, cp, mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const desktopDir = path.join(repoRoot, 'crates', 'vnweb-desktop')
const resourcesDir = path.join(desktopDir, 'resources')
const standaloneSrcDir = path.join(repoRoot, '.next', 'standalone')
const tauriConfigPath = path.join(desktopDir, 'tauri.conf.json')

function parseNodeBinArg() {
  const idx = process.argv.indexOf('--node-bin')
  if (idx !== -1 && process.argv[idx + 1]) {
    return process.argv[idx + 1]
  }
  return process.env.VNWEB_NODE_BIN?.trim() || process.execPath
}

function verifyNodeBinary(nodeBinPath) {
  const resolved = path.resolve(nodeBinPath)
  if (!fs.existsSync(resolved)) {
    throw new Error(`找不到 Node.js 可执行文件: ${resolved}`)
  }

  const rawVersion = execFileSync(resolved, ['-v'], { encoding: 'utf8' }).trim()
  const match = /^v(\d+)\.(\d+)\./.exec(rawVersion)
  if (!match) {
    throw new Error(`无法解析 Node.js 版本: ${rawVersion}`)
  }
  const major = Number(match[1])
  const minor = Number(match[2])
  if (major < 20 || (major === 20 && minor < 9)) {
    throw new Error(`Node.js 版本过低（${rawVersion}），需要 >= 20.9`)
  }
  return { path: resolved, version: rawVersion }
}

async function main() {
  const skipStandalone = process.argv.includes('--skip-standalone')
  const skipCliRust = process.argv.includes('--skip-cli-rust')
  const nodeInfo = verifyNodeBinary(parseNodeBinArg())

  console.log(`[1/4] Using Node.js ${nodeInfo.version} (${nodeInfo.path})`)

  if (!skipStandalone) {
    console.log('[2/4] Building Next.js standalone bundle...')
    execSync('node scripts/build-standalone.mjs', { cwd: repoRoot, stdio: 'inherit' })
  } else {
    console.log('[2/4] Skipping standalone build (--skip-standalone)')
  }

  if (!fs.existsSync(path.join(standaloneSrcDir, 'server.js'))) {
    throw new Error(`找不到 standalone 产物: ${path.join(standaloneSrcDir, 'server.js')}`)
  }

  if (!skipCliRust) {
    console.log('[3/4] Building Rust CLI shim (vnweb.exe)...')
    execSync('cargo build --release -p vnweb-cli', { cwd: repoRoot, stdio: 'inherit' })
  } else {
    console.log('[3/4] Skipping Rust CLI build (--skip-cli-rust)')
  }

  const cliBinSrc = path.join(repoRoot, 'target', 'release', 'vnweb.exe')
  if (!fs.existsSync(cliBinSrc)) {
    throw new Error(`找不到编译后的 vnweb.exe: ${cliBinSrc}`)
  }

  console.log('[4/4] Staging Tauri resources...')
  await rm(resourcesDir, { recursive: true, force: true })

  const standaloneDestDir = path.join(resourcesDir, 'standalone')
  const portableBatPath = path.resolve(standaloneSrcDir, 'vnweb-portable.bat')
  await mkdir(standaloneDestDir, { recursive: true })
  await cp(standaloneSrcDir, standaloneDestDir, {
    recursive: true,
    force: true,
    dereference: true,
    filter: (src) => path.resolve(src) !== portableBatPath,
  })

  const runtimeDestDir = path.join(resourcesDir, 'runtime')
  await mkdir(runtimeDestDir, { recursive: true })
  await copyFile(nodeInfo.path, path.join(runtimeDestDir, 'node.exe'))

  const binDestDir = path.join(resourcesDir, 'bin')
  await mkdir(binDestDir, { recursive: true })
  await copyFile(cliBinSrc, path.join(binDestDir, 'vnweb.exe'))

  const tauriConfig = JSON.parse(fs.readFileSync(tauriConfigPath, 'utf8'))
  const resourceMap = tauriConfig?.bundle?.resources ?? {}
  for (const relativeSrc of Object.keys(resourceMap)) {
    const absSrc = path.join(desktopDir, relativeSrc)
    if (!fs.existsSync(absSrc)) {
      throw new Error(`tauri.conf.json 声明的资源不存在: ${absSrc}`)
    }
  }

  console.log(`Tauri resources staged cleanly at ${resourcesDir}`)
}

main().catch((error) => {
  console.error('Prepare Tauri resources failed:', error)
  process.exit(1)
})
