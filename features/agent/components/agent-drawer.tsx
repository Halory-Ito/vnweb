'use client'

import { BotIcon, XIcon } from 'lucide-react'
import { useState } from 'react'

import { AgentChatPanel } from './agent-chat-panel'
import { AgentConfigPanel } from './agent-config-panel'
import { AgentWebMcpPanel } from './agent-webmcp-panel'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAgentChat } from '@/features/agent/hooks/use-agent-chat'
import { useAgentConfig } from '@/features/agent/hooks/use-agent-config'
import { useWebMcpTools } from '@/features/agent/hooks/use-webmcp-tools'

/** 全局 AI 助手入口：Header 图标按钮 + 右侧抽屉（WebMCP / 对话 / 配置） */
export function AgentDrawer() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('chat')

  const { config, isLoading, isSaving, save } = useAgentConfig()
  const { tools, status, refresh } = useWebMcpTools()
  const chat = useAgentChat({ configId: config.activeConfigId })

  const handleActiveConfigChange = (configId: string) => {
    void save({ ...config, activeConfigId: configId })
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon" aria-label="AI 助手" onClick={() => setOpen(true)}>
            <BotIcon />
          </Button>
        </TooltipTrigger>
        <TooltipContent>AI 助手</TooltipContent>
      </Tooltip>

      <Drawer direction="right" open={open} onOpenChange={setOpen}>
        <DrawerContent className="gap-0" style={{ width: 'min(100vw, 32rem)', maxWidth: 'none' }}>
          <DrawerHeader className="flex-row items-center justify-between gap-0 border-b p-4">
            <DrawerTitle>AI 助手</DrawerTitle>
            <DrawerDescription className="sr-only">
              AI 助手面板：查看 WebMCP 工具、与模型对话、管理模型配置
            </DrawerDescription>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon-sm" aria-label="关闭">
                <XIcon />
              </Button>
            </DrawerClose>
          </DrawerHeader>

          <Tabs value={tab} onValueChange={setTab} className="min-h-0 flex-1">
            <TabsList className="mx-4 mt-3">
              <TabsTrigger value="webmcp">WebMCP</TabsTrigger>
              <TabsTrigger value="chat">对话</TabsTrigger>
              <TabsTrigger value="config">配置</TabsTrigger>
            </TabsList>

            <TabsContent value="webmcp" className="min-h-0">
              <AgentWebMcpPanel tools={tools} status={status} onRefresh={refresh} />
            </TabsContent>

            <TabsContent value="chat" className="min-h-0">
              <AgentChatPanel
                chat={chat}
                toolCount={tools.length}
                configs={config.configs}
                activeConfigId={config.activeConfigId}
                onActiveConfigChange={handleActiveConfigChange}
                onOpenConfig={() => setTab('config')}
              />
            </TabsContent>

            <TabsContent value="config" className="min-h-0">
              <AgentConfigPanel
                config={config}
                isLoading={isLoading}
                isSaving={isSaving}
                save={save}
              />
            </TabsContent>
          </Tabs>
        </DrawerContent>
      </Drawer>
    </>
  )
}
