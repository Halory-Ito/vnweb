import { useState, type ReactNode } from 'react'

import { Button } from '../ui/button'
import { Input } from '../ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getGameInfoByIdApi } from '@/lib/vndb-utils'
import { GameInfo } from '@/types/game-types'

type VNDBSearchDialogProps = {
  children: ReactNode
}

export const VNDBSearchDialog = ({ children }: VNDBSearchDialogProps) => {
  const [gameName, setGameName] = useState<string>('')
  const [gameId, setGameId] = useState<string>('')
  const [provider, setProvider] = useState<string>('bangumi')
  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null)

  const handleSearchById = async () => {
    const res = await getGameInfoByIdApi(gameId, provider)
    if (res === null) {
      return
    }
    setGameInfo(res)
    console.log('Game Info:', res)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>添加游戏</DialogTitle>
          <DialogDescription>从游戏数据库中导入</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="min-w-16">数据来源</div>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger className="min-w-32">
                <SelectValue defaultValue={provider} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="vndb">VNDB</SelectItem>
                  <SelectItem value="ymgal">YMGal</SelectItem>
                  <SelectItem value="steam">Steam</SelectItem>
                  <SelectItem value="igdb">IGDB</SelectItem>
                  <SelectItem value="dlsite">DLsite</SelectItem>
                  <SelectItem value="bangumi">Bangumi</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-4">
            <div className="min-w-16">游戏名称</div>
            <Input
              type="text"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
            />
            <Button type="button" variant="outline">
              搜索
            </Button>
          </div>
          <div className="flex items-center space-x-4">
            <div className="min-w-16">游戏 ID</div>
            <Input
              type="text"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
            />
            <Button type="button" variant="outline" onClick={handleSearchById}>
              识别
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export const SteamImportDialog = ({ children }: VNDBSearchDialogProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import from Steam</DialogTitle>
          <DialogDescription>
            Import visual novels from Steam.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}
