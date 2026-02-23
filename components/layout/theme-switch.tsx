'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { MoonIcon, SunIcon } from 'lucide-react'

const ThemeSwitch = () => {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      aria-label="切换主题"
    >
      {resolvedTheme === 'dark' ? (
        <MoonIcon className="w-4 h-4" />
      ) : (
        <SunIcon className="w-4 h-4" />
      )}
    </Button>
  )
}

export default ThemeSwitch
