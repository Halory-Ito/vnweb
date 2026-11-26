import { api } from '@/lib/request-utils'

export const selectExeFile = async () => {
  const response = await api.request<{ data: { filePath: string } }>({
    method: 'post',
    url: '/system/select-file',
    data: {
      filter: '可执行文件 (*.exe)|*.exe|所有文件 (*.*)|*.*',
      title: '选择可执行文件',
    },
  })
  return response.data.data.filePath
}

export const selectDirectory = async (title?: string) => {
  const response = await api.request<{ data: { directory: string } }>({
    method: 'post',
    url: '/system/select-directory',
    data: title ? { title } : undefined,
  })
  return response.data.data.directory
}
