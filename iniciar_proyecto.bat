@echo off
title XploraSG - Iniciando Servicios
echo ============================================
echo         Iniciando Proyecto XploraSG
echo ============================================
echo.

echo 1. Iniciando Backend (Servidor API en puerto 3000)...
start "XploraSG - Backend" cmd /k "cd /d %~dp0backend && npm run dev"

echo 2. Iniciando Frontend (Interfaz Web en puerto 5173)...
start "XploraSG - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Esperando que inicien los servidores...
timeout /t 4 /nobreak >nul

echo 3. Abriendo la aplicacion en tu navegador...
start http://localhost:5173

echo.
echo ============================================
echo   Listo! La web se ha abierto en tu navegador.
echo   (Nota: No cierres las terminales de Backend
echo    y Frontend mientras uses la pagina).
echo ============================================
pause
