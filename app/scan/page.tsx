'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { getBGMSubjectByIdApi, searchBGMSubjectsApi } from '@/lib/vndb-utils'

export default function Scan() {
  const [data, setData] = useState<any>(null)

  // const fecthData = async () => {
  //   const res = await searchBGMSubjectsApi('fsn', 0)
  //   setData(res)
  // }

  const fetchSubjectById = async () => {
    const res = await getBGMSubjectByIdApi('935')
    setData(res)
  }

  return (
    <div className="flex h-32 flex-col items-center justify-center space-y-4">
      {/* <Button onClick={fecthData}>test search subjects from bgm</Button> */}
      <Button onClick={fetchSubjectById}>test get subject by id</Button>
      <div>{data && data?.name}</div>
    </div>
  )
}
