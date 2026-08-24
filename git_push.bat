@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion
title AquaBuddy GitHub Push

echo ===================================================
echo 🚀 AquaBuddy 깃허브 업로드 진행 중...
echo ===================================================
echo.

echo [1/3] 변경 파일 추적 중...
git add .

echo [2/3] 변경 사항 커밋 중...
git commit -m "Auto Update: %date%"

echo [3/3] 깃허브 서버로 전송 중...
git push -u origin main --force

echo.
echo ===================================================
echo ✅ 깃허브 업로드가 완벽하게 완료되었습니다!
echo ===================================================
echo.
timeout /t 5
