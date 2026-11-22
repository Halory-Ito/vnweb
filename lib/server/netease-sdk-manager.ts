import { execFile, spawn, type ChildProcess } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { promisify } from 'node:util'

import { updatePlatformSettings } from '@/lib/server/platform-settings'

const execFileAsync = promisify(execFile)

const SDK_PACKAGE_NAME = '@neteasecloudmusicapienhanced/api'
const SDK_DIR = path.join(process.cwd(), 'data', 'services', 'netease-enhanced-api')
const DEFAULT_PORT = 3001

type NeteaseSdkRuntime = {
  process: ChildProcess | null
  port: number
  lastError: string | null
}

const globalForNeteaseSdk = globalThis as typeof globalThis & {
  __vnwebNeteaseSdk?: NeteaseSdkRuntime
}

function getRuntime(): NeteaseSdkRuntime {
  if (!globalForNeteaseSdk.__vnwebNeteaseSdk) {
    globalForNeteaseSdk.__vnwebNeteaseSdk = {
      process: null,
      port: DEFAULT_PORT,
      lastError: null,
    }
  }
  return globalForNeteaseSdk.__vnwebNeteaseSdk
}

export type NeteaseSdkStatus = {
  installed: boolean
  version: string | null
  running: boolean
  port: number
  pid: number | null
  endpoint: string
  lastError: string | null
}

function getInstalledPackageJsonPath() {
  return path.join(SDK_DIR, 'node_modules', '@neteasecloudmusicapienhanced', 'api', 'package.json')
}

function readInstalledVersion(): string | null {
  const pkgPath = getInstalledPackageJsonPath()
  if (!fs.existsSync(pkgPath)) return null
  try {
    const parsed = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as { version?: string }
    return typeof parsed.version === 'string' ? parsed.version : 'unknown'
  } catch {
    return 'unknown'
  }
}

function isProcessAlive(child: ChildProcess | null): boolean {
  return Boolean(child && child.exitCode === null && !child.killed)
}

function normalizePort(port?: number): number {
  if (typeof port === 'number' && Number.isInteger(port) && port >= 1024 && port <= 65535) {
    return port
  }
  return DEFAULT_PORT
}

export function getNeteaseSdkStatus(): NeteaseSdkStatus {
  const runtime = getRuntime()
  const version = readInstalledVersion()
  const running = isProcessAlive(runtime.process)
  if (!running && runtime.process) {
    runtime.process = null
  }

  return {
    installed: Boolean(version),
    version,
    running,
    port: runtime.port,
    pid: running ? (runtime.process?.pid ?? null) : null,
    endpoint: `http://127.0.0.1:${runtime.port}`,
    lastError: runtime.lastError,
  }
}

export async function installNeteaseSdk(): Promise<NeteaseSdkStatus> {
  const runtime = getRuntime()
  runtime.lastError = null

  await fs.promises.mkdir(SDK_DIR, { recursive: true })
  const pkgFile = path.join(SDK_DIR, 'package.json')
  if (!fs.existsSync(pkgFile)) {
    await fs.promises.writeFile(
      pkgFile,
      JSON.stringify({ name: 'vnweb-netease-enhanced-api', private: true }, null, 2),
      'utf-8',
    )
  }

  try {
    if (process.platform === 'win32') {
      await execFileAsync(
        process.env.ComSpec || 'cmd.exe',
        ['/d', '/s', '/c', `npm install ${SDK_PACKAGE_NAME} --no-audit --no-fund`],
        {
          cwd: SDK_DIR,
          timeout: 180_000,
          windowsHide: true,
        },
      )
    } else {
      await execFileAsync('npm', ['install', SDK_PACKAGE_NAME, '--no-audit', '--no-fund'], {
        cwd: SDK_DIR,
        timeout: 180_000,
      })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '安装 SDK 失败'
    runtime.lastError = message
    throw new Error(`安装 ${SDK_PACKAGE_NAME} 失败: ${message}`)
  }

  return getNeteaseSdkStatus()
}

export async function stopNeteaseSdk(): Promise<NeteaseSdkStatus> {
  const runtime = getRuntime()
  if (isProcessAlive(runtime.process) && runtime.process) {
    runtime.process.kill()
    await new Promise((resolve) => setTimeout(resolve, 300))
  }
  runtime.process = null
  return getNeteaseSdkStatus()
}

export async function startNeteaseSdk(port?: number): Promise<NeteaseSdkStatus> {
  const runtime = getRuntime()
  const status = getNeteaseSdkStatus()

  if (!status.installed) {
    throw new Error(`请先安装 ${SDK_PACKAGE_NAME}`)
  }

  const targetPort = normalizePort(port ?? runtime.port)

  if (status.running && runtime.port === targetPort) {
    return status
  }

  if (status.running) {
    await stopNeteaseSdk()
  }

  runtime.lastError = null
  runtime.port = targetPort

  const bootstrapScript = `
const api = require(${JSON.stringify(SDK_PACKAGE_NAME)});
const port = Number(process.env.PORT || ${targetPort});
Promise.resolve(api.serveNcmApi({ port, host: '127.0.0.1' })).catch((err) => {
  console.error(err);
  process.exit(1);
});
`

  const child = spawn(process.execPath, ['-e', bootstrapScript], {
    cwd: SDK_DIR,
    env: { ...process.env, PORT: String(targetPort), HOST: '127.0.0.1' },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  })

  let stderrBuffer = ''
  child.stderr?.on('data', (chunk: Buffer) => {
    stderrBuffer += chunk.toString('utf-8').slice(-500)
  })

  child.on('exit', (code) => {
    if (runtime.process === child) {
      runtime.process = null
      if (code && code !== 0) {
        runtime.lastError = stderrBuffer.trim() || `进程异常退出（code ${code}）`
      }
    }
  })

  runtime.process = child

  // 等待一小段时间确认进程未立即崩溃
  await new Promise((resolve) => setTimeout(resolve, 1200))
  if (!isProcessAlive(child)) {
    runtime.process = null
    const reason = stderrBuffer.trim() || '服务启动后立即退出，请检查端口是否被占用'
    runtime.lastError = reason
    throw new Error(reason)
  }

  await updatePlatformSettings('enhanced', { useLocalSdk: true, sdkPort: targetPort })

  return getNeteaseSdkStatus()
}

export async function uninstallNeteaseSdk(): Promise<NeteaseSdkStatus> {
  const runtime = getRuntime()
  await stopNeteaseSdk()
  runtime.lastError = null

  if (fs.existsSync(SDK_DIR)) {
    await fs.promises.rm(SDK_DIR, { recursive: true, force: true })
  }

  return getNeteaseSdkStatus()
}
