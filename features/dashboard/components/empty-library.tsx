import { SearchX } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'

export default function EmptyLibrary() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <div className="bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-full border">
        <SearchX className="size-7" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">游戏库还是空的</h2>
        <p className="text-muted-foreground text-sm">
          扫描本地目录或手动导入游戏后，这里会展示游玩数据与热力图。
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button asChild variant="outline">
          <Link href="/scan">扫描游戏</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/game">前往游戏库</Link>
        </Button>
      </div>
    </div>
  )
}
