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
