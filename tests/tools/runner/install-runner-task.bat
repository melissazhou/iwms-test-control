@echo off
setlocal EnableExtensions
set "TASK_NAME=IWMSTEST-CommandRunner"
set "SCRIPT=D:\Project\IWMSTEST\tools\runner\command-runner.ps1"
set "PS_EXE=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"

schtasks /Delete /TN "%TASK_NAME%" /F >nul 2>&1

schtasks /Create /F /SC ONLOGON /RL LIMITED /TN "%TASK_NAME%" /TR "\"%PS_EXE%\" -NoProfile -ExecutionPolicy Bypass -File \"%SCRIPT%\""
if %errorlevel% neq 0 (
  echo Failed to create task.
  exit /b 1
)

schtasks /Run /TN "%TASK_NAME%" >nul 2>&1
if %errorlevel% neq 0 (
  echo Task created but failed to run immediately.
  exit /b 1
)

echo Command runner task recreated and started.
