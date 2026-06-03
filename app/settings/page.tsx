'use client'

import AppearanceContent from './appearance/appearance-content'
import BackupSettingsContent from './backup/backup-settings-content'
import ProxyPage from './proxy/page'
import ThemeContent from './theme/theme-content'
import CloudSync from '@/components/settings/cloud-sync'
import ProviderSettings from '@/components/settings/provider-settings'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function Settings() {
  return (
    <Tabs
      defaultValue="appearance"
      className="max-h-[calc(100vh-144px)] w-full overflow-y-scroll"
    >
      <TabsList className="dark:bg-transparent">
        <TabsTrigger value="appearance">外观</TabsTrigger>
        <TabsTrigger value="theme">主题</TabsTrigger>
        <TabsTrigger value="backup">备份</TabsTrigger>
        <TabsTrigger value="sync">云同步</TabsTrigger>
        <TabsTrigger value="proxy">代理</TabsTrigger>
        <TabsTrigger value="plugins">插件</TabsTrigger>
      </TabsList>
      <TabsContent value="appearance">
        <AppearanceContent />
      </TabsContent>
      <TabsContent value="theme">
        <ThemeContent />
      </TabsContent>
      <TabsContent value="backup">
        <BackupSettingsContent />
      </TabsContent>
      <TabsContent value="sync">
        <CloudSync />
      </TabsContent>
      <TabsContent value="proxy">
        <ProxyPage />
      </TabsContent>
      <TabsContent value="plugins">
        <ProviderSettings />
      </TabsContent>
    </Tabs>
  )
}
