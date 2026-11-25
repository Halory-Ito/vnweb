import { ensureDatabaseMigrated } from '../lib/server/database-migrate'

async function main() {
  await ensureDatabaseMigrated()
  console.log('  数据库迁移完成。')
}

main().catch((error) => {
  console.error('数据库迁移失败:', error instanceof Error ? error.message : error)
  process.exit(1)
})
