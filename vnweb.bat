@echo off
cd /d "%~dp0"
if "%~1"=="" (
	npm run start
) else (
	npm run cli -- %*
)
