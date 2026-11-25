'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSelectedLayoutSegment } from 'next/navigation'

import { isActiveSection, primaryNavigation, settingsNavigation } from './app-navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const SIDEBAR_BUTTON_SIZE = 'h-10 w-10'

function SidebarIconButton({
  item,
  section,
}: {
  item: (typeof primaryNavigation)[number]
  section: string | null
}) {
  const Icon = item.icon
  const isActive = isActiveSection(section, item.href)

  return (
    <SidebarMenuItem>
      <Tooltip>
        <TooltipTrigger asChild>
          <SidebarMenuButton
            asChild
            isActive={isActive}
            className={cn(
              SIDEBAR_BUTTON_SIZE,
              'transition-colors duration-200',
              isActive
                ? 'relative bg-primary/10 text-primary before:absolute before:top-1/2 before:left-0 before:h-5 before:w-0.75 before:-translate-y-1/2 before:rounded-r-full before:bg-primary before:content-[""] dark:bg-primary/20'
                : 'hover:bg-sidebar-accent/60',
            )}
          >
            <Link
              href={item.href}
              aria-label={item.title}
              aria-current={isActive ? 'page' : undefined}
              className="justify-center"
            >
              <Icon />
              <span className="sr-only">{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </TooltipTrigger>
        <TooltipContent side="right">{item.title}</TooltipContent>
      </Tooltip>
    </SidebarMenuItem>
  )
}

export default function AppSideBar() {
  const section = useSelectedLayoutSegment()

  return (
    <Sidebar
      collapsible="none"
      className="bg-background dark:bg-input/0 dark:border-input w-24 border-r shadow-xs"
    >
      <SidebarHeader className="items-center pt-4">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-md font-semibold"
          aria-label="VNWeb Logo"
        >
          <Image
            src="/LOGO.png"
            alt="VNWeb Logo"
            width={36}
            loading="eager"
            height={36}
            className="object-contain"
          />
        </Link>
      </SidebarHeader>

      <SidebarContent className="p-4">
        <SidebarMenu className="flex flex-col items-center justify-center">
          {primaryNavigation.map((item) => (
            <SidebarIconButton key={item.title} item={item} section={section} />
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="items-center pb-4">
        <SidebarMenu className="gap-4 p-4">
          <SidebarIconButton item={settingsNavigation} section={section} />
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
