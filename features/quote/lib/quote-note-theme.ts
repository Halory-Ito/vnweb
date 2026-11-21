const NOTE_TILTS = [
  '-rotate-[0.8deg]',
  'rotate-[0.7deg]',
  '-rotate-[0.5deg]',
  'rotate-[0.9deg]',
  '-rotate-[0.6deg]',
]

export function getQuoteNoteTheme(id: number) {
  const index = Math.abs(id) % NOTE_TILTS.length

  return {
    color: `var(--chart-${index + 1})`,
    tilt: NOTE_TILTS[index],
  }
}
