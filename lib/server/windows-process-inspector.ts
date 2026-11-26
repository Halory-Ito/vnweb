import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { StringDecoder } from 'node:string_decoder'

import type { WindowsProcessInfo } from '@/lib/game-tracking'

const SNAPSHOT_END_SENTINEL = '__VNWEB_SNAPSHOT_END__'
const SNAPSHOT_TIMEOUT_MS = 10_000

const PROCESS_SNAPSHOT_CSHARP = `
using System;
using System.Runtime.InteropServices;
using System.Text;

public static class VnwebProcessSnapshot {
  private const uint TH32CS_SNAPPROCESS = 0x00000002;
  private const uint PROCESS_QUERY_LIMITED_INFORMATION = 0x1000;

  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  private struct PROCESSENTRY32W {
    public uint dwSize;
    public uint cntUsage;
    public uint th32ProcessID;
    public IntPtr th32DefaultHeapID;
    public uint th32ModuleID;
    public uint cntThreads;
    public uint th32ParentProcessID;
    public int pcPriClassBase;
    public uint dwFlags;
    [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 260)]
    public string szExeFile;
  }

  [DllImport("kernel32.dll", SetLastError = true)]
  private static extern IntPtr CreateToolhelp32Snapshot(uint dwFlags, uint th32ProcessID);

  [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
  private static extern bool Process32FirstW(IntPtr hSnapshot, ref PROCESSENTRY32W lppe);

  [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
  private static extern bool Process32NextW(IntPtr hSnapshot, ref PROCESSENTRY32W lppe);

  [DllImport("kernel32.dll", SetLastError = true)]
  private static extern IntPtr OpenProcess(uint dwDesiredAccess, bool bInheritHandle, uint dwProcessId);

  [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
  private static extern bool QueryFullProcessImageNameW(
    IntPtr hProcess,
    uint dwFlags,
    StringBuilder lpExeName,
    ref uint lpdwSize
  );

  [DllImport("kernel32.dll", SetLastError = true)]
  private static extern bool CloseHandle(IntPtr hObject);

  private static string TryGetProcessPath(uint pid) {
    if (pid == 0) return "";
    IntPtr handle = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid);
    if (handle == IntPtr.Zero) return "";
    try {
      uint capacity = 1024;
      var sb = new StringBuilder((int)capacity);
      if (QueryFullProcessImageNameW(handle, 0, sb, ref capacity)) {
        return sb.ToString();
      }
      return "";
    } finally {
      CloseHandle(handle);
    }
  }

  public static string DumpAll() {
    IntPtr snap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (snap == IntPtr.Zero || snap == new IntPtr(-1)) return "";
    var sb = new StringBuilder();
    try {
      var entry = new PROCESSENTRY32W();
      entry.dwSize = (uint)Marshal.SizeOf(typeof(PROCESSENTRY32W));
      if (Process32FirstW(snap, ref entry)) {
        do {
          string path = TryGetProcessPath(entry.th32ProcessID);
          sb.Append(entry.th32ProcessID)
            .Append('\\t')
            .Append(entry.szExeFile ?? "")
            .Append('\\t')
            .Append(path)
            .Append('\\n');
        } while (Process32NextW(snap, ref entry));
      }
    } finally {
      CloseHandle(snap);
    }
    return sb.ToString();
  }
}
`.trim()

type PendingSnapshotRequest = {
  lines: string[]
  resolve: (processes: WindowsProcessInfo[]) => void
  timer: NodeJS.Timeout
}

type InspectorState = {
  child: ChildProcessWithoutNullStreams | null
  decoder: StringDecoder
  lineBuffer: string
  pending: PendingSnapshotRequest | null
  chain: Promise<WindowsProcessInfo[]>
}

const globalForInspector = globalThis as typeof globalThis & {
  __vnwebProcessInspectorState?: InspectorState
}

function getInspectorState(): InspectorState {
  if (!globalForInspector.__vnwebProcessInspectorState) {
    globalForInspector.__vnwebProcessInspectorState = {
      child: null,
      decoder: new StringDecoder('utf8'),
      lineBuffer: '',
      pending: null,
      chain: Promise.resolve([]),
    }
  }
  return globalForInspector.__vnwebProcessInspectorState
}

function parseSnapshotLines(lines: string[]): WindowsProcessInfo[] {
  const result: WindowsProcessInfo[] = []
  for (const line of lines) {
    if (!line) continue
    const firstTab = line.indexOf('\t')
    if (firstTab <= 0) continue
    const secondTab = line.indexOf('\t', firstTab + 1)
    if (secondTab < 0) continue

    const pid = Number(line.slice(0, firstTab))
    if (!Number.isInteger(pid) || pid <= 0) continue

    result.push({
      pid,
      name: line.slice(firstTab + 1, secondTab).trim(),
      executablePath: line.slice(secondTab + 1).trim(),
    })
  }
  return result
}

function resolvePendingWithEmpty(state: InspectorState) {
  const current = state.pending
  if (!current) return
  state.pending = null
  clearTimeout(current.timer)
  current.resolve([])
}

function destroyChild(state: InspectorState, forceKill = false) {
  const child = state.child
  state.child = null
  state.lineBuffer = ''
  state.decoder = new StringDecoder('utf8')
  resolvePendingWithEmpty(state)

  if (!child) return

  child.removeAllListeners()
  child.stdout.removeAllListeners()
  child.stderr.removeAllListeners()
  child.stdin.removeAllListeners()

  if (forceKill) {
    try {
      child.kill()
    } catch {
      // Ignore already exited child process
    }
    return
  }

  try {
    child.stdin.write('EXIT\n')
    child.stdin.end()
  } catch {
    try {
      child.kill()
    } catch {
      // Ignore already exited child process
    }
    return
  }

  const killTimer = setTimeout(() => {
    try {
      if (child.exitCode === null) {
        child.kill()
      }
    } catch {
      // Ignore
    }
  }, 500)
  killTimer.unref?.()
}

function ensureWorkerChild(state: InspectorState): ChildProcessWithoutNullStreams {
  if (state.child && state.child.exitCode === null && !state.child.killed) {
    return state.child
  }

  const workerScript = `
$ProgressPreference = 'SilentlyContinue'
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$reader = New-Object System.IO.StreamReader([Console]::OpenStandardInput(), $utf8NoBom)
$writer = New-Object System.IO.StreamWriter([Console]::OpenStandardOutput(), $utf8NoBom)
$writer.AutoFlush = $true
$code = @'
${PROCESS_SNAPSHOT_CSHARP}
'@
Add-Type -TypeDefinition $code
while ($true) {
  $cmd = $reader.ReadLine()
  if ($null -eq $cmd -or $cmd -eq 'EXIT') { break }
  if ($cmd -eq 'SCAN') {
    $out = [VnwebProcessSnapshot]::DumpAll()
    if ($out) {
      $writer.Write($out)
    }
    $writer.WriteLine('${SNAPSHOT_END_SENTINEL}')
  }
}
`.trim()

  const encoded = Buffer.from(workerScript, 'utf16le').toString('base64')
  const child = spawn(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-EncodedCommand', encoded],
    {
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    },
  )

  state.child = child
  state.lineBuffer = ''
  state.decoder = new StringDecoder('utf8')

  child.stdout.on('data', (chunk: Buffer) => {
    if (state.child !== child) return
    state.lineBuffer += state.decoder.write(chunk)

    const parts = state.lineBuffer.split(/\r?\n/)
    state.lineBuffer = parts.pop() ?? ''

    for (const rawLine of parts) {
      const pending = state.pending
      if (!pending) continue

      if (rawLine === SNAPSHOT_END_SENTINEL) {
        state.pending = null
        clearTimeout(pending.timer)
        pending.resolve(parseSnapshotLines(pending.lines))
      } else {
        pending.lines.push(rawLine)
      }
    }
  })

  child.stderr.on('data', () => undefined)

  const handleTerminate = () => {
    if (state.child === child) {
      state.child = null
      state.lineBuffer = ''
      state.decoder = new StringDecoder('utf8')
      resolvePendingWithEmpty(state)
    }
  }

  child.on('exit', handleTerminate)
  child.on('error', handleTerminate)

  return child
}

function runSingleSnapshot(state: InspectorState): Promise<WindowsProcessInfo[]> {
  return new Promise<WindowsProcessInfo[]>((resolve) => {
    let child: ChildProcessWithoutNullStreams
    try {
      child = ensureWorkerChild(state)
    } catch {
      resolve([])
      return
    }

    const timer = setTimeout(() => {
      if (state.pending) {
        destroyChild(state, true)
      }
    }, SNAPSHOT_TIMEOUT_MS)
    timer.unref?.()

    state.pending = {
      lines: [],
      resolve,
      timer,
    }

    try {
      child.stdin.write('SCAN\n')
    } catch {
      destroyChild(state, true)
    }
  })
}

export async function captureWindowsProcessSnapshot(): Promise<WindowsProcessInfo[]> {
  if (process.platform !== 'win32') {
    return []
  }

  const state = getInspectorState()
  const next = state.chain.then(() => runSingleSnapshot(state))
  state.chain = next.catch(() => [])
  return next
}

export function stopWindowsProcessInspector(): void {
  if (!globalForInspector.__vnwebProcessInspectorState) {
    return
  }

  destroyChild(globalForInspector.__vnwebProcessInspectorState, false)
}
