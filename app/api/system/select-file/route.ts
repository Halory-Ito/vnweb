import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'node:child_process'

type SelectFilePayload = {
  filter?: string
  title?: string
}

const selectFile = async (filter?: string, title?: string) => {
  return new Promise<string | null>((resolve) => {
    const filterParam = filter ? `$dialog.Filter = "${filter}"` : ''
    const titleParam = title || '选择文件'

    const script = `
      Add-Type -AssemblyName System.Windows.Forms
      $dialog = New-Object System.Windows.Forms.OpenFileDialog
      $dialog.Title = "${titleParam}"
      $dialog.Multiselect = $false
      ${filterParam}
      if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
        Write-Output $dialog.FileName
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

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json().catch(() => ({}))) as SelectFilePayload
    const filePath = await selectFile(payload.filter, payload.title)

    if (!filePath) {
      return NextResponse.json({ error: '未选择文件' }, { status: 400 })
    }

    return NextResponse.json({ data: { filePath } })
  } catch (error) {
    console.error('Select file failed:', error)
    return NextResponse.json({ error: '选择文件失败' }, { status: 500 })
  }
}
