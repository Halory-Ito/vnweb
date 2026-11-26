import { spawn } from 'node:child_process'

export const FOLDER_PICKER_CSHARP_SOURCE = `
using System;
using System.Runtime.InteropServices;

public static class VnwebModernFolderPicker {
  [ComImport, Guid("DC1C5A9C-E88A-4dde-A5A1-60F82A20AEF7")]
  private class FileOpenDialogCom {}

  [ComImport, Guid("42f85136-db7e-439c-85f1-e4075d135fc8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  private interface IFileOpenDialog {
    [PreserveSig] int Show(IntPtr parent);
    void SetFileTypes(uint cFileTypes, IntPtr rgFilterSpec);
    void SetFileTypeIndex(uint iFileType);
    void GetFileTypeIndex(out uint piFileType);
    void Advise(IntPtr pfde, out uint pdwCookie);
    void Unadvise(uint dwCookie);
    void SetOptions(uint fos);
    void GetOptions(out uint pfos);
    void SetDefaultFolder(IShellItem psi);
    void SetFolder(IShellItem psi);
    void GetFolder(out IShellItem ppsi);
    void GetCurrentSelection(out IShellItem ppsi);
    void SetFileName([MarshalAs(UnmanagedType.LPWStr)] string pszName);
    void GetFileName([MarshalAs(UnmanagedType.LPWStr)] out string pszName);
    void SetTitle([MarshalAs(UnmanagedType.LPWStr)] string pszTitle);
    void SetOkButtonLabel([MarshalAs(UnmanagedType.LPWStr)] string pszText);
    void SetFileNameLabel([MarshalAs(UnmanagedType.LPWStr)] string pszLabel);
    void GetResult(out IShellItem ppsi);
    void AddPlace(IShellItem psi, int alignment);
    void SetDefaultExtension([MarshalAs(UnmanagedType.LPWStr)] string pszDefaultExtension);
    void Close(int hr);
    void SetClientGuid(ref Guid guid);
    void ClearClientData();
    void SetFilter(IntPtr pFilter);
    void GetResults(out IntPtr ppenum);
    void GetSelectedItems(out IntPtr ppsai);
  }

  [ComImport, Guid("43826D1E-E718-42EE-BC55-A1E261C37BFE"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  private interface IShellItem {
    void BindToHandler(IntPtr pbc, ref Guid bhid, ref Guid riid, out IntPtr ppv);
    void GetParent(out IShellItem ppsi);
    void GetDisplayName(uint sigdnName, [MarshalAs(UnmanagedType.LPWStr)] out string ppszName);
    void GetAttributes(uint sfgaoMask, out uint psfgaoAttribs);
    void Compare(IShellItem psi, uint hint, out int piOrder);
  }

  public static string PickFolder(string title) {
    var dialog = (IFileOpenDialog)new FileOpenDialogCom();
    IShellItem item = null;
    try {
      uint options;
      dialog.GetOptions(out options);
      // FOS_PICKFOLDERS (0x20) | FOS_FORCEFILESYSTEM (0x40) | FOS_PATHMUSTEXIST (0x800)
      dialog.SetOptions(options | 0x20u | 0x40u | 0x800u);
      if (!string.IsNullOrEmpty(title)) {
        dialog.SetTitle(title);
      }
      int hr = dialog.Show(IntPtr.Zero);
      if (hr != 0) return null;
      dialog.GetResult(out item);
      string path;
      item.GetDisplayName(0x80058000u, out path);
      return path;
    } finally {
      if (item != null) Marshal.ReleaseComObject(item);
      Marshal.ReleaseComObject(dialog);
    }
  }
}
`.trim()

function escapePowerShellSingleQuoted(value: string): string {
  return value.replace(/'/g, "''")
}

function runPowerShellDialog(script: string): Promise<string | null> {
  return new Promise<string | null>((resolve) => {
    const fullScript = `
$ProgressPreference = 'SilentlyContinue'
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
${script}
`.trim()

    const encoded = Buffer.from(fullScript, 'utf16le').toString('base64')
    const child = spawn(
      'powershell.exe',
      ['-NoProfile', '-STA', '-OutputFormat', 'Text', '-EncodedCommand', encoded],
      {
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    )

    const chunks: Buffer[] = []
    child.stdout.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
    })

    child.on('close', (code) => {
      const output = Buffer.concat(chunks).toString('utf8').trim()
      resolve(code === 0 && output ? output : null)
    })

    child.on('error', () => {
      resolve(null)
    })
  })
}

export async function pickWindowsDirectory(title = '选择目录'): Promise<string | null> {
  const safeTitle = title.trim() || '选择目录'
  const script = `
$dialogTitle = '${escapePowerShellSingleQuoted(safeTitle)}'
$code = @'
${FOLDER_PICKER_CSHARP_SOURCE}
'@
Add-Type -TypeDefinition $code
$picked = [VnwebModernFolderPicker]::PickFolder($dialogTitle)
if ($picked) {
  Write-Output $picked
}
`
  return runPowerShellDialog(script)
}

export async function pickWindowsFile(options?: {
  title?: string
  filter?: string
}): Promise<string | null> {
  const safeTitle = options?.title?.trim() || '选择文件'
  const safeFilter = options?.filter?.trim() || ''
  const script = `
Add-Type -AssemblyName System.Windows.Forms
$dialog = New-Object System.Windows.Forms.OpenFileDialog
$dialog.Title = '${escapePowerShellSingleQuoted(safeTitle)}'
$dialog.Multiselect = $false
${safeFilter ? `$dialog.Filter = '${escapePowerShellSingleQuoted(safeFilter)}'` : ''}
if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
  Write-Output $dialog.FileName
}
`
  return runPowerShellDialog(script)
}
