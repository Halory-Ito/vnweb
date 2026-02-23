import { redirect } from 'next/navigation'

export default function Game() {
  redirect('/game/home')
  return <div>Game</div>
}
