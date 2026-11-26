import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { resolveServerPortSync } from '../lib/server/app-settings.mjs'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const nextBin = path.join(repoRoot, 'node_modules', 'next', 'dist', 'bin', 'next')

const extraArgs = process.argv.slice(2)
const hasPortFlag = extraArgs.some(
  (arg) => arg === '-p' || arg === '--port' || arg.startsWith('-p=') || arg.startsWith('--port='),
)
const hasHostFlag = extraArgs.some(
  (arg) =>
    arg === '-H' || arg === '--hostname' || arg.startsWith('-H=') || arg.startsWith('--hostname='),
)

const args = ['start']
if (!hasPortFlag) {
  args.push('-p', String(resolveServerPortSync()))
}
if (!hasHostFlag) {
  args.push('--hostname', process.env.HOSTNAME?.trim() || '0.0.0.0')
}
args.push(...extraArgs)

const child = spawn(process.execPath, [nextBin, ...args], {
  cwd: repoRoot,
  stdio: 'inherit',
  env: process.env,
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    if (!child.killed) {
      child.kill(signal)
    }
  })
}

child.on('error', (error) => {
  console.error('Failed to start server:', error)
  process.exit(1)
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }
  process.exit(code ?? 0)
})
