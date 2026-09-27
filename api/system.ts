import { api } from '@/lib/request-utils'

export const selectExeFile = async () => {
  const response = await api.post('/system/select-file', {
    filter: '可执行文件 (*.exe)|*.exe|所有文件 (*.*)|*.*',
    title: '选择可执行文件',
  })
  return (response.data as { data: { filePath: string } }).data.filePath
}
