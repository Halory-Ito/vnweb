'use client'

import { formatToday, getGreeting } from '../lib/format-utils'

export default function WelcomeBar() {
  const greeting = getGreeting(new Date().getHours())
  const dateText = formatToday()

  return (
    <div className="min-w-0">
      <h1 className="text-xl font-bold sm:text-2xl">{greeting}</h1>
      <p className="text-muted-foreground text-sm">{dateText}</p>
    </div>
  )
}
