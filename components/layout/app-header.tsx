'use client'

import { ArrowLeftIcon, ArrowRightIcon, FilterIcon } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'

import GameAddButton from '../vndb/vndb-trigger'
import ThemeSwitch from './theme-switch'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

export default function AppHeader() {
  const pathname = usePathname()
  const router = useRouter()
  return (
    <div className="flex w-full items-center justify-between border-b p-4">
      <div className="flex space-x-4">
        <Button onClick={router.back} variant="outline" size="icon">
          <ArrowLeftIcon />
        </Button>
        <Button onClick={router.forward} variant="outline" size="icon">
          <ArrowRightIcon />
        </Button>
        <GameAddButton />
        {pathname.startsWith('/game') && (
          <>
            <Field orientation="horizontal">
              <Input
                className="w-28 sm:w-64 md:w-72 lg:w-96"
                type="search"
                placeholder="搜索"
              />
            </Field>
            {/* <Button variant="outline" size="icon">
              <HomeIcon className="w-4 h-4" />
            </Button> */}
            <Button variant="outline" size="icon">
              <FilterIcon />
            </Button>
          </>
        )}
      </div>
      <div className="flex">
        <ThemeSwitch />
      </div>
    </div>
  )
}
