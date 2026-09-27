// WebDAV 上传任务进度存储（内存态，按任务 ID 索引）

export type WebDAVTaskStatus = 'running' | 'success' | 'error'

export type WebDAVTaskProgress = {
  taskId: string
  status: WebDAVTaskStatus
  total: number
  uploaded: number
  currentFile: string
  message: string
  error?: string
  createdAt: number
}

const tasks = new Map<string, WebDAVTaskProgress>()

// 任务完成后保留时间（毫秒），供前端轮询查询最终状态
const TASK_RETENTION_MS = 10 * 60 * 1000

// 惰性清理：任务完成后延迟删除
const cleanupTimers = new Map<string, ReturnType<typeof setTimeout>>()

function scheduleCleanup(taskId: string): void {
  const existing = cleanupTimers.get(taskId)
  if (existing) {
    clearTimeout(existing)
  }
  const timer = setTimeout(() => {
    tasks.delete(taskId)
    cleanupTimers.delete(taskId)
  }, TASK_RETENTION_MS)
  cleanupTimers.set(taskId, timer)
}

export function createTask(taskId: string, total: number): WebDAVTaskProgress {
  const task: WebDAVTaskProgress = {
    taskId,
    status: 'running',
    total,
    uploaded: 0,
    currentFile: '',
    message: '准备中...',
    createdAt: Date.now(),
  }
  tasks.set(taskId, task)
  return task
}

export function updateTask(taskId: string, patch: Partial<WebDAVTaskProgress>): void {
  const task = tasks.get(taskId)
  if (task) {
    Object.assign(task, patch)
  }
}

export function getTask(taskId: string): WebDAVTaskProgress | null {
  return tasks.get(taskId) || null
}

export function finishTask(
  taskId: string,
  status: WebDAVTaskStatus,
  message: string,
  error?: string,
): void {
  const task = tasks.get(taskId)
  if (task) {
    task.status = status
    task.message = message
    if (error) {
      task.error = error
    }
    // 完成后安排延迟清理，避免内存泄漏
    scheduleCleanup(taskId)
  }
}

export function deleteTask(taskId: string): void {
  const timer = cleanupTimers.get(taskId)
  if (timer) {
    clearTimeout(timer)
    cleanupTimers.delete(taskId)
  }
  tasks.delete(taskId)
}

// 清理超时未完成的任务（进程启动或定期调用，防止极端情况泄漏）
export function cleanStaleTasks(): void {
  const now = Date.now()
  for (const [id, task] of tasks) {
    const age = now - task.createdAt
    const maxAge = 2 * 60 * 60 * 1000 // 2 小时
    if (task.status === 'running' && age > maxAge) {
      tasks.delete(id)
    }
  }
}
