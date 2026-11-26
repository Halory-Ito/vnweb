'use client'

import { useAtomValue } from 'jotai'
import { AlertCircle, ArrowLeftIcon } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import GameHomeEmptyState from '../components/empty-home'
import { GameHomeActions } from '../components/game-home-actions'
import LibraryFolders from '../components/library-folders'
import { useGameHome } from '../hooks/use-game-home'
import { getLibraryFolderTitle, resolveLibraryRouteParams } from '../lib/library-grouping'
import GameListHome from './game-list-home'
import { getGameCardList } from '@/api'
import { gameSearchAtom } from '@/atom/global'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyTitle } from '@/components/ui/empty'
import { useGameStatusNames } from '@/features/game/hooks/use-game-status-names'
import AllGame from '@/features/home/components/all-game'
import GameHomeSkeleton from '@/features/home/components/home-skeleton'
import { gameLibraryGridDisplayAtom } from '@/lib/settings/game-library-grid-display'
import { gameLibraryGroupAtom } from '@/lib/settings/game-library-group'
import { gameLibraryLayoutAtom } from '@/lib/settings/game-library-layout'

export type SelectableGameProps = {
  selectedGameIds: string[]
  selectionMode: boolean
  onToggleSelect: (id: string) => void
}

export type GameCardsData = Awaited<ReturnType<typeof getGameCardList>>

export default function GameHome() {
  const layout = useAtomValue(gameLibraryLayoutAtom)
  return layout === 'mixed' ? <GameListHome /> : <GameGridHome hybrid={layout === 'hybrid'} />
}

function GameGridHome({ hybrid }: { hybrid: boolean }) {
  const searchParams = useSearchParams()
  const { groupBy: linkedGroup, folderKey } = resolveLibraryRouteParams(searchParams)
  const gridDisplay = useAtomValue(gameLibraryGridDisplayAtom)
  const preferredGroup = useAtomValue(gameLibraryGroupAtom)
  const keyword = useAtomValue(gameSearchAtom).trim().toLowerCase()
  const isUngroupedGrid = !hybrid && gridDisplay === 'ungrouped'
  const activeFolder = isUngroupedGrid ? undefined : folderKey
  const groupBy = activeFolder === undefined ? preferredGroup : linkedGroup
  const isGroupedGridRoot = !hybrid && !isUngroupedGrid && activeFolder === undefined
  const showGroupedFolders = isGroupedGridRoot && !keyword
  const showSections = gridDisplay === 'sections'
  const hybridHeader = activeFolder === undefined ? 'plain' : 'folder'
  const { data: statusNames } = useGameStatusNames()
  const folderTitle =
    activeFolder === undefined
      ? undefined
      : getLibraryFolderTitle(groupBy, activeFolder, statusNames)
  const home = useGameHome({
    groupBy,
    folderKey: activeFolder,
    foldersOnly: showGroupedFolders && !showSections,
    showGameFilters: !showGroupedFolders,
    keyword,
  })

  if (home.gameCardsQuery.isLoading || home.collectionsQuery.isLoading) {
    return <GameHomeSkeleton />
  }

  if (home.gameCardsQuery.isError || home.collectionsQuery.isError) {
    return (
      <GameHomeEmptyState
        icon={AlertCircle}
        title="加载游戏主页失败"
        description="当前无法获取游戏或收藏数据，请稍后重试。"
      >
        <Button
          type="button"
          variant="outline"
          disabled={home.gameCardsQuery.isRefetching || home.collectionsQuery.isRefetching}
          onClick={() => {
            void home.gameCardsQuery.refetch()
            void home.collectionsQuery.refetch()
          }}
        >
          {home.gameCardsQuery.isRefetching || home.collectionsQuery.isRefetching
            ? '重试中...'
            : '重新加载'}
        </Button>
        <Button asChild>
          <Link href="/scan">前往扫描游戏</Link>
        </Button>
      </GameHomeEmptyState>
    )
  }

  if (home.gameCards.length === 0 && (isUngroupedGrid || (hybrid && activeFolder === undefined))) {
    return (
      <GameHomeEmptyState
        title="暂无游戏"
        description="当前游戏库还没有数据。可以先扫描目录或手动导入。"
      >
        <Button asChild>
          <Link href="/scan">前往扫描游戏</Link>
        </Button>
      </GameHomeEmptyState>
    )
  }

  return (
    <div className="@container/library max-h-[100cqh] w-full min-w-0 space-y-6 overflow-x-hidden overflow-y-auto p-3 sm:space-y-8 sm:p-4">
      {activeFolder !== undefined && !hybrid ? (
        <Button asChild variant="outline" size="sm">
          <Link href="/game/home">
            <ArrowLeftIcon /> {showSections ? '返回游戏库' : '返回文件夹'}
          </Link>
        </Button>
      ) : null}
      {showGroupedFolders ? (
        <LibraryFolders
          games={home.gameCards}
          collections={home.collections}
          groupBy={groupBy}
          showSections={showSections}
          selectedGameIds={home.selectedGameIds}
          selectionMode={home.selectionMode}
          onToggleSelect={home.handleToggleSelect}
          onCreate={() => home.setCreateCollectionOpen(true)}
          onDelete={home.handleRequestDeleteCollection}
        />
      ) : activeFolder === undefined || home.visibleGames.length > 0 || hybrid ? (
        <AllGame
          title={folderTitle}
          headerVariant={hybrid ? hybridHeader : 'card'}
          gameCards={home.gameFilters.filteredGames}
          filters={home.gameFilters}
          selectedGameIds={home.selectedGameIds}
          selectionMode={home.selectionMode}
          onToggleSelect={home.handleToggleSelect}
        />
      ) : (
        <Empty className="min-h-44">
          <EmptyTitle>{folderTitle}</EmptyTitle>
          <EmptyDescription>该分类下暂无游戏</EmptyDescription>
        </Empty>
      )}

      <GameHomeActions home={home} />
    </div>
  )
}
