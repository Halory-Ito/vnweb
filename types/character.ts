export type VndbCharacterListItem = {
  id: string
  name: string
  original: string
  imageUrl: string
  role: 'main' | 'primary' | 'side' | 'appears' | ''
}

export type CharacterSyncSource = string

export type CharacterMergeStrategy =
  | 'prefer_vndb'
  | 'prefer_bangumi'
  | 'prefer_bangumi_with_vndb_fallback'

export type VndbCharacterDetail = {
  id: string
  name: string
  original: string
  description: string
  imageUrl: string
  bloodType: string
  height: number | null
  weight: number | null
  bust: number | null
  waist: number | null
  hips: number | null
  cup: string
  age: number | null
  birthday: [number, number] | null
  sex: [string | null, string | null] | null
  gender: [string | null, string | null] | null
}
