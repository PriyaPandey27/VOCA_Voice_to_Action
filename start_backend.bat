@echo off
title VOCA Backend (Port 8000)
echo ========================================================
echo Starting VOCA Backend Server (FastAPI on Port 8000)...
echo ========================================================
cd /d "%~dp0backend"

if exist "%~dp0backend\.venv\Scripts\python.exe" (
    "%~dp0backend\.venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
) else (
    python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
)

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Backend exited with error code %ERRORLEVEL%.
    pause
)
