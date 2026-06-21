import { NextResponse } from 'next/server'
import { spawn } from 'node:child_process'

const selectDirectory = async () => {
  return new Promise<string | null>((resolve) => {
    const script = `
      $OutputEncoding = [System.Text.Encoding]::UTF8
      [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
      Add-Type -AssemblyName System.Windows.Forms
      $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
      $dialog.Description = "选择扫描目录"
      $dialog.ShowNewFolderButton = $true
      if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
        Write-Output $dialog.SelectedPath
      }
    `

    const child = spawn('powershell.exe', ['-NoProfile', '-Command', script], {
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    let stdout = ''
    child.stdout.on('data', (data: Buffer) => {
      stdout += data.toString()
    })

    child.on('close', (code) => {
      if (code === 0 && stdout.trim()) {
        resolve(stdout.trim())
      } else {
        resolve(null)
      }
    })

    child.on('error', () => {
      resolve(null)
    })
  })
}

export async function POST() {
  try {
    const directory = await selectDirectory()

    if (!directory) {
      return NextResponse.json(
        { error: '未选择目录' },
        { status: 400 },
      )
    }

    return NextResponse.json({ data: { directory } })
  } catch (error) {
    console.error('Select directory failed:', error)
    return NextResponse.json(
      { error: '选择目录失败' },
      { status: 500 },
    )
  }
}
