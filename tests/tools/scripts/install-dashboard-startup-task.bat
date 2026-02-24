@echo off
setlocal

set "TASK_NAME=IWMSTEST-Dashboard"
set "SCRIPT=D:\Project\IWMSTEST\tools\scripts\start-dashboard-daemon.bat"

schtasks /Create /F /SC ONLOGON /RL LIMITED /TN "%TASK_NAME%" /TR "\"%SCRIPT%\""
if %errorlevel% neq 0 (
  echo Scheduled task creation failed, trying HKCU Run fallback...
  reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v IWMSTEST_Dashboard /t REG_SZ /d "\"%SCRIPT%\"" /f >nul 2>&1
  if %errorlevel% neq 0 (
    echo Failed to create startup task and HKCU Run fallback.
    exit /b 1
  )
  echo HKCU Run startup entry created successfully.
  exit /b 0
)

echo Startup task created: %TASK_NAME%
echo It will auto-start dashboard at logon.
