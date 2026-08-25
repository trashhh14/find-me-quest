@echo off
cd /d "%~dp0"
start "Quest server" /b cmd /c "npm run dev -- --host 127.0.0.1 --port 3010"
timeout /t 3 /nobreak >nul
start "Quest" http://127.0.0.1:3010/
