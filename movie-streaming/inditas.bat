@echo off
cd /d "%~dp0"
echo Nocturne inditasa... (az elso inditas 3-10 percig tarthat)
docker compose up -d --build
if errorlevel 1 (
  echo.
  echo Hiba tortent. Fut a Docker Desktop? Inditsd el, majd probald ujra.
  pause
  exit /b 1
)
echo.
echo Kesz! Nyisd meg: http://localhost:3000
timeout /t 8 >nul
start http://localhost:3000
pause
