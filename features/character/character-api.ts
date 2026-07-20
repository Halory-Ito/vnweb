import { api } from '@/lib/request-utils'

export type Character = {
  id: number
  gameId: number
  vndbId: string
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
  age: number | null
  birthdayMonth: number | null
  birthdayDay: number | null
  sex: string
  gender: string
}

// 根据 gameId 获取角色列表
export async function getCharactersByGameIdApi(gameId: number): Promise<Character[]> {
  const res = await api.request({
    method: 'GET',
    url: '/character',
    params: { gameId },
  })
  return res.data
}
