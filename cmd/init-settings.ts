import { constants } from 'node:fs'
import { copyFile, mkdir, readdir } from 'node:fs/promises'
import path from 'node:path'

import { DATA_SETTINGS_DIR, readConfig } from '../lib/server/config-rw'

async function initializeSettings() {
  const exampleDir = path.resolve('data', 'example')
  const entries = await readdir(exampleDir, { withFileTypes: true })
  const examples = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
  if (!examples.length) throw new Error('data/example 中没有 JSON 示例文件')

  // Run the existing legacy migration before creating any missing settings files.
  await readConfig()
  await mkdir(DATA_SETTINGS_DIR, { recursive: true })

  for (const { name } of examples) {
    const target = path.join(DATA_SETTINGS_DIR, name)
    try {
      await copyFile(path.join(exampleDir, name), target, constants.COPYFILE_EXCL)
      console.log(`  已创建：data/settings/${name}`)
    } catch (error) {
      if (!(error instanceof Error) || !('code' in error) || error.code !== 'EEXIST') throw error
      console.log(`  已存在：data/settings/${name}`)
    }
  }
}

initializeSettings().catch((error) => {
  console.error(error instanceof Error ? error.message : '配置初始化失败')
  process.exitCode = 1
})
