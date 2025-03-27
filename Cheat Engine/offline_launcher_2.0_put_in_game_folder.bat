@echo off
taskkill /IM EasyAntiCheat_EOS.exe /F
set SteamAppId=1245620
set SteamGameId=1245620
if not exist eldenring.exe cd Game
start eldenring.exe