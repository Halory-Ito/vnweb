export type NoteTheme = {
  border: string
  tape: string
  badge: string
  accent: string
  tilt: string
}

export const QUOTE_NOTE_THEMES: NoteTheme[] = [
  {
    border: 'border-rose-300/70 dark:border-rose-400/35 hover:border-rose-400',
    tape: 'bg-rose-200/80 dark:bg-rose-400/30 border-rose-300/60 dark:border-rose-300/20',
    badge: 'border-rose-300/70 text-rose-600 dark:text-rose-300',
    accent: 'text-rose-400/40 dark:text-rose-300/25',
    tilt: '-rotate-[0.8deg]',
  },
  {
    border: 'border-amber-300/70 dark:border-amber-400/35 hover:border-amber-400',
    tape: 'bg-amber-200/80 dark:bg-amber-400/30 border-amber-300/60 dark:border-amber-300/20',
    badge: 'border-amber-300/70 text-amber-700 dark:text-amber-300',
    accent: 'text-amber-400/45 dark:text-amber-300/25',
    tilt: 'rotate-[0.7deg]',
  },
  {
    border: 'border-emerald-300/70 dark:border-emerald-400/35 hover:border-emerald-400',
    tape: 'bg-emerald-200/80 dark:bg-emerald-400/30 border-emerald-300/60 dark:border-emerald-300/20',
    badge: 'border-emerald-300/70 text-emerald-700 dark:text-emerald-300',
    accent: 'text-emerald-400/40 dark:text-emerald-300/25',
    tilt: '-rotate-[0.5deg]',
  },
  {
    border: 'border-sky-300/70 dark:border-sky-400/35 hover:border-sky-400',
    tape: 'bg-sky-200/80 dark:bg-sky-400/30 border-sky-300/60 dark:border-sky-300/20',
    badge: 'border-sky-300/70 text-sky-700 dark:text-sky-300',
    accent: 'text-sky-400/40 dark:text-sky-300/25',
    tilt: 'rotate-[0.9deg]',
  },
  {
    border: 'border-violet-300/70 dark:border-violet-400/35 hover:border-violet-400',
    tape: 'bg-violet-200/80 dark:bg-violet-400/30 border-violet-300/60 dark:border-violet-300/20',
    badge: 'border-violet-300/70 text-violet-700 dark:text-violet-300',
    accent: 'text-violet-400/40 dark:text-violet-300/25',
    tilt: '-rotate-[0.6deg]',
  },
]

export function getQuoteNoteTheme(id: number): NoteTheme {
  return QUOTE_NOTE_THEMES[Math.abs(id) % QUOTE_NOTE_THEMES.length]
}
