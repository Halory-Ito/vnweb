import { execFile } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

function buildPowerShellScript(): string {
  return String.raw`
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

$exePath = [System.IO.Path]::GetFullPath($env:EXE_PATH)
$iconPath = [System.IO.Path]::GetFullPath($env:ICON_PATH)

if (-not (Test-Path -LiteralPath $exePath)) {
	throw "EXE file not found: $exePath"
}

$outputDir = [System.IO.Path]::GetDirectoryName($iconPath)
if ($outputDir -and -not (Test-Path -LiteralPath $outputDir)) {
	New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

function Save-IconToFile {
	param(
		[Parameter(Mandatory = $true)]
		[System.Drawing.Icon]$Icon,
		[Parameter(Mandatory = $true)]
		[string]$OutputPath
	)

	if (-not $Icon) {
		return $false
	}

	$ext = [System.IO.Path]::GetExtension($OutputPath).ToLowerInvariant()

	if ($ext -eq '.ico') {
		$stream = [System.IO.File]::Open($OutputPath, [System.IO.FileMode]::Create, [System.IO.FileAccess]::Write)
		try {
			$Icon.Save($stream)
		}
		finally {
			$stream.Dispose()
		}
		return $true
	}

	$bitmap = $Icon.ToBitmap()
	try {
		switch ($ext) {
			'.png' { $format = [System.Drawing.Imaging.ImageFormat]::Png }
			'.jpg' { $format = [System.Drawing.Imaging.ImageFormat]::Jpeg }
			'.jpeg' { $format = [System.Drawing.Imaging.ImageFormat]::Jpeg }
			'.bmp' { $format = [System.Drawing.Imaging.ImageFormat]::Bmp }
			default {
				$format = [System.Drawing.Imaging.ImageFormat]::Png
				$OutputPath = [System.IO.Path]::ChangeExtension($OutputPath, '.png')
			}
		}

		$bitmap.Save($OutputPath, $format)
		Write-Output $OutputPath
		return $true
	}
	finally {
		$bitmap.Dispose()
	}
}

function Try-ExtractFromExeFile {
	param(
		[string]$Exe,
		[string]$Output
	)

	$icon = [System.Drawing.Icon]::ExtractAssociatedIcon($Exe)
	if (-not $icon) {
		return $false
	}

	try {
		return (Save-IconToFile -Icon $icon -OutputPath $Output)
	}
	finally {
		$icon.Dispose()
	}
}

Add-Type @"
using System;
using System.Runtime.InteropServices;

public static class Win32Icon {
	public const int WM_GETICON = 0x007F;
	public const int ICON_SMALL2 = 2;
	public const int ICON_SMALL = 0;
	public const int ICON_BIG = 1;
	public const int GCL_HICON = -14;
	public const int GCL_HICONSM = -34;

	[DllImport("user32.dll", CharSet = CharSet.Auto)]
	public static extern IntPtr SendMessage(IntPtr hWnd, int msg, IntPtr wParam, IntPtr lParam);

	[DllImport("user32.dll", EntryPoint = "GetClassLongPtr", SetLastError = true)]
	public static extern IntPtr GetClassLongPtr64(IntPtr hWnd, int nIndex);

	[DllImport("user32.dll", EntryPoint = "GetClassLong", SetLastError = true)]
	public static extern uint GetClassLong32(IntPtr hWnd, int nIndex);

	public static IntPtr GetClassLongPtr(IntPtr hWnd, int nIndex) {
		if (IntPtr.Size == 8) {
			return GetClassLongPtr64(hWnd, nIndex);
		}

		return new IntPtr((long)GetClassLong32(hWnd, nIndex));
	}
}
"@

function Try-ExtractFromRunningWindow {
	param(
		[string]$Exe,
		[string]$Output
	)

	$processes = Get-Process | Where-Object { $_.MainWindowHandle -ne 0 }

	foreach ($proc in $processes) {
		try {
			if (-not $proc.Path) {
				continue
			}

			$procExe = [System.IO.Path]::GetFullPath($proc.Path)
			if (-not [string]::Equals($procExe, $Exe, [System.StringComparison]::OrdinalIgnoreCase)) {
				continue
			}

			$hwnd = $proc.MainWindowHandle
			if ($hwnd -eq 0) {
				continue
			}

			$hIcon = [Win32Icon]::SendMessage($hwnd, [Win32Icon]::WM_GETICON, [IntPtr][Win32Icon]::ICON_SMALL2, [IntPtr]::Zero)
			if ($hIcon -eq [IntPtr]::Zero) {
				$hIcon = [Win32Icon]::SendMessage($hwnd, [Win32Icon]::WM_GETICON, [IntPtr][Win32Icon]::ICON_SMALL, [IntPtr]::Zero)
			}
			if ($hIcon -eq [IntPtr]::Zero) {
				$hIcon = [Win32Icon]::SendMessage($hwnd, [Win32Icon]::WM_GETICON, [IntPtr][Win32Icon]::ICON_BIG, [IntPtr]::Zero)
			}
			if ($hIcon -eq [IntPtr]::Zero) {
				$hIcon = [Win32Icon]::GetClassLongPtr($hwnd, [Win32Icon]::GCL_HICONSM)
			}
			if ($hIcon -eq [IntPtr]::Zero) {
				$hIcon = [Win32Icon]::GetClassLongPtr($hwnd, [Win32Icon]::GCL_HICON)
			}

			if ($hIcon -eq [IntPtr]::Zero) {
				continue
			}

			$tmpIcon = [System.Drawing.Icon]::FromHandle($hIcon)
			if (-not $tmpIcon) {
				continue
			}

			$iconCopy = [System.Drawing.Icon]$tmpIcon.Clone()
			$tmpIcon.Dispose()

			try {
				if (Save-IconToFile -Icon $iconCopy -OutputPath $Output) {
					return $true
				}
			}
			finally {
				$iconCopy.Dispose()
			}
		}
		catch {
			continue
		}
	}

	return $false
}

if (Try-ExtractFromExeFile -Exe $exePath -Output $iconPath) {
	exit 0
}

if (Try-ExtractFromRunningWindow -Exe $exePath -Output $iconPath) {
	exit 0
}

throw "Failed to extract icon from exe file or running window: $exePath"
`
}

export async function extractIconFromExe(
  exePath: string,
  iconSavePath: string,
  timeoutMs = 10_000,
): Promise<string> {
  if (!exePath || !iconSavePath) {
    throw new Error(
      'extractIconFromExe(exePath, iconSavePath) 需要传入 exe 路径和 icon 保存路径',
    )
  }

  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error('timeoutMs 必须是大于 0 的数字（毫秒）')
  }

  const resolvedExePath = path.resolve(exePath)
  const resolvedIconPath = path.resolve(iconSavePath)

  await fs.promises.access(resolvedExePath, fs.constants.F_OK).catch(() => {
    throw new Error(`EXE 文件不存在: ${resolvedExePath}`)
  })

  const psScript = buildPowerShellScript()
  const encoded = Buffer.from(psScript, 'utf16le').toString('base64')

  const args = [
    '-NoProfile',
    '-NonInteractive',
    '-ExecutionPolicy',
    'Bypass',
    '-EncodedCommand',
    encoded,
  ]

  let stdout = ''
  try {
    const result = await execFileAsync('powershell.exe', args, {
      encoding: 'utf8',
      env: {
        ...process.env,
        EXE_PATH: resolvedExePath,
        ICON_PATH: resolvedIconPath,
      },
      maxBuffer: 10 * 1024 * 1024,
      timeout: timeoutMs,
    })
    stdout = result.stdout || ''
  } catch (error) {
    const err = error as {
      stderr?: string
      stdout?: string
      message?: string
      code?: string
      signal?: NodeJS.Signals
      killed?: boolean
    }

    if (err.code === 'ETIMEDOUT' || err.killed) {
      throw new Error(`图标提取超时（>${timeoutMs}ms）`)
    }

    const detail = (err.stderr || err.stdout || err.message || '').trim()
    throw new Error(`图标提取失败: ${detail || '未知错误'}`)
  }

  const lines = stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  return lines.at(-1) ?? resolvedIconPath
}

export default extractIconFromExe
