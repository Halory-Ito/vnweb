'use client'

import AppearanceContent from './appearance/appearance-content'
import CloudSync from '@/components/settings/cloud-sync'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function Settings() {
  return (
    <Tabs
      defaultValue="general"
      className="max-h-[calc(100vh-144px)] w-full overflow-y-scroll"
    >
      <TabsList className="dark:bg-transparent">
        <TabsTrigger value="general">通用</TabsTrigger>
        <TabsTrigger value="appearance">外观</TabsTrigger>
        <TabsTrigger value="sync">云同步</TabsTrigger>
        <TabsTrigger value="database">数据库</TabsTrigger>
      </TabsList>
      <TabsContent className="h-full w-full" value="general">
        通用
      </TabsContent>
      <TabsContent value="appearance">
        <AppearanceContent />
      </TabsContent>
      <TabsContent value="sync">
        <CloudSync />
      </TabsContent>
      <TabsContent value="database">数据库</TabsContent>
    </Tabs>
  )
}
