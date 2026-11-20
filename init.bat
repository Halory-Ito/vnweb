@echo off
chcp 65001 >nul
setlocal EnableExtensions EnableDelayedExpansion
title vnweb 初始化

rem ============================================================
rem  vnweb 一键初始化脚本（Windows）
rem  1. 检查 Node.js / npm 环境
rem  2. 生成缺失的配置文件（.env、app/config.ts、app/config.json）
rem  3. 安装依赖（npm install）
rem  4. 备份已有数据库，并初始化新的数据库（drizzle-kit push）
rem  5. 构建生产版本（npm run build）
rem  6. 将项目目录加入用户 PATH，以便在任意位置使用 vnweb 命令
rem ============================================================

cd /d "%~dp0"
set "PROJECT_DIR=%~dp0"
if "%PROJECT_DIR:~-1%"=="\" set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"

echo.
echo ============================================================
echo   vnweb 初始化
echo   项目目录：%PROJECT_DIR%
echo ============================================================

rem ------------------------------------------------------------
echo.
echo [1/6] 检查运行环境...
rem ------------------------------------------------------------
where node >nul 2>nul
if errorlevel 1 (
  echo   [错误] 未检测到 Node.js，请先安装 Node.js 20.9 或更高版本：https://nodejs.org/
  goto :fail
)
where npm >nul 2>nul
if errorlevel 1 (
  echo   [错误] 未检测到 npm，请检查 Node.js 安装是否完整。
  goto :fail
)
node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>20||(a===20&&b>=9)?0:1)"
if errorlevel 1 (
  for /f "delims=" %%V in ('node -v') do set "NODE_VER=%%V"
  echo   [错误] 当前 Node.js 版本为 !NODE_VER!，需要 20.9 或更高版本。
  goto :fail
)
for /f "delims=" %%V in ('node -v') do echo   Node.js %%V
for /f "delims=" %%V in ('npm -v') do echo   npm     %%V

rem ------------------------------------------------------------
echo.
echo [2/6] 检查配置文件...
rem ------------------------------------------------------------
call :ensure_copy ".env.example" ".env"
if errorlevel 1 goto :fail
call :ensure_copy "app\config.example.ts" "app\config.ts"
if errorlevel 1 goto :fail
call :ensure_copy "app\config.example.json" "app\config.json"
if errorlevel 1 goto :fail

rem ------------------------------------------------------------
echo.
echo [3/6] 安装依赖（npm install）...
rem ------------------------------------------------------------
call npm install
if errorlevel 1 (
  echo   [错误] 依赖安装失败，请检查网络或 npm 镜像配置后重试。
  goto :fail
)

rem ------------------------------------------------------------
echo.
echo [4/6] 初始化数据库...
rem ------------------------------------------------------------
rem 解析数据库文件路径：默认 local.db，可由 .env 中的 DB_FILE_NAME 覆盖
set "DB_URL=file:./local.db"
if exist ".env" (
  for /f "usebackq eol=# tokens=1,* delims==" %%A in (".env") do (
    if /i "%%A"=="DB_FILE_NAME" set "DB_URL=%%~B"
  )
)
set "DB_FILE=!DB_URL:file:=!"
set "DB_FILE=!DB_FILE:/=\!"
for %%F in ("!DB_FILE!") do (
  set "DB_PATH=%%~fF"
  set "DB_DIR=%%~dpF"
  set "DB_NAME=%%~nF"
  set "DB_EXT=%%~xF"
)
echo   数据库文件：!DB_PATH!

if exist "!DB_PATH!" (
  for /f "delims=" %%T in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss"') do set "TS=%%T"
  set "BACKUP_DIR=%PROJECT_DIR%\backups\db"
  if not exist "!BACKUP_DIR!" mkdir "!BACKUP_DIR!"
  set "BACKUP_FILE=!BACKUP_DIR!\!DB_NAME!-!TS!!DB_EXT!"

  echo   检测到已有数据库，正在备份到：!BACKUP_FILE!
  move /y "!DB_PATH!" "!BACKUP_FILE!" >nul
  if errorlevel 1 (
    echo   [错误] 数据库备份失败：文件可能正被占用，请先关闭 vnweb 服务或 Drizzle Studio 后重试。
    goto :fail
  )
  if not exist "!BACKUP_FILE!" (
    echo   [错误] 未找到备份文件，已中止，原数据库未被删除。
    goto :fail
  )
  rem 同时备份 SQLite 的附属文件（WAL / SHM / 日志）
  for %%S in (-wal -shm -journal) do (
    if exist "!DB_PATH!%%S" move /y "!DB_PATH!%%S" "!BACKUP_FILE!%%S" >nul
  )
  echo   备份完成。
) else (
  echo   未检测到已有数据库，将直接创建新数据库。
)

if not exist "!DB_DIR!" mkdir "!DB_DIR!"
echo   正在根据 db\schema.ts 创建新数据库...
call npm run db:push -- --force
if errorlevel 1 (
  echo   [错误] 数据库初始化失败。
  if defined BACKUP_FILE echo   原数据库已备份在：!BACKUP_FILE!
  goto :fail
)
if not exist "!DB_PATH!" (
  echo   [错误] 数据库初始化后未找到数据库文件：!DB_PATH!
  goto :fail
)
echo   新数据库已创建。

rem ------------------------------------------------------------
echo.
echo [5/6] 构建生产版本（npm run build）...
rem ------------------------------------------------------------
call npm run build
if errorlevel 1 (
  echo   [错误] 项目构建失败，请查看上方日志。
  goto :fail
)

rem ------------------------------------------------------------
echo.
echo [6/6] 将 vnweb 添加到用户环境变量 PATH...
rem ------------------------------------------------------------
if /i "%VNWEB_INIT_SKIP_PATH%"=="1" (
  echo   已按 VNWEB_INIT_SKIP_PATH=1 跳过。
  goto :done
)
if not exist "%PROJECT_DIR%\vnweb.bat" (
  echo   [错误] 未找到 vnweb.bat：%PROJECT_DIR%\vnweb.bat
  goto :fail
)
rem 读取注册表中未展开的用户 PATH，避免把 %%USERPROFILE%% 等变量写死；写入后广播环境变量变更
set "VNWEB_DIR=%PROJECT_DIR%"
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$dir = $env:VNWEB_DIR.TrimEnd('\');" ^
  "$key = Get-Item 'HKCU:\Environment';" ^
  "$raw = $key.GetValue('Path', '', [Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames);" ^
  "$items = @($raw -split ';' | Where-Object { $_ -ne '' });" ^
  "if ($items | Where-Object { [Environment]::ExpandEnvironmentVariables($_).TrimEnd('\') -ieq $dir }) { exit 2 };" ^
  "Set-ItemProperty -Path 'HKCU:\Environment' -Name Path -Value (($items + $dir) -join ';') -Type ExpandString;" ^
  "[Environment]::SetEnvironmentVariable('VNWEB_INIT_REFRESH', '1', 'User');" ^
  "[Environment]::SetEnvironmentVariable('VNWEB_INIT_REFRESH', $null, 'User');" ^
  "exit 0"
set "PATH_RESULT=%errorlevel%"
if "%PATH_RESULT%"=="2" (
  echo   项目目录已在 PATH 中，无需重复添加。
) else if "%PATH_RESULT%"=="0" (
  echo   已添加：%PROJECT_DIR%
  echo   请重新打开终端窗口后使用 vnweb 命令。
) else (
  echo   [错误] 写入环境变量失败，请手动将以下目录加入 PATH：%PROJECT_DIR%
  goto :fail
)

:done
echo.
echo ============================================================
echo   初始化完成！
if defined BACKUP_FILE echo   旧数据库备份：!BACKUP_FILE!
echo   启动服务：vnweb            （默认端口 8999）
echo   命令行  ：vnweb ^<命令^>     （例如 vnweb list g 1 10）
echo ============================================================
call :pause_if_needed
endlocal
exit /b 0

:fail
echo.
echo ============================================================
echo   初始化未完成，请根据上方提示处理后重新运行 init.bat
echo ============================================================
call :pause_if_needed
endlocal
exit /b 1

rem ------------------------------------------------------------
rem  :ensure_copy <模板文件> <目标文件>  目标不存在时从模板复制
rem ------------------------------------------------------------
:ensure_copy
if exist "%~2" (
  echo   已存在：%~2
  exit /b 0
)
if not exist "%~1" (
  echo   [错误] 缺少模板文件：%~1
  exit /b 1
)
copy /y "%~1" "%~2" >nul
if errorlevel 1 (
  echo   [错误] 无法创建：%~2
  exit /b 1
)
echo   已创建：%~2（来自 %~1，可按需修改）
exit /b 0

:pause_if_needed
if /i not "%VNWEB_INIT_NO_PAUSE%"=="1" pause
exit /b 0
