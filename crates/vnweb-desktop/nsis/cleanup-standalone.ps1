param(
    [Parameter(Mandatory)]
    [ValidateSet('PreserveData', 'Remove', 'ValidateDestination', 'CopyPortableData')]
    [string] $Mode
)

$ErrorActionPreference = 'Stop'

function Get-OptionalItem([string] $Path) {
    try {
        Get-Item -LiteralPath $Path -Force
    } catch [System.Management.Automation.ItemNotFoundException] {
        return
    }
}

function Get-InstallDirectory([string] $Path) {
    if ($Path -notmatch '^(?:[A-Za-z]:\\|\\\\[^\\]+\\[^\\]+\\)') {
        throw 'The installation directory must be an absolute Windows path.'
    }

    $resolved = [IO.Path]::GetFullPath($Path).TrimEnd('\')
    if ($resolved -eq [IO.Path]::GetPathRoot($resolved).TrimEnd('\')) {
        throw 'The installation directory cannot be a drive or share root.'
    }
    return $resolved
}

function Assert-RegularDirectoryTree([IO.FileSystemInfo] $Item) {
    if (-not $Item.PSIsContainer -or ($Item.Attributes -band [IO.FileAttributes]::ReparsePoint)) {
        throw "Not a regular directory: $($Item.FullName)"
    }

    $pending = [Collections.Generic.Stack[IO.DirectoryInfo]]::new()
    $pending.Push($Item)
    while ($pending.Count) {
        foreach ($child in $pending.Pop().EnumerateFileSystemInfos()) {
            if ($child.Attributes -band [IO.FileAttributes]::ReparsePoint) {
                throw "Cannot process a symbolic link or junction: $($child.FullName)"
            }
            if ($child.Attributes -band [IO.FileAttributes]::Directory) {
                $pending.Push($child)
            }
        }
    }
}

try {
    $installDir = Get-InstallDirectory $env:VNWEB_INSTALL_DIR
    $standalone = Join-Path $installDir 'standalone'
    $legacyData = Join-Path $standalone 'user-data'
    $portableData = Join-Path $installDir 'user-data'

    if ($Mode -in 'ValidateDestination', 'CopyPortableData') {
        $destination = Get-InstallDirectory $env:VNWEB_NEW_INSTALL_DIR
        if ($destination -ieq $installDir) { exit 0 }
        if ($destination.StartsWith("$installDir\", [StringComparison]::OrdinalIgnoreCase) -or
            $installDir.StartsWith("$destination\", [StringComparison]::OrdinalIgnoreCase)) {
            throw 'The old and new installation directories must not overlap.'
        }

        $source = Get-OptionalItem $portableData
        if (-not $source -and $Mode -eq 'ValidateDestination') {
            $source = Get-OptionalItem $legacyData
        }
        if (-not $source -and -not (Get-OptionalItem (Join-Path $installDir 'portable'))) { exit 0 }
        $destinationData = Join-Path $destination 'user-data'
        if (Get-OptionalItem $destinationData) {
            throw "The destination already contains portable user data: $destinationData"
        }
        if ($source) { Assert-RegularDirectoryTree $source }
        if ($Mode -eq 'CopyPortableData') {
            [IO.Directory]::CreateDirectory($destination) | Out-Null
            $staging = Join-Path $destination ('.vnweb-user-data-' + [guid]::NewGuid().ToString('N'))
            if ($source) {
                Copy-Item -LiteralPath $source.FullName -Destination $staging -Recurse -Force
            } else {
                [IO.Directory]::CreateDirectory($staging) | Out-Null
            }
            [IO.Directory]::Move($staging, $destinationData)
        }
        exit 0
    }

    $item = Get-OptionalItem $standalone
    if (-not $item) {
        exit 0
    }
    Assert-RegularDirectoryTree $item

    if ($env:VNWEB_DATA_DIR) {
        $dataDir = $env:VNWEB_DATA_DIR
        if (-not [IO.Path]::IsPathRooted($dataDir)) {
            $dataDir = Join-Path $standalone $dataDir
        }
        $dataDir = [IO.Path]::GetFullPath($dataDir).TrimEnd('\')
        if ($dataDir -ieq $standalone -or $dataDir.StartsWith("$standalone\", [StringComparison]::OrdinalIgnoreCase)) {
            throw "VNWEB_DATA_DIR points inside the bundled standalone directory: $dataDir"
        }
    }

    $legacyItem = Get-OptionalItem $legacyData
    if ($legacyItem) {
        if ($Mode -ne 'PreserveData' -or -not $legacyItem.PSIsContainer -or
            ($legacyItem.Attributes -band [IO.FileAttributes]::ReparsePoint) -or
            (Get-OptionalItem $portableData)) {
            throw "Cannot safely move portable user data from $legacyData to $portableData."
        }
        [IO.Directory]::Move($legacyData, $portableData)
    }

    if ($Mode -eq 'Remove') {
        Remove-Item -LiteralPath $standalone -Recurse -Force
    }
} catch {
    [Console]::Error.WriteLine($_.Exception.Message)
    exit 1
}
