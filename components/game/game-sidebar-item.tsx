'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { GameSidebarItemProps } from '@/types/game-types'

export const GameSidebarItem = ({ title, icon, id }: GameSidebarItemProps) => {
  const pathname = usePathname()
  return (
    <Link
      className={`flex items-center space-x-2 rounded-md p-1 hover:bg-blue-200 dark:hover:bg-blue-800/90 ${pathname === `/game/info/${id}` ? 'bg-blue-200 dark:bg-blue-800/90' : ''}`}
      href={`/game/info/${id}`}
    >
      <Image alt={title} src={icon} width={16} height={16} />
      <div className="truncate">{title}</div>
    </Link>
  )
}
