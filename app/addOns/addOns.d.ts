type AddOnesProps = {
  id: string
  name: string
  description: string
  version: string
  icon: string
  authors?: string[]
  installed?: boolean
  stars?: number
  from?: 'market' | 'local' | 'github'
}
