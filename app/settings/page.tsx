'use client'

import AppearanceContent from './appearance/appearance-content'
import BackupSettingsContent from './backup/backup-settings-content'
import CloudSync from '@/components/settings/cloud-sync'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function Settings() {
  return (
    <Tabs
      defaultValue="appearance"
      className="max-h-[calc(100vh-144px)] w-full overflow-y-scroll"
    >
      <TabsList className="dark:bg-transparent">
        <TabsTrigger value="appearance">外观</TabsTrigger>
        <TabsTrigger value="backup">备份</TabsTrigger>
        <TabsTrigger value="sync">云同步</TabsTrigger>
      </TabsList>
      <TabsContent value="appearance">
        <AppearanceContent />
      </TabsContent>
      <TabsContent value="backup">
        <BackupSettingsContent />
      </TabsContent>
      <TabsContent value="sync">
        <CloudSync />
      </TabsContent>
    </Tabs>
  )
}
