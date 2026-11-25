'use client'

import { MenuIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useSelectedLayoutSegment } from 'next/navigation'

import { isActiveSection, primaryNavigation, settingsNavigation } from './app-navigation'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const navItems = [...primaryNavigation, settingsNavigation]

export default function MobileNav({
  open,
  onOpenChange,
  showTrigger,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  showTrigger: boolean
}) {
  const section = useSelectedLayoutSegment()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {showTrigger ? (
        <SheetTrigger asChild>
          <Button variant="outline" size="icon-lg" className="shrink-0">
            <MenuIcon className="h-5 w-5" />
            <span className="sr-only">打开菜单</span>
          </Button>
        </SheetTrigger>
      ) : null}
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="flex items-center gap-3">
            <Image
              src="/LOGO.png"
              alt=""
              loading="eager"
              width={32}
              height={32}
              className="object-contain"
            />
            <span>VNWeb</span>
          </SheetTitle>
          <SheetDescription className="sr-only">
            站点主导航，包含主页、游戏库、记录、扫描、攻略、PV、OST、摘录与设置等入口
          </SheetDescription>
        </SheetHeader>
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = isActiveSection(section, item.href)

              return (
                <li key={item.title}>
                  <SheetClose asChild>
                    <Link
                      href={item.href}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                      )}
                    >
                      <Icon className="size-5" />
                      {item.title}
                    </Link>
                  </SheetClose>
                </li>
              )
            })}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
