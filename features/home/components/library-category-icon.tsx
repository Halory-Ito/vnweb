import { FolderIcon } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

export default function LibraryCategoryIcon({ logo }: { logo?: string }) {
  const [failed, setFailed] = useState(false)

  if (!logo || failed) return <FolderIcon className="size-4 shrink-0" aria-hidden />

  return (
    <Image
      src={logo}
      alt=""
      width={16}
      height={16}
      unoptimized
      referrerPolicy="no-referrer"
      className="size-4 shrink-0 object-contain"
      onError={() => setFailed(true)}
    />
  )
}
