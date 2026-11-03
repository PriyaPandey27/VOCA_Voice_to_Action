@echo off
echo ========================================================
echo Starting VOCA (Backend on 8000 + Frontend on 5173)...
echo ========================================================

start "" "%~dp0start_backend.bat"
timeout /t 3 /nobreak >nul
start "" "%~dp0start_frontend.bat"

echo.
echo ========================================================
echo VOCA has been launched!
echo Check that both the Backend and Frontend windows are open.
echo Open your browser at: http://localhost:5173
echo ========================================================
