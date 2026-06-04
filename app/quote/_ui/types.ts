export type GameOption = {
  id: string
  label: string
}

export type CharacterOption = {
  id: string
  name: string
}

export type QuoteFormState = {
  gameId: string
  content: string
  characterId: string
  context: string
}

export type ViewMode = 'table' | 'grid'
