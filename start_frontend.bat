@echo off
title VOCA Frontend (Port 5173)
echo ========================================================
echo Starting VOCA Frontend (Vite on Port 5173)...
echo ========================================================
cd /d "%~dp0frontend"

call npm run dev

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Frontend exited with error code %ERRORLEVEL%.
    pause
)
