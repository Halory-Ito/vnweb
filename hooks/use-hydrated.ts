'use client'

import { useSyncExternalStore } from 'react'

const emptySubscribe = () => () => {}
const getClientSnapshot = () => true
const getServerSnapshot = () => false

/** 仅在客户端完成 hydration 后返回 true，避免 SSR 与客户端缓存首帧不一致。 */
export function useHydrated() {
  return useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot)
}
