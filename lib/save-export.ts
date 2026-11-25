import { isDesktopRuntime } from './desktop-window'

export async function saveExport(blob: Blob, fileName: string): Promise<{ path?: string } | null> {
  if (isDesktopRuntime()) {
    const core = window.__TAURI__?.core
    if (!core) throw new Error('桌面保存接口不可用')

    const path = await core.invoke<string | null>('save_export', await blob.arrayBuffer(), {
      headers: { 'x-vnweb-file-name': encodeURIComponent(fileName) },
    })
    return path === null ? null : { path }
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  return {}
}
