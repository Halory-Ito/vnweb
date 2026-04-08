// 进程监控模块 - 当前版本仅保留基础函数，实际进程管理已简化

export type GameSession = {
  gameId: number
  pid: number
  startedAt: string
}

export const isProcessRunning = (pid: number) => {
  if (!Number.isInteger(pid) || pid <= 0) {
    return false
  }

  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}
