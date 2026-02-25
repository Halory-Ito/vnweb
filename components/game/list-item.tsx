import { BadgeCheckIcon, ChevronRightIcon, Icon } from 'lucide-react'
import Image from 'next/image'

import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemActions,
} from '@/components/ui/item'

export const GameListItem = () => {
  return (
    <Item size="sm" asChild>
      <div>
        <ItemMedia>
          <Image alt="弹丸论破" src={'/vercel.svg'} width={16} height={16} />
        </ItemMedia>
        <ItemContent className="truncate">弹丸论破</ItemContent>
        {/* <ItemActions>
            <ChevronRightIcon className="size-4" />
          </ItemActions> */}
      </div>
    </Item>
  )
}
