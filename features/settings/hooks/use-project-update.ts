import { useMutation } from '@tanstack/react-query'

import { checkProjectUpdateApi } from '../settings-api'

const updateStatusLabel = {
  available: '有可用更新',
  current: '暂无可用更新',
  unknown: '无法比较当前构建与最新发布',
  unpublished: '暂无公开发布',
}

export function useProjectUpdate() {
  const { data, isError, isPending, mutate } = useMutation({ mutationFn: checkProjectUpdateApi })
  const statusText = isError ? '检查失败，请重试' : data && updateStatusLabel[data.status]
  const release = data && (data.status === 'available' || data.status === 'unknown') ? data : null

  return { isError, isPending, statusText, release, check: () => mutate() }
}
