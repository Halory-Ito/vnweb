'use client'

import { usePathname } from 'next/navigation'
import { Field } from '../ui/field'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  FilterIcon,
  HomeIcon,
  MoonIcon,
  SunIcon,
} from 'lucide-react'
import ThemeSwitch from './theme-switch'

export default function Header() {
  const pathname = usePathname()
  return (
    <div className="w-full p-4 flex items-center justify-between border-b">
      <div className="flex space-x-4">
        <Button variant="outline" size="icon">
          <ArrowLeftIcon className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon">
          <ArrowRightIcon className="w-4 h-4" />
        </Button>
        {pathname.startsWith('/game') && (
          <>
            <Field orientation="horizontal">
              <Input type="search" placeholder="搜索......" />
            </Field>
            <Button variant="outline" size="icon">
              <HomeIcon className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon">
              <FilterIcon className="w-4 h-4" />
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
