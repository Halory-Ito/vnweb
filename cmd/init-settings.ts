import { ensureDataSettingsSeeded } from '../lib/server/bootstrap'

async function initializeSettings() {
  const { created, existing } = await ensureDataSettingsSeeded()
  if (created.length === 0 && existing.length === 0) {
    throw new Error('data/example 中没有 JSON 示例文件')
  }

  for (const name of created) {
    console.log(`  已创建：data/settings/${name}`)
  }
  for (const name of existing) {
    console.log(`  已存在：data/settings/${name}`)
  }
}

initializeSettings().catch((error) => {
  console.error(error instanceof Error ? error.message : '配置初始化失败')
  process.exitCode = 1
})
