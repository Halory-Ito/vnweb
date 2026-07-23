import fs from 'node:fs'
import path from 'node:path'

const CONFIG_FILE = path.join(process.cwd(), 'app', 'config.json')

// 简单的 Promise 队列，确保对 config.json 的读写串行执行
let queue: Promise<void> = Promise.resolve()

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const task = queue.then(fn, fn)
  queue = task.then(() => {})
  return task
}

/** 读取完整的 config.json，出错时返回空对象 */
export async function readConfig(): Promise<Record<string, unknown>> {
  return enqueue(async () => {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const content = await fs.promises.readFile(CONFIG_FILE, 'utf-8')
        return JSON.parse(content)
      }
    } catch {
      // ignore
    }
    return {}
  })
}

/** 写入完整的 config.json（串行，不会与其他写入交错） */
export async function writeConfig(
  config: Record<string, unknown>,
): Promise<void> {
  return enqueue(async () => {
    await fs.promises.writeFile(CONFIG_FILE, JSON.stringify(config, null, 4))
  })
}

/**
 * 原子更新 config.json 的某个子路径。
 *
 * @example
 * // 只更新 settings.appearance.glass
 * await updateConfigSection(['settings', 'appearance', 'glass'], { blur: 30, opacity: 50 })
 */
export async function updateConfigSection(
  keys: string[],
  value: unknown,
): Promise<void> {
  return enqueue(async () => {
    let config: Record<string, unknown> = {}
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const content = await fs.promises.readFile(CONFIG_FILE, 'utf-8')
        config = JSON.parse(content)
      }
    } catch {
      // ignore, start from empty
    }

    // 确保中间路径存在
    let current: Record<string, unknown> = config
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]!
      if (typeof current[key] !== 'object' || current[key] === null) {
        current[key] = {}
      }
      current = current[key] as Record<string, unknown>
    }

    // 设置最终的值
    const lastKey = keys[keys.length - 1]!
    current[lastKey] = value

    await fs.promises.writeFile(CONFIG_FILE, JSON.stringify(config, null, 4))
  })
}
