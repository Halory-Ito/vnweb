'use client'

import { TargetIcon, TimerIcon, TrophyIcon } from 'lucide-react'
import { useState } from 'react'

import { useGoals } from '../hooks/use-goals'
import { formatPlayDuration } from '../lib/format-utils'
import { DEFAULT_GOAL_SETTINGS, calcGoalPercent } from '../lib/goal-utils'
import GoalCard from './goal-card'
import GoalEditDialog from './goal-edit-dialog'
import SectionHeader from './section-header'

import type { GoalSettings } from '@/types'

export default function GoalSection() {
  const { settings, progress, isSaving, save } = useGoals()
  const [dialogOpen, setDialogOpen] = useState(false)

  const resolved = settings ?? DEFAULT_GOAL_SETTINGS
  const dailyTargetSeconds = resolved.dailyPlayMinutes * 60
  const dailyPercent = calcGoalPercent(progress?.todaySeconds ?? 0, dailyTargetSeconds)
  const yearlyPercent = calcGoalPercent(
    progress?.completedThisYear ?? 0,
    resolved.yearlyCompletedGames,
  )

  const handleSubmit = (value: GoalSettings) => {
    save(value)
    setDialogOpen(false)
  }

  return (
    <div className="w-full space-y-4">
      <SectionHeader icon={TargetIcon} title="目标" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <GoalCard
          title="每日游玩时长"
          icon={<TimerIcon className="size-4" />}
          currentText={formatPlayDuration(progress?.todaySeconds)}
          targetText={formatPlayDuration(dailyTargetSeconds)}
          percent={dailyPercent}
          onEdit={() => setDialogOpen(true)}
        />
        <GoalCard
          title="今年完成游戏"
          icon={<TrophyIcon className="size-4" />}
          currentText={`${progress?.completedThisYear ?? 0} 个`}
          targetText={`${resolved.yearlyCompletedGames} 个`}
          percent={yearlyPercent}
          onEdit={() => setDialogOpen(true)}
        />
      </div>
      <GoalEditDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        value={resolved}
        isSaving={isSaving}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
