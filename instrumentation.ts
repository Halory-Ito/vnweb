export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  if (process.env.NEXT_PHASE === 'phase-production-build') return

  const { ensureRuntimeInitialized } = await import('@/lib/server/bootstrap')
  await ensureRuntimeInitialized()

  const { resumeRunningGameTrackers } = await import('@/lib/server/game-tracker')
  void resumeRunningGameTrackers().catch((error) => {
    console.error('[Instrumentation] Resume game trackers failed:', error)
  })
}
