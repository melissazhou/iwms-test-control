@echo off
setlocal

set "ROOT=D:\Project\IWMSTEST"
set "PORT=5077"
set "PID_FILE=%ROOT%\tools\dashboard\dashboard.pid"

if exist "%PID_FILE%" (
  set /p PID=<"%PID_FILE%"
  if not "%PID%"=="" (
    taskkill /PID %PID% /T /F >nul 2>&1
  )
  del "%PID_FILE%" >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%PORT% ^| findstr LISTENING') do (
  taskkill /PID %%a /T /F >nul 2>&1
)

echo Dashboard stopped.
