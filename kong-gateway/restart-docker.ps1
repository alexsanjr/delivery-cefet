# Script para reiniciar o Docker Desktop
Write-Host "Parando Docker Desktop..." -ForegroundColor Yellow
Stop-Process -Name "Docker Desktop" -Force -ErrorAction SilentlyContinue

Write-Host "Aguardando 5 segundos..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "Iniciando Docker Desktop..." -ForegroundColor Green
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"

Write-Host "Aguardando Docker inicializar (30 segundos)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host "Docker reiniciado! Verificando status..." -ForegroundColor Green
docker version
