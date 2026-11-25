export type TauriCurrentWindow = {
  isDecorated: () => Promise<boolean>
  setDecorations: (decorations: boolean) => Promise<void>
  isMaximized: () => Promise<boolean>
  minimize: () => Promise<void>
  toggleMaximize: () => Promise<void>
  close: () => Promise<void>
  startDragging: () => Promise<void>
  onResized?: (handler: () => void) => Promise<() => void>
}

declare global {
  interface Window {
    __TAURI__?: {
      core?: {
        invoke: <T>(
          command: string,
          data: ArrayBuffer | Record<string, unknown>,
          options?: { headers: Record<string, string> },
        ) => Promise<T>
      }
      window?: {
        getCurrentWindow?: () => TauriCurrentWindow
      }
    }
  }
}

function getDesktopWindow(): TauriCurrentWindow | null {
  if (typeof window === 'undefined') return null
  return window.__TAURI__?.window?.getCurrentWindow?.() ?? null
}

export function isDesktopRuntime(): boolean {
  return getDesktopWindow() !== null
}

export async function pickDesktopGamePath(kind: 'executable' | 'saveDirectory') {
  const core = window.__TAURI__?.core
  if (!core) throw new Error('桌面路径选择接口不可用')
  return core.invoke<string | null>('pick_game_path', { kind })
}

let pendingNativeTitleBar: boolean | null = null
let lastAppliedNativeTitleBar: boolean | null = null
let nativeTitleBarSyncPromise: Promise<void> | null = null

/** 串行化并合并窗口原生标题栏状态同步，避免异步 IPC 时序竞争导致状态反转 */
export function syncDesktopNativeTitleBar(enabled: boolean): Promise<void> {
  if (!getDesktopWindow()) return Promise.resolve()

  pendingNativeTitleBar = enabled
  if (nativeTitleBarSyncPromise) {
    return nativeTitleBarSyncPromise
  }

  nativeTitleBarSyncPromise = (async () => {
    try {
      while (pendingNativeTitleBar !== null) {
        const target = pendingNativeTitleBar
        pendingNativeTitleBar = null
        const win = getDesktopWindow()
        if (!win) return

        try {
          if (lastAppliedNativeTitleBar === null) {
            const decorated = await win.isDecorated()
            if (pendingNativeTitleBar !== null) {
              continue
            }
            if (decorated === target) {
              lastAppliedNativeTitleBar = target
              continue
            }
          } else if (lastAppliedNativeTitleBar === target) {
            continue
          }

          await win.setDecorations(target)
          lastAppliedNativeTitleBar = target
        } catch (error) {
          console.error('Sync desktop window decorations failed:', error)
        }
      }
    } finally {
      nativeTitleBarSyncPromise = null
    }
  })()

  return nativeTitleBarSyncPromise
}

export async function isDesktopWindowMaximized(): Promise<boolean> {
  const win = getDesktopWindow()
  if (!win) return false

  try {
    return await win.isMaximized()
  } catch {
    return false
  }
}

export async function minimizeDesktopWindow(): Promise<void> {
  const win = getDesktopWindow()
  if (!win) return

  try {
    await win.minimize()
  } catch (error) {
    console.error('Minimize desktop window failed:', error)
  }
}

export async function toggleMaximizeDesktopWindow(): Promise<boolean> {
  const win = getDesktopWindow()
  if (!win) return false

  try {
    await win.toggleMaximize()
    return await win.isMaximized()
  } catch (error) {
    console.error('Toggle maximize desktop window failed:', error)
    return false
  }
}

export async function closeDesktopWindow(): Promise<void> {
  const win = getDesktopWindow()
  if (!win) return

  try {
    await win.close()
  } catch (error) {
    console.error('Close desktop window failed:', error)
  }
}

export async function startDesktopWindowDragging(): Promise<void> {
  const win = getDesktopWindow()
  if (!win) return

  try {
    await win.startDragging()
  } catch (error) {
    console.error('Start desktop window dragging failed:', error)
  }
}

export async function subscribeDesktopWindowResize(listener: () => void): Promise<() => void> {
  const win = getDesktopWindow()
  if (!win?.onResized) return () => {}

  try {
    return await win.onResized(() => {
      listener()
    })
  } catch {
    return () => {}
  }
}
