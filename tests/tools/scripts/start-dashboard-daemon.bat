@echo off
setlocal EnableExtensions

set "ROOT=D:\Project\IWMSTEST"
set "PORT=5077"
set "LOG_DIR=%ROOT%\test-results\dashboard-logs"
set "PID_FILE=%ROOT%\tools\dashboard\dashboard.pid"

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

REM Already running?
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%PORT% ^| findstr LISTENING') do (
  echo Dashboard already listening on http://localhost:%PORT% (PID %%a)
  > "%PID_FILE%" echo %%a
  exit /b 0
)

REM Locale-safe timestamp from PowerShell
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss"') do set "STAMP=%%i"
if "%STAMP%"=="" set "STAMP=fallback"
set "LOG_FILE=%LOG_DIR%\dashboard-%STAMP%.log"

echo [INFO] Starting dashboard... > "%LOG_FILE%"
echo [INFO] ROOT=%ROOT% >> "%LOG_FILE%"
echo [INFO] PORT=%PORT% >> "%LOG_FILE%"

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] node not found in PATH. >> "%LOG_FILE%"
  echo [ERROR] Node.js not found in PATH.
  echo [ERROR] Log: %LOG_FILE%
  exit /b 1
)

REM Start hidden process via PowerShell (robust quoting)
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$wd='%ROOT%'; $log='%LOG_FILE%'; $p = Start-Process -FilePath 'node' -ArgumentList 'tools/dashboard/server.js' -WorkingDirectory $wd -WindowStyle Hidden -RedirectStandardOutput $log -RedirectStandardError $log -PassThru; $p.Id | Out-File -FilePath '%PID_FILE%' -Encoding ascii"

REM Wait up to 12 seconds for listening port
set /a retries=0
:wait_loop
set /a retries+=1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%PORT% ^| findstr LISTENING') do (
  > "%PID_FILE%" echo %%a
  echo Dashboard started on http://localhost:%PORT% (PID %%a)
  echo Log: %LOG_FILE%
  exit /b 0
)
if %retries% GEQ 12 goto :failed
ping 127.0.0.1 -n 2 >nul
goto :wait_loop

:failed
echo [ERROR] Failed to start dashboard on port %PORT%.
echo [ERROR] Check log: %LOG_FILE%
exit /b 1
