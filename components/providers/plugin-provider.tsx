'use client'

import { useEffect, useState } from 'react'

import { bootstrapPlugins } from '@/lib/plugins/init'

/** 客户端插件引导组件，在应用启动时注册所有插件 */
export default function PluginProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    void bootstrapPlugins().then(() => setReady(true))
  }, [])

  // 插件加载完成前不渲染子组件，避免闪烁
  if (!ready) return null

  return <>{children}</>
}
