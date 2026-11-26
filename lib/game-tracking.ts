import type { GameTrackingMode } from '@/types/game'

export const GAME_TRACKING_MODE_OPTIONS: ReadonlyArray<{
  value: GameTrackingMode
  label: string
}> = [
  { value: 'file', label: '按文件追踪' },
  { value: 'directory', label: '按目录追踪' },
  { value: 'process', label: '按进程追踪' },
] as const

export type WindowsProcessInfo = {
  pid: number
  name: string
  executablePath: string
}

export const IGNORED_DIRECTORY_PROCESS_NAMES = new Set([
  'unins000.exe',
  'unins001.exe',
  'uninstall.exe',
  'unitycrashhandler64.exe',
  'unitycrashhandler32.exe',
  'crashpad_handler.exe',
  'crashreporter.exe',
  'ue4prereqsetup_x64.exe',
  'ueprereqsetup_x64.exe',
  'vc_redist.x64.exe',
  'vc_redist.x86.exe',
  'dxsetup.exe',
  'notepad.exe',
])

export function isValidGameTrackingMode(value: unknown): value is GameTrackingMode {
  return value === 'file' || value === 'directory' || value === 'process'
}

export function normalizeGameTrackingMode(value: unknown): GameTrackingMode {
  return isValidGameTrackingMode(value) ? value : 'file'
}

export function normalizeWinPath(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  const isUnc = trimmed.startsWith('\\\\') || trimmed.startsWith('//')
  const collapsed = trimmed.replace(/\//g, '\\').replace(/\\+/g, '\\')
  const normalized = isUnc ? `\\${collapsed}` : collapsed

  if (/^[a-zA-Z]:\\$/.test(normalized)) {
    return normalized
  }

  return normalized.replace(/\\+$/, '')
}

export function getWinBasename(filePath: string): string {
  const normalized = normalizeWinPath(filePath)
  if (!normalized || /^[a-zA-Z]:\\$/.test(normalized)) {
    return ''
  }

  const idx = normalized.lastIndexOf('\\')
  return idx >= 0 ? normalized.slice(idx + 1) : normalized
}

export function getWinDirname(filePath: string): string {
  const normalized = normalizeWinPath(filePath)
  if (!normalized) {
    return ''
  }

  if (/^[a-zA-Z]:\\$/.test(normalized)) {
    return normalized
  }

  const idx = normalized.lastIndexOf('\\')
  if (idx < 0) {
    return ''
  }

  if (idx === 2 && /^[a-zA-Z]:\\/.test(normalized)) {
    return normalized.slice(0, 3)
  }

  return normalized.slice(0, idx)
}

export function resolveDefaultTrackingTarget(mode: GameTrackingMode, exePath: string): string {
  const normalizedExe = normalizeWinPath(exePath)
  if (!normalizedExe) {
    return ''
  }

  if (mode === 'directory') {
    return getWinDirname(normalizedExe)
  }

  if (mode === 'process') {
    return getWinBasename(normalizedExe)
  }

  return normalizedExe
}

export function normalizeTrackingTargetForMode(mode: GameTrackingMode, rawTarget: string): string {
  const trimmed = rawTarget.trim()
  if (!trimmed) {
    return ''
  }

  if (mode === 'process') {
    return trimmed
  }

  return normalizeWinPath(trimmed)
}

export function resolveEffectiveTrackingTarget(
  mode: GameTrackingMode,
  exePath: string,
  customTarget?: string,
): string {
  const custom = customTarget ? normalizeTrackingTargetForMode(mode, customTarget) : ''
  if (custom) {
    return custom
  }

  return resolveDefaultTrackingTarget(mode, exePath)
}

function splitProcessTargetNames(target: string): string[] {
  return target
    .split(/[,，;；、]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
}

function matchProcessEntryName(processName: string, targetPattern: string): boolean {
  const procLower = processName.trim().toLowerCase()
  if (!procLower || !targetPattern) {
    return false
  }

  if (procLower === targetPattern) {
    return true
  }

  const procStem = procLower.endsWith('.exe') ? procLower.slice(0, -4) : procLower
  const patternStem = targetPattern.endsWith('.exe') ? targetPattern.slice(0, -4) : targetPattern
  return !targetPattern.includes('.') ? procStem === patternStem : false
}

export function doesProcessSnapshotMatchTarget(
  processes: WindowsProcessInfo[],
  params: {
    mode: GameTrackingMode
    target: string
    launchedPid?: number
  },
): boolean {
  const launchedPid = params.launchedPid && params.launchedPid > 0 ? params.launchedPid : 0

  if (params.mode === 'process') {
    const patterns = splitProcessTargetNames(params.target)
    if (patterns.length === 0) {
      return false
    }

    return processes.some((proc) => {
      if (patterns.some((pattern) => matchProcessEntryName(proc.name, pattern))) {
        return true
      }
      return launchedPid > 0 && proc.pid === launchedPid && !proc.name.trim()
    })
  }

  if (params.mode === 'directory') {
    const normalizedDir = normalizeWinPath(params.target).toLowerCase()
    if (!normalizedDir) {
      return false
    }

    const dirPrefix = normalizedDir.endsWith('\\') ? normalizedDir : `${normalizedDir}\\`

    return processes.some((proc) => {
      const nameLower = proc.name.trim().toLowerCase()
      const isLaunchedPid = launchedPid > 0 && proc.pid === launchedPid
      if (!isLaunchedPid && IGNORED_DIRECTORY_PROCESS_NAMES.has(nameLower)) {
        return false
      }

      const execPathLower = normalizeWinPath(proc.executablePath).toLowerCase()
      if (!execPathLower) {
        return isLaunchedPid
      }

      return execPathLower.startsWith(dirPrefix)
    })
  }

  const normalizedFile = normalizeWinPath(params.target).toLowerCase()
  if (!normalizedFile) {
    return false
  }

  const targetBaseName = getWinBasename(normalizedFile).toLowerCase()
  return processes.some((proc) => {
    const execPathLower = normalizeWinPath(proc.executablePath).toLowerCase()
    if (execPathLower) {
      return execPathLower === normalizedFile
    }

    if (launchedPid > 0 && proc.pid === launchedPid) {
      const nameLower = proc.name.trim().toLowerCase()
      return !nameLower || nameLower === targetBaseName
    }

    return false
  })
}
