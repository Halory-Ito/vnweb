import { api } from '@/lib/request-utils'

import type {
  ExternalImportPlatform,
  PlatformDetectedPath,
  PlatformImportExecutePayload,
  PlatformImportExecuteResult,
  PlatformImportSessionPreview,
} from '@/types/platform-import'

export function detectPlatformImportPathsApi() {
  return api.request<{ data: { items: PlatformDetectedPath[] } }>({
    method: 'GET',
    url: '/game/platform-import/detect',
  })
}

export function previewPlatformImportFileApi(platform: ExternalImportPlatform, file: File) {
  const formData = new FormData()
  formData.append('platform', platform)
  formData.append('file', file)
  return api.request<{ data: PlatformImportSessionPreview }>({
    method: 'POST',
    url: '/game/platform-import/preview',
    data: formData,
  })
}

export function previewPlatformImportPathApi(platform: ExternalImportPlatform, localPath: string) {
  return api.request<{ data: PlatformImportSessionPreview }>({
    method: 'POST',
    url: '/game/platform-import/preview',
    data: { platform, localPath },
  })
}

export function executePlatformImportApi(payload: PlatformImportExecutePayload) {
  return api.request<{ data: PlatformImportExecuteResult }>({
    method: 'POST',
    url: '/game/platform-import/execute',
    data: payload,
  })
}

export function discardPlatformImportSessionApi(sessionId: string) {
  return api.request<{ data: { deleted: boolean } }>({
    method: 'DELETE',
    url: '/game/platform-import/preview',
    params: { sessionId },
  })
}
