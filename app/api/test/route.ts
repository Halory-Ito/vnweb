import { NextRequest, NextResponse } from 'next/server'
import { execFile, spawn, type ChildProcess } from 'child_process'
import path from 'path'

let runningProcess: ChildProcess | null = null
let runningProcessPath: string | null = null
let rootPid: number | null = null
let trackedPids = new Set<number>()
let startTime: number | null = null
let timer: NodeJS.Timeout | null = null
let isCheckingStatus = false

type ProcessInfo = {
  ProcessId: number
  ParentProcessId: number
  Name: string
}

const runCommand = (file: string, args: string[]) => {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    execFile(file, args, (error, stdout, stderr) => {
      if (error) {
        reject(error)
        return
      }
      resolve({ stdout, stderr })
    })
  })
}

const getProcessSnapshot = async () => {
  const script =
    "$ErrorActionPreference='Stop'; Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,Name | ConvertTo-Json -Compress"

  const { stdout } = await runCommand('powershell', [
    '-NoProfile',
    '-Command',
    script,
  ])

  const parsed = JSON.parse(stdout || '[]') as ProcessInfo | ProcessInfo[]
  const list = Array.isArray(parsed) ? parsed : parsed ? [parsed] : []
  const normalized = list.filter((item) => Number.isFinite(item.ProcessId))
  const alivePidSet = new Set<number>(normalized.map((item) => item.ProcessId))

  return {
    processes: normalized,
    alivePidSet,
  }
}

const expandTrackedTree = (processes: ProcessInfo[]) => {
  const childMap = new Map<number, number[]>()
  for (const processInfo of processes) {
    const siblings = childMap.get(processInfo.ParentProcessId)
    if (siblings) {
      siblings.push(processInfo.ProcessId)
    } else {
      childMap.set(processInfo.ParentProcessId, [processInfo.ProcessId])
    }
  }

  const queue = Array.from(trackedPids)
  const visited = new Set<number>(queue)

  while (queue.length > 0) {
    const currentPid = queue.shift() as number
    const children = childMap.get(currentPid) ?? []
    for (const childPid of children) {
      if (visited.has(childPid)) {
        continue
      }
      visited.add(childPid)
      trackedPids.add(childPid)
      queue.push(childPid)
    }
  }
}

const getTrackedAlivePids = (alivePidSet: Set<number>) => {
  return Array.from(trackedPids).filter((pid) => alivePidSet.has(pid))
}

const logAndClearTracking = (reason: string) => {
  const durationMs = startTime ? Date.now() - startTime : 0
  const durationSeconds = (durationMs / 1000).toFixed(2)
  console.log(
    `Program exited (${runningProcessPath ?? '-'}), reason=${reason}, runtime=${durationSeconds}s`,
  )

  if (timer) {
    clearInterval(timer)
    timer = null
  }

  runningProcess = null
  runningProcessPath = null
  rootPid = null
  trackedPids = new Set<number>()
  startTime = null
  isCheckingStatus = false
}

const clearTracking = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  runningProcess = null
  runningProcessPath = null
  rootPid = null
  trackedPids = new Set<number>()
  startTime = null
  isCheckingStatus = false
}

const refreshTrackingStatus = async () => {
  if (isCheckingStatus) {
    return !!runningProcessPath && trackedPids.size > 0
  }

  if (!runningProcessPath || trackedPids.size === 0) {
    return false
  }

  isCheckingStatus = true
  try {
    const { processes, alivePidSet } = await getProcessSnapshot()
    expandTrackedTree(processes)

    const aliveTrackedPids = getTrackedAlivePids(alivePidSet)
    const running = aliveTrackedPids.length > 0

    if (!running) {
      logAndClearTracking('process tree not found')
    }

    return running
  } finally {
    isCheckingStatus = false
  }
}

const getCurrentStatus = () => {
  const isRunning = !!runningProcessPath && trackedPids.size > 0
  const elapsedSeconds =
    isRunning && startTime ? Math.floor((Date.now() - startTime) / 1000) : 0

  return {
    running: isRunning,
    path: isRunning ? runningProcessPath : null,
    rootPid: isRunning ? rootPid : null,
    trackedPidCount: isRunning ? trackedPids.size : 0,
    elapsedSeconds,
  }
}

export const GET = async () => {
  try {
    await refreshTrackingStatus()
  } catch (error) {
    console.error('Status refresh failed:', error)
  }

  return NextResponse.json(getCurrentStatus())
}

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json()
    const executablePath = body?.path as string | undefined

    if (!executablePath || typeof executablePath !== 'string') {
      return NextResponse.json({ error: 'path is required' }, { status: 400 })
    }

    await refreshTrackingStatus()

    if (runningProcessPath && trackedPids.size > 0) {
      return NextResponse.json(
        {
          error: `A process is already running: ${runningProcessPath}`,
        },
        { status: 409 },
      )
    }

    const child = spawn(executablePath, [], {
      detached: false,
      stdio: 'ignore',
      windowsHide: false,
      shell: false,
      cwd: path.dirname(executablePath),
    })

    runningProcess = child
    runningProcessPath = executablePath
    rootPid = child.pid ?? null
    trackedPids = rootPid ? new Set<number>([rootPid]) : new Set<number>()
    startTime = Date.now()

    if (!rootPid) {
      clearTracking()
      return NextResponse.json(
        { error: 'Failed to capture root PID for process tracking' },
        { status: 500 },
      )
    }

    timer = setInterval(() => {
      void (async () => {
        if (!startTime || !runningProcessPath || trackedPids.size === 0) {
          return
        }

        try {
          const running = await refreshTrackingStatus()
          if (!running || !startTime) {
            return
          }

          const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000)
          if (elapsedSeconds > 0 && elapsedSeconds % 10 === 0) {
            console.log(`Program running: ${elapsedSeconds}s`)
          }
        } catch (error) {
          console.error('Status poll failed:', error)
        }
      })()
    }, 1000)

    child.once('error', (error) => {
      console.error('Failed to start process:', error)
      clearTracking()
    })

    child.once('close', (code, signal) => {
      console.log(
        `Root process closed (${path.basename(executablePath)}), pid=${rootPid}, code=${code}, signal=${signal}. Continue tracking process tree...`,
      )
    })

    child.unref()

    return NextResponse.json({
      message: 'Program started',
      path: executablePath,
      rootPid,
    })
  } catch (error) {
    clearTracking()
    return NextResponse.json(
      {
        error: `Failed to start executable: ${(error as Error).message}`,
      },
      { status: 500 },
    )
  }
}

export const DELETE = async () => {
  await refreshTrackingStatus()

  if (!runningProcessPath || trackedPids.size === 0) {
    clearTracking()
    return NextResponse.json(
      { error: 'No running process to stop' },
      { status: 404 },
    )
  }

  const currentPath = runningProcessPath

  try {
    const { alivePidSet } = await getProcessSnapshot()
    const aliveTrackedPids = getTrackedAlivePids(alivePidSet)

    for (const pid of aliveTrackedPids) {
      try {
        await runCommand('taskkill', ['/PID', String(pid), '/F', '/T'])
      } catch {}
    }

    await new Promise((resolve) => setTimeout(resolve, 200))
    const { alivePidSet: verifyAlivePidSet } = await getProcessSnapshot()
    const stillAlive = getTrackedAlivePids(verifyAlivePidSet).length > 0

    if (stillAlive) {
      return NextResponse.json(
        { error: 'Failed to stop the running process tree' },
        { status: 500 },
      )
    }

    logAndClearTracking('stopped by API')

    return NextResponse.json({
      message: 'Stop signal sent',
      path: currentPath,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: `Failed to stop the running process tree: ${(error as Error).message}`,
      },
      { status: 500 },
    )
  }
}
