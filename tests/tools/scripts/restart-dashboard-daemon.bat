@echo off
setlocal
call "%~dp0stop-dashboard-daemon.bat"
call "%~dp0start-dashboard-daemon.bat"
