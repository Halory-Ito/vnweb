'use client'

import AppearanceContent from './appearance/appearance-content'
import CloudSync from '@/components/settings/cloud-sync'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function Settings() {
  return (
    <Tabs
      defaultValue="website"
      className="max-h-[calc(100vh-144px)] w-full overflow-y-scroll"
    >
      <TabsList className="dark:bg-transparent">
        <TabsTrigger value="website">网站</TabsTrigger>
        <TabsTrigger value="appearance">外观</TabsTrigger>
        <TabsTrigger value="player">播放器</TabsTrigger>
        <TabsTrigger value="sync">云同步</TabsTrigger>
        <TabsTrigger value="database">数据库</TabsTrigger>
      </TabsList>
      <TabsContent className="h-full w-full" value="website">
        网站（支持自定义项目的LOGO和Title）
      </TabsContent>
      <TabsContent value="appearance">
        <AppearanceContent />
      </TabsContent>
      <TabsContent value="player">
        播放器：支持后台播放OST，即使切换了页面也不会关闭（获取还可以考虑把播放器和播放列表移动至前台）；或者还支持进入游戏信息页时，自动播放OST
      </TabsContent>
      <TabsContent value="sync">
        <CloudSync />
      </TabsContent>
      <TabsContent value="database">数据库</TabsContent>
    </Tabs>
  )
}
