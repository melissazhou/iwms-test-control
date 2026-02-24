@echo off
echo ====================================
echo IWMSTEST - Setup Script
echo ====================================
echo.

cd /d %~dp0

echo [1/4] Installing npm dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)

echo.
echo [2/4] Installing Playwright browsers...
call npx playwright install chromium
if %errorlevel% neq 0 (
    echo WARNING: Playwright browser install failed - may need manual install
)

echo.
echo [3/4] Creating auth directory...
if not exist "src\auth\.auth" mkdir "src\auth\.auth"

echo.
echo [4/4] Creating output directories...
if not exist "screenshots" mkdir screenshots
if not exist "test-results" mkdir test-results

echo.
echo ====================================
echo Setup complete!
echo ====================================
echo.
echo Next steps:
echo   1. Connect to VPN
echo   2. npm run env:check    (verify web endpoints)
echo   3. npm run db:check     (verify database)
echo   4. npm run data:seed    (check available test data)
echo   5. npm run test:smoke   (run smoke tests)
echo.
pause
