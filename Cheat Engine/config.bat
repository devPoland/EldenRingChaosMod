@echo off
cd /d "%~dp0..\REST"

start cmd /k "node server.js"

timeout /t 1 /nobreak >nul

start "" "..\REST\ChaosModPage\index.html"

exit