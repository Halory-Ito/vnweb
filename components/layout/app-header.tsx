'use client'

import { ArrowLeftIcon, ArrowRightIcon, FilterIcon } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'

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
          <ArrowLeftIcon className="h-4 w-4" />
        </Button>
        <Button onClick={router.forward} variant="outline" size="icon">
          <ArrowRightIcon className="h-4 w-4" />
        </Button>
        {pathname.startsWith('/game') && (
          <>
            <Field orientation="horizontal">
              <Input type="search" placeholder="搜索......" />
            </Field>
            {/* <Button variant="outline" size="icon">
              <HomeIcon className="w-4 h-4" />
            </Button> */}
            <Button variant="outline" size="icon">
              <FilterIcon className="h-4 w-4" />
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
