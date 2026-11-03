@echo off
echo Starting VOCA Full-Stack Application...
start "VOCA Backend (FastAPI)" cmd /k "%~dp0start_backend.bat"
timeout /t 2 /nobreak > nul
start "VOCA Frontend (React Vite)" cmd /k "%~dp0start_frontend.bat"
echo VOCA servers launched! Opening browser at http://localhost:5173 ...
timeout /t 3 /nobreak > nul
start http://localhost:5173
