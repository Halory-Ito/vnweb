import Image from 'next/image'

import { GameSidebarItem } from './game-sidebar-item'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { GameSidebarProps } from '@/types/game-types'

export default function GameSidebar() {
  const items = generateData(5, 10)

  return (
    <Accordion type="multiple" className="w-full">
      {items.map((item) => (
        <AccordionItem key={item.id} value={item.id} className="border-none">
          <AccordionTrigger className="cursor-pointer p-2 font-bold hover:no-underline">
            {`${item.title} (${item.items.length})`}
          </AccordionTrigger>
          <AccordionContent className="space-y-2 p-2">
            {item.items.map((subItem) => (
              <GameSidebarItem key={subItem.id} {...subItem} />
              // <div key={subItem.id} className="flex items-center space-x-2">
              //   <Image
              //     alt={subItem.title}
              //     src={subItem.icon}
              //     width={16}
              //     height={16}
              //   />
              //   <div className="truncate">{subItem.title}</div>
              // </div>
            ))}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

const generateData = (col: number, length: number): GameSidebarProps[] => {
  const data: GameSidebarProps[] = []
  for (let i = 0; i < length; i++) {
    const items = []
    for (let j = 0; j < col; j++) {
      items.push({
        id: `${i}-${j}`,
        title: `游戏${i}-${j}`,
        icon: '/file.svg',
      })
    }
    data.push({
      id: `${i}`,
      title: `分类${i}`,
      items,
    })
  }
  return data
}
