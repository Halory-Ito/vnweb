import { FolderIcon } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

import type { GameCardsData } from '../views/game-home'

export default function LibraryFolderCover({
  games,
  logo,
}: {
  games: GameCardsData
  logo?: string
}) {
  const [failedLogo, setFailedLogo] = useState<string>()
  const covers = games.filter(({ cover }) => cover).slice(0, 3)

  return (
    <span
      aria-hidden
      className="bg-muted/55 relative flex aspect-video items-stretch justify-center gap-1 overflow-hidden rounded-md p-1.5"
    >
      {logo && logo !== failedLogo ? (
        <Image
          fill
          unoptimized
          src={logo}
          alt=""
          sizes="240px"
          referrerPolicy="no-referrer"
          className="object-contain p-3"
          onError={() => setFailedLogo(logo)}
        />
      ) : covers.length ? (
        covers.map(({ id, cover }) => (
          <span
            key={id}
            className="bg-muted relative aspect-3/4 min-w-0 overflow-hidden rounded-sm"
          >
            <Image fill src={cover} alt="" sizes="88px" className="object-cover" />
          </span>
        ))
      ) : (
        <FolderIcon className="text-muted-foreground size-7 self-center" />
      )}
    </span>
  )
}
