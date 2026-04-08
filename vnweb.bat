@echo off
cd /d "%~dp0"
if "%~1"=="" (
	npm run dev
) else (
	npm run cli -- %*
)
