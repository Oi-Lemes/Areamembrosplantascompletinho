@echo off
echo ==========================================
echo      INICIANDO O PROJETO DORASIL
echo ==========================================

echo.
echo [1/2] Iniciando o Backend...
start "Backend - Porta 3001" cmd /k "cd backend && npm.cmd start"

echo.
echo [2/2] Iniciando o Frontend...
start "Frontend - Porta 3000" cmd /k "cd frontend && npm.cmd run dev"

echo.
echo ==========================================
echo        TUDO INICIADO!
echo ==========================================
echo.
echo O Backend vai rodar na janelinha preta que abriu.
echo O Frontend vai rodar na outra janelinha.
echo.
echo.
echo Acesse o site em: http://localhost:3000
echo.
