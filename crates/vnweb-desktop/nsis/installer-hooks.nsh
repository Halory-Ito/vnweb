!define VNWEB_CLEANUP_SCRIPT "${__FILEDIR__}\cleanup-standalone.ps1"

!macro VNWEB_ABORT_CLEANUP
  MessageBox MB_OK|MB_ICONSTOP "$(vnwebCleanupFailed)" /SD IDOK
  SetErrorLevel 1
  Quit
!macroend

!macro VNWEB_CLEANUP_STANDALONE mode directory
  InitPluginsDir
  SetOutPath "$PLUGINSDIR"
  File /oname=cleanup-standalone.ps1 "${VNWEB_CLEANUP_SCRIPT}"
  System::Call 'Kernel32::SetEnvironmentVariable(t "VNWEB_INSTALL_DIR", t "${directory}")'
  nsExec::ExecToLog '"$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "$PLUGINSDIR\cleanup-standalone.ps1" -Mode ${mode}'
  Pop $0
  ${If} $0 != 0
    !insertmacro VNWEB_ABORT_CLEANUP
  ${EndIf}
!macroend

!macro NSIS_HOOK_PREINSTALL
  ReadRegStr $R8 SHCTX "${UNINSTKEY}" "UninstallString"
  ReadRegStr $R9 SHCTX "${MANUPRODUCTKEY}" ""

  ${If} $R8 != ""
    ; Only run the NSIS uninstaller registered by this product.
    ${If} $R9 == ""
    ${OrIf} $R8 != "$\"$R9\uninstall.exe$\""
    ${OrIfNot} ${FileExists} "$R9\uninstall.exe"
      !insertmacro VNWEB_ABORT_CLEANUP
    ${EndIf}

    System::Call 'Kernel32::SetEnvironmentVariable(t "VNWEB_NEW_INSTALL_DIR", t "$INSTDIR")'
    !insertmacro VNWEB_CLEANUP_STANDALONE ValidateDestination $R9
    !insertmacro VNWEB_CLEANUP_STANDALONE PreserveData $R9
    ClearErrors
    ExecWait '"$R9\uninstall.exe" /S /UPDATE _?=$R9' $0
    ${If} ${Errors}
    ${OrIf} $0 != 0
    ${OrIf} ${FileExists} "$R9\${MAINBINARYNAME}.exe"
      !insertmacro VNWEB_ABORT_CLEANUP
    ${EndIf}
    Delete "$R9\uninstall.exe"
    !insertmacro VNWEB_CLEANUP_STANDALONE Remove $R9
    !insertmacro VNWEB_CLEANUP_STANDALONE CopyPortableData $R9
  ${ElseIf} $R9 != ""
  ${AndIf} $R9 == $INSTDIR
    ; Retry cleanup if the previous uninstaller ran but left generated files.
    !insertmacro VNWEB_CLEANUP_STANDALONE PreserveData $INSTDIR
    !insertmacro VNWEB_CLEANUP_STANDALONE Remove $INSTDIR
  ${EndIf}
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  !insertmacro VNWEB_CLEANUP_STANDALONE PreserveData $INSTDIR
  !insertmacro VNWEB_CLEANUP_STANDALONE Remove $INSTDIR
!macroend

!macro NSIS_HOOK_POSTINSTALL
  System::Call 'Kernel32::SetEnvironmentVariable(t "VNWEB_INSTALL_DIR", t "$INSTDIR")'
  nsExec::ExecToLog `powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "$$d = [string]$$env:VNWEB_INSTALL_DIR; $$d = $$d.TrimEnd('\'); if (-not $$d) { exit 0 }; $$k = [Microsoft.Win32.Registry]::CurrentUser.CreateSubKey('Environment'); $$r = [string]$$k.GetValue('Path', '', [Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames); $$a = @($$r -split ';' | Where-Object { $$_ }); if (-not ($$a | Where-Object { [Environment]::ExpandEnvironmentVariables($$_).TrimEnd('\') -ieq $$d })) { $$k.SetValue('Path', (($$a + $$d) -join ';'), [Microsoft.Win32.RegistryValueKind]::ExpandString) }; $$k.Close()"`
  Pop $0
  SendMessage 0xffff 0x001A 0 "STR:Environment" /TIMEOUT=5000
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  System::Call 'Kernel32::SetEnvironmentVariable(t "VNWEB_INSTALL_DIR", t "$INSTDIR")'
  nsExec::ExecToLog `powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "$$d = [string]$$env:VNWEB_INSTALL_DIR; $$d = $$d.TrimEnd('\'); if (-not $$d) { exit 0 }; $$k = [Microsoft.Win32.Registry]::CurrentUser.OpenSubKey('Environment', $$true); if (-not $$k) { exit 0 }; $$r = [string]$$k.GetValue('Path', '', [Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames); $$a = @($$r -split ';' | Where-Object { $$_ }); $$f = @($$a | Where-Object { [Environment]::ExpandEnvironmentVariables($$_).TrimEnd('\') -ine $$d }); if ($$f.Count -ne $$a.Count) { $$k.SetValue('Path', ($$f -join ';'), [Microsoft.Win32.RegistryValueKind]::ExpandString) }; $$k.Close()"`
  Pop $0
  SendMessage 0xffff 0x001A 0 "STR:Environment" /TIMEOUT=5000
!macroend
