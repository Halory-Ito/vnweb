'use client'

import AppearanceContent from './appearance/appearance-content'
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
        <TabsTrigger value="advanced">高级</TabsTrigger>
        <TabsTrigger value="metadata">元数据</TabsTrigger>
        <TabsTrigger value="theme">主题</TabsTrigger>
        <TabsTrigger value="sync">云同步</TabsTrigger>
        <TabsTrigger value="scraper">刮削器</TabsTrigger>
        <TabsTrigger value="database">数据库</TabsTrigger>
        <TabsTrigger value="network">网络</TabsTrigger>
        <TabsTrigger value="about">关于</TabsTrigger>
      </TabsList>
      <TabsContent className="h-full w-full" value="general">
        通用
      </TabsContent>
      <TabsContent value="appearance">
        <AppearanceContent />
      </TabsContent>
      <TabsContent value="advanced">高级</TabsContent>
      <TabsContent value="metadata">元数据</TabsContent>
      <TabsContent value="theme">主题</TabsContent>
      <TabsContent value="sync">云同步</TabsContent>
      <TabsContent value="scraper">刮削器</TabsContent>
      <TabsContent value="database">数据库</TabsContent>
      <TabsContent value="network">网络</TabsContent>
      <TabsContent value="about">关于</TabsContent>
    </Tabs>
  )
}
