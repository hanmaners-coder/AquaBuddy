@echo off
chcp 65001 > nul
echo ===================================================
echo 🚀 AquaBuddy 깃허브 자동 업로드 (Git Push)
echo ===================================================
echo.

git add .
git commit -m "Auto Update: %date% %time%"
git push -u origin main

echo.
echo ===================================================
echo ✅ 깃허브 업로드가 성공적으로 완료되었습니다!
echo ===================================================
pause
