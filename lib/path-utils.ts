import fs from 'fs/promises'
import os from 'os'
import path from 'path'

export const listFonts = async () => {
  if (process.platform === 'win32') {
    const fontsDir = path.join(
      os.homedir(),
      'AppData',
      'Local',
      'Microsoft',
      'Windows',
      'Fonts',
    )
    try {
      const files = await fs.readdir(fontsDir)
      return files.filter(
        (file) => file.endsWith('.ttf') || file.endsWith('.otf'),
      )
    } catch (err) {
      console.error('Error reading fonts directory:', err)
      return []
    }
  }
}
