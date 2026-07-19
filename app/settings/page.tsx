'use client'

import AppearancePage from './appearance/page'
import BackupSettingsContent from './backup/backup-settings-content'
import ProxyPage from './proxy/page'
import ThemeContent from './theme/theme-content'
import CloudSync from '@/components/settings/cloud-sync'
import PluginSettings from '@/components/settings/plugin-settings'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type SettingsPropsItem = {
  value: string
  name: string
  comp: React.ReactNode
}

type SettingsProps = SettingsPropsItem[]

const settingsItems: SettingsProps = [
  {
    value: 'appearance',
    name: '外观',
    comp: <AppearancePage />,
  },
  {
    value: 'theme',
    name: '主题',
    comp: <ThemeContent />,
  },
  {
    value: 'backup',
    name: '备份',
    comp: <BackupSettingsContent />,
  },
  {
    value: 'sync',
    name: '云同步',
    comp: <CloudSync />,
  },
  {
    value: 'proxy',
    name: '代理',
    comp: <ProxyPage />,
  },
  {
    value: 'plugins',
    name: '插件',
    comp: <PluginSettings />,
  },
]

export default function Settings() {
  return (
    <Tabs
      defaultValue={settingsItems[0].value}
      className="max-h-[calc(100vh-144px)] w-full overflow-y-scroll"
    >
      <TabsList className="dark:bg-transparent">
        {settingsItems.map((item) => (
          <TabsTrigger key={item.value} value={item.value}>
            {item.name}
          </TabsTrigger>
        ))}
      </TabsList>
      {settingsItems.map((item) => (
        <TabsContent key={item.value} value={item.value} className="pb-4">
          {item.comp}
        </TabsContent>
      ))}
    </Tabs>
  )
}
