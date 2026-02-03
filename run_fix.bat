@echo off
REM Script para executar fix no VPS

setlocal enabledelayedexpansion

set VPS_HOST=46.202.147.151
set VPS_USER=root
set VPS_PASSWORD=2705#Data2705

echo.
echo ==== BOTIA FIX SCRIPT ====
echo.
echo [1] Copiando arquivo para VPS via SCP...

REM Tentar copiar o script
scp -o StrictHostKeyChecking=no "c:\Users\Code\OneDrive\Desktop\bot ia\VPS_FIX_SCRIPT.sh" "%VPS_USER%@%VPS_HOST%:/tmp/fix.sh" 2>&1

if errorlevel 1 (
    echo ERRO ao copiar - SSH pode pedir senha
    echo.
    echo Alternativa: Execute manualmente no VPS:
    echo.
    echo ssh root@46.202.147.151
    echo bash /tmp/fix.sh
    pause
    exit /b 1
)

echo OK - Arquivo copiado
echo.
echo [2] Executando script no VPS...

ssh -o StrictHostKeyChecking=no "%VPS_USER%@%VPS_HOST%" "bash /tmp/fix.sh" 2>&1

echo.
echo ==== CONCLUIDO ====
pause
