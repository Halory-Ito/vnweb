'use client'

import { motion } from 'motion/react'
import { use } from 'react'

import { OstAlbumHero } from '@/features/ost/components/ost-album-hero'
import { SongDeleteDialog } from '@/features/ost/components/song-delete-dialog'
import { SongFormDialog } from '@/features/ost/components/song-form-dialog'
import { SongLyricDialog } from '@/features/ost/components/song-lyric-dialog'
import { SongManageContent } from '@/features/ost/components/song-manage-content'
import { SongMiniPlayer } from '@/features/ost/components/song-mini-player'
import { SongSearchToolbar } from '@/features/ost/components/song-search-toolbar'
import { useSongManage } from '@/features/ost/hooks/use-song-manage'
import { useSongPlayer } from '@/features/ost/hooks/use-song-player'

export default function SongPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const ostId = Number(resolvedParams.id)
  const manage = useSongManage(ostId)
  const player = useSongPlayer(manage.filteredItems, manage.ostItem?.resource)

  return (
    <div className="max-h-[calc(100vh-70px)] w-full space-y-5 overflow-x-hidden overflow-y-scroll p-4 sm:p-5">
      <OstAlbumHero
        ostId={ostId}
        ostItem={manage.ostItem}
        songCount={manage.filteredItems.length}
        isPlaying={player.isPlaying}
        onPlayAll={() => {
          const first = manage.filteredItems[0]
          if (first) void player.playSong(first)
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.08 }}
        className="space-y-5"
      >
        <SongSearchToolbar
          keywordInput={manage.keywordInput}
          onKeywordInputChange={manage.setKeywordInput}
          onSearch={() => {}}
          onReset={() => manage.setKeywordInput('')}
          onCreate={manage.openCreateDialog}
        />

        <SongManageContent
          items={manage.filteredItems}
          isLoading={manage.isLoading}
          isRefetching={manage.isRefetching}
          playingSongId={player.currentSong?.id ?? null}
          isPlaying={player.isPlaying}
          isBuffering={player.isBuffering}
          onPlay={(item) => void player.playSong(item)}
          onEdit={manage.openEditDialog}
          onDelete={manage.setPendingDelete}
          onPreviewLyric={manage.setLyricPreviewItem}
        />
      </motion.div>

      <SongMiniPlayer
        song={player.currentSong}
        isPlaying={player.isPlaying}
        isBuffering={player.isBuffering}
        currentTime={player.currentTime}
        duration={player.duration}
        volume={player.volume}
        onTogglePlay={() => {
          if (player.currentSong) void player.playSong(player.currentSong)
        }}
        onPrev={player.playPrev}
        onNext={player.playNext}
        onSeek={player.seek}
        onVolumeChange={player.setVolume}
        onPreviewLyric={manage.setLyricPreviewItem}
        onClose={player.stop}
      />

      <SongFormDialog
        open={manage.dialogOpen}
        editingItem={manage.editingItem}
        isSubmitting={manage.isSubmitting}
        onOpenChange={manage.handleDialogOpenChange}
        onSubmit={manage.handleSubmit}
      />

      <SongDeleteDialog
        item={manage.pendingDelete}
        isSubmitting={manage.isSubmitting}
        onOpenChange={(open) => {
          if (!open) {
            manage.setPendingDelete(null)
          }
        }}
        onConfirm={manage.handleDelete}
      />

      <SongLyricDialog
        item={manage.lyricPreviewItem}
        onOpenChange={(open) => {
          if (!open) {
            manage.setLyricPreviewItem(null)
          }
        }}
      />
    </div>
  )
}
