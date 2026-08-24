@echo off
setlocal enabledelayedexpansion
title AquaBuddy GitHub Auto Push

echo [1/3] Git add files...
git add .

echo [2/3] Git commit...
git commit -m "V780: Leaflet Ocean Map Integration"

echo [3/3] Git push to GitHub...
git push -u origin main

echo.
echo ===================================================
echo [SUCCESS] GitHub Push Finished!
echo ===================================================
pause
