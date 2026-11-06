@echo off
cd /d "%~dp0"
if exist "dist\server.cjs" (
  node dist\server.cjs > "%~dp0server.log" 2>&1
) else (
  call npx.cmd tsx server.ts > "%~dp0server.log" 2>&1
)
