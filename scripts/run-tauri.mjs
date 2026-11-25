import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const desktopDir = path.join(repoRoot, 'crates', 'vnweb-desktop')
const tauriCliEntry = path.join(repoRoot, 'node_modules', '@tauri-apps', 'cli', 'tauri.js')

if (!fs.existsSync(tauriCliEntry)) {
  console.error(`找不到 @tauri-apps/cli 入口: ${tauriCliEntry}，请先运行 npm install`)
  process.exit(1)
}

const args = process.argv.slice(2)
const result = spawnSync(process.execPath, [tauriCliEntry, ...args], {
  cwd: desktopDir,
  stdio: 'inherit',
  env: process.env,
})

if (result.error) {
  console.error('运行 Tauri CLI 失败:', result.error)
  process.exit(1)
}

process.exit(result.status ?? 1)
