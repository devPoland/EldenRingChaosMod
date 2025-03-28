@echo off
taskkill /IM EasyAntiCheat_EOS.exe /F

set SteamAppId=1245620
set SteamGameId=1245620

cd /d "C:\Program Files (x86)\Steam\steamapps\common\ELDEN RING\Game"
if not exist eldenring.exe cd Game
start eldenring.exe

start "" "%~dp0CHAOS MOD.CT"

cd /d "%~dp0..\\Rest"
node main.js

pause